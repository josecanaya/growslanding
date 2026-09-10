mod child_env;
mod cli_detector;
mod cli_installer;
mod config;
mod context;
mod job_runner;
mod pairing;
mod prompt;
mod validate;

use std::sync::Arc;
use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;
use tokio::sync::RwLock;

struct AppState {
    running: Arc<RwLock<bool>>,
    caps_cache: Arc<RwLock<(std::time::Instant, Vec<cli_detector::CliStatus>)>>,
}

#[tauri::command]
fn detect_clis(state: tauri::State<'_, AppState>) -> Vec<cli_detector::CliStatus> {
    let fresh = cli_detector::detect_all();
    if let Ok(mut guard) = state.caps_cache.try_write() {
        *guard = (std::time::Instant::now(), fresh.clone());
    }
    fresh
}

#[tauri::command]
fn install_cli(id: String) -> cli_installer::InstallResult {
    cli_installer::install(&id)
}

#[tauri::command]
fn login_cli(id: String, bin: String) -> cli_installer::InstallResult {
    cli_installer::open_login(&id, std::path::Path::new(&bin))
}

#[tauri::command]
fn get_connection_status(app: tauri::AppHandle) -> serde_json::Value {
    let cfg = config::load(&app);
    serde_json::json!({
        "configured": cfg.url.is_some() && cfg.token.is_some(),
        "url": cfg.url,
    })
}

#[tauri::command]
fn apply_pair_url(app: tauri::AppHandle, raw: String) -> Result<String, String> {
    pairing::handle_pair_url(&app, raw.trim())?;
    kick_worker_after_pair(app);
    Ok("Emparejado. Ya podés usar Claude/Cursor en Grows.".into())
}

fn kick_worker_after_pair(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let state = app.state::<AppState>();
        if let Err(e) = start_worker(app.clone(), state).await {
            eprintln!("[pairing] no se pudo arrancar worker: {}", e);
        }
        let _ = app.emit("paired", true);
    });
}

#[tauri::command]
async fn start_worker(app: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut running = state.running.write().await;
    if *running {
        return Ok(());
    }
    *running = true;
    drop(running);

    // Detectar CLIs una sola vez al conectar — no en cada claim.
    {
        let fresh = tokio::task::spawn_blocking(cli_detector::detect_all)
            .await
            .unwrap_or_else(|_| vec![]);
        *state.caps_cache.write().await = (std::time::Instant::now(), fresh);
    }

    let cfg = config::load(&app);
    if let (Some(url), Some(token)) = (cfg.url.clone(), cfg.token.clone()) {
        if let Err(e) = prompt::fetch_and_cache(&url, &token).await {
            eprintln!("[prompt] no se pudo cargar contexto: {} — usando embebido", e);
        }
    }

    let flag = state.running.clone();
    let caps_cache = state.caps_cache.clone();
    tauri::async_runtime::spawn(async move {
        let mut ticks: u64 = 0;
        loop {
            if !*flag.read().await {
                break;
            }
            if ticks % 600 == 0 {
                // cada ~30 min (600 * 3s)
                let cfg = config::load(&app);
                if let (Some(url), Some(token)) = (cfg.url, cfg.token) {
                    let _ = prompt::fetch_and_cache(&url, &token).await;
                }
            }
            ticks = ticks.wrapping_add(1);
            if let Err(e) = poll_and_execute(&app, &caps_cache).await {
                eprintln!("[worker] {}", e);
            }
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;
        }
    });
    Ok(())
}

#[tauri::command]
async fn stop_worker(state: tauri::State<'_, AppState>) -> Result<(), String> {
    *state.running.write().await = false;
    Ok(())
}

async fn cached_caps(
    cache: &Arc<RwLock<(std::time::Instant, Vec<cli_detector::CliStatus>)>>,
) -> Vec<cli_detector::CliStatus> {
    {
        let guard = cache.read().await;
        // Reusar hasta 30 min. El sondeo en cada claim abría PowerShell vía shims npm.
        if !guard.1.is_empty() && guard.0.elapsed() < std::time::Duration::from_secs(1800) {
            return guard.1.clone();
        }
    }
    let fresh = tokio::task::spawn_blocking(cli_detector::detect_all)
        .await
        .unwrap_or_default();
    *cache.write().await = (std::time::Instant::now(), fresh.clone());
    fresh
}

async fn poll_and_execute(
    app: &tauri::AppHandle,
    caps_cache: &Arc<RwLock<(std::time::Instant, Vec<cli_detector::CliStatus>)>>,
) -> Result<(), String> {
    let cfg = config::load(app);
    let url = cfg.url.ok_or("sin config")?;
    let token = cfg.token.ok_or("sin token")?;
    let caps = cached_caps(caps_cache).await;
    let ready: Vec<_> = caps.iter().filter(|c| c.logged_in).cloned().collect();
    let capabilities_json: Vec<serde_json::Value> = ready
        .iter()
        .map(|c| {
            serde_json::json!({
                "id": c.id,
                "label": c.label,
                "models": default_models(&c.id),
                "limitDescription": ""
            })
        })
        .collect();

    let client = reqwest::Client::new();
    let claim: serde_json::Value = client
        .post(format!("{}/api/bridge/worker", url.trim_end_matches('/')))
        .bearer_auth(&token)
        .json(&serde_json::json!({
            "action": "claim",
            "capabilities": capabilities_json,
            "activity": "Esperando pedidos"
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let Some(job_val) = claim.get("job").filter(|v| !v.is_null()) else {
        return Ok(());
    };
    let lease: String = claim
        .get("leaseToken")
        .and_then(|v| v.as_str())
        .ok_or("sin lease")?
        .into();
    let job: job_runner::Job = serde_json::from_value(job_val.clone()).map_err(|e| e.to_string())?;

    let (activity_tx, mut activity_rx) = tokio::sync::mpsc::channel::<String>(16);
    let (cancel_tx, cancel_rx) = tokio::sync::watch::channel::<bool>(false);

    let hb_url = format!("{}/api/bridge/worker", url.trim_end_matches('/'));
    let hb_token = token.clone();
    let hb_job_id = job.id.clone();
    let hb_lease = lease.clone();
    let hb_client = client.clone();
    let cancel_tx_hb = cancel_tx.clone();
    let hb_task = tokio::spawn(async move {
        let mut last_activity = String::from("Procesando");
        let mut ticker = tokio::time::interval(std::time::Duration::from_secs(10));
        loop {
            tokio::select! {
                Some(a) = activity_rx.recv() => { last_activity = a; }
                _ = ticker.tick() => {
                    let body = serde_json::json!({
                        "action": "heartbeat",
                        "jobId": hb_job_id,
                        "leaseToken": hb_lease,
                        "activity": last_activity,
                    });
                    match hb_client.post(&hb_url).bearer_auth(&hb_token).json(&body).send().await {
                        Ok(resp) => {
                            if let Ok(json) = resp.json::<serde_json::Value>().await {
                                if json.get("cancelled").and_then(|v| v.as_bool()) == Some(true) {
                                    let _ = cancel_tx_hb.send(true);
                                    break;
                                }
                            }
                        }
                        Err(_) => {}
                    }
                }
                else => break,
            }
        }
    });

    let result = job_runner::execute(&job, &ready, activity_tx, cancel_rx).await;
    hb_task.abort();

    let body = match result {
        Ok(r) => serde_json::json!({
            "action": "complete",
            "jobId": job.id,
            "leaseToken": lease,
            "result": { "reply": r.reply, "operations": r.operations },
            "activity": "Propuesta entregada para revisión"
        }),
        Err(e) => serde_json::json!({
            "action": "fail",
            "jobId": job.id,
            "leaseToken": lease,
            "error": e,
            "activity": "No se pudo completar"
        }),
    };
    let response = client
        .post(format!("{}/api/bridge/worker", url.trim_end_matches('/')))
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("server rechazó {}: HTTP {}", body["action"], response.status()));
    }
    let ack: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    if ack.get("ok").and_then(|v| v.as_bool()) == Some(false)
        || ack.get("cancelled").and_then(|v| v.as_bool()) == Some(true)
    {
        eprintln!("[worker] el trabajo {} fue cancelado o perdió su reserva", job.id);
    }
    Ok(())
}

fn default_models(id: &str) -> Vec<serde_json::Value> {
    match id {
        "claude" => vec![
            serde_json::json!({"id":"sonnet","label":"Claude Sonnet","description":"Equilibrado"}),
            serde_json::json!({"id":"opus","label":"Claude Opus","description":"Mayor profundidad"}),
            serde_json::json!({"id":"haiku","label":"Claude Haiku","description":"Rápido"}),
        ],
        "openai" => vec![
            serde_json::json!({"id":"gpt-5.6-luna","label":"GPT-5.6 Luna","description":"Rápido"}),
        ],
        "cursor" => vec![
            serde_json::json!({"id":"auto","label":"Auto","description":"Automático"}),
        ],
        _ => vec![],
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // Segunda instancia (grows:// con la app ya abierta) → aplicar URL acá.
            for arg in argv.iter().skip(1) {
                if arg.starts_with("grows://") {
                    if pairing::handle_pair_url(app, arg).is_ok() {
                        kick_worker_after_pair(app.clone());
                    }
                }
            }
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .manage(AppState {
            running: Arc::new(RwLock::new(false)),
            caps_cache: Arc::new(RwLock::new((
                std::time::Instant::now() - std::time::Duration::from_secs(120),
                Vec::new(),
            ))),
        })
        .setup(|app| {
            // Desarrollo / sideload: registrar grows:// si el instalador no lo hizo.
            #[cfg(desktop)]
            {
                if let Err(e) = app.deep_link().register("grows") {
                    eprintln!("[deep-link] register: {}", e);
                }
            }

            // Arranque en frío: Windows pasa grows://pair?... como argv.
            for arg in std::env::args().skip(1) {
                if arg.starts_with("grows://") {
                    match pairing::handle_pair_url(app.handle(), &arg) {
                        Ok(()) => {
                            eprintln!("[pairing] config desde argv");
                            kick_worker_after_pair(app.handle().clone());
                        }
                        Err(e) => eprintln!("[pairing] argv: {}", e),
                    }
                }
            }

            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    match pairing::handle_pair_url(&handle, url.as_str()) {
                        Ok(()) => {
                            eprintln!("[pairing] config guardada");
                            kick_worker_after_pair(handle.clone());
                        }
                        Err(e) => eprintln!("[pairing] {}", e),
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            detect_clis,
            install_cli,
            login_cli,
            get_connection_status,
            apply_pair_url,
            start_worker,
            stop_worker
        ])
        .run(tauri::generate_context!())
        .expect("error while running Grows Agent");
}
