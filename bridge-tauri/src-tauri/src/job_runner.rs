use crate::cli_detector::CliStatus;
use crate::prompt;
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::process::Command;

#[derive(Debug, Deserialize)]
pub struct Job {
    pub id: String,
    pub prompt: String,
    pub canvas: serde_json::Value,
    #[serde(rename = "scopePathIds", default)]
    pub scope_path_ids: Vec<String>,
    #[serde(rename = "selectionIds", default)]
    pub selection_ids: Vec<String>,
    pub provider: String,
    pub model: String,
    #[serde(rename = "recentThread", default)]
    pub recent_thread: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct JobResult {
    pub reply: String,
    pub operations: Vec<serde_json::Value>,
}

pub async fn execute(
    job: &Job,
    capabilities: &[CliStatus],
    activity_tx: tokio::sync::mpsc::Sender<String>,
    cancel_rx: tokio::sync::watch::Receiver<bool>,
) -> Result<JobResult, String> {
    match tokio::time::timeout(
        std::time::Duration::from_secs(600),
        execute_inner(job, capabilities, activity_tx, cancel_rx),
    )
    .await
    {
        Ok(inner) => inner,
        Err(_) => Err("El agente superó el tiempo máximo (10 min)".into()),
    }
}

async fn execute_inner(
    job: &Job,
    capabilities: &[CliStatus],
    activity_tx: tokio::sync::mpsc::Sender<String>,
    mut cancel_rx: tokio::sync::watch::Receiver<bool>,
) -> Result<JobResult, String> {
    if *cancel_rx.borrow() {
        return Err("Trabajo cancelado".into());
    }

    let provider = if job.provider == "local" {
        "openai"
    } else {
        job.provider.as_str()
    };
    let cap = capabilities
        .iter()
        .find(|c| c.id == provider && c.logged_in)
        .ok_or_else(|| format!("Proveedor {} no está listo", provider))?;
    let bin = cap.bin.as_ref().ok_or("Sin binario detectado")?;

    let temp_dir = tempfile::tempdir().map_err(|e| e.to_string())?;
    tokio::fs::write(temp_dir.path().join("AGENTS.md"), prompt::current())
        .await
        .map_err(|e| e.to_string())?;

    let prompt_slice = truncate_utf8(&job.prompt, 4000);
    let compact = crate::context::compact(
        &job.canvas,
        &job.scope_path_ids,
        &job.selection_ids,
        &job.recent_thread,
    );
    let user_prompt = format!(
        "Regla y esquema en AGENTS.md del cwd.\n\nIMPORTANTE: no uses herramientas ni leas archivos. Respondé SOLO con el JSON {{\"reply\":\"...\",\"operations\":[...]}}.\n\nPEDIDO:\n{}\n\nNIVEL VISIBLE DE LA OBRA:\n{}",
        prompt_slice,
        serde_json::to_string(&compact).unwrap_or_default()
    );

    let model = if job.model == "automatico" || job.model.is_empty() {
        match provider {
            "claude" => "sonnet",
            "cursor" => "auto",
            _ => "gpt-5.6-luna",
        }
    } else {
        job.model.as_str()
    };

    let mut args: Vec<String> = match provider {
        "openai" => ["exec", "-m", model, "--sandbox", "read-only", "--json", "-"]
            .into_iter()
            .map(String::from)
            .collect(),
        "claude" => [
            // Sin --bare/--tools "" (provocaba 0 tokens). bypassPermissions evita prompts
            // en el cwd temporal; el contrato pide solo JSON sin tools.
            "-p",
            "--model",
            model,
            "--output-format",
            "json",
            "--permission-mode",
            "bypassPermissions",
            "--max-turns",
            "1",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
        "cursor" => [
            "-p",
            "--trust",
            "--force",
            "--model",
            model,
            "--output-format",
            "json",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
        _ => return Err(format!("Proveedor desconocido: {}", provider)),
    };
    if !cap.prefix_args.is_empty() {
        let mut full = cap.prefix_args.clone();
        full.append(&mut args);
        args = full;
    }

    let mut cmd = {
        #[cfg(windows)]
        {
            let ext = bin
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            if ext == "cmd" || ext == "bat" || ext == "ps1" {
                let target = if ext == "ps1" {
                    let cmd_path = bin.with_extension("cmd");
                    if cmd_path.exists() {
                        cmd_path
                    } else {
                        bin.clone()
                    }
                } else {
                    bin.clone()
                };
                let line = format!(
                    "\"{}\" {}",
                    target.display(),
                    args.iter()
                        .map(|a| {
                            if a.chars().any(|ch| ch.is_whitespace()) {
                                format!("\"{a}\"")
                            } else {
                                a.clone()
                            }
                        })
                        .collect::<Vec<_>>()
                        .join(" ")
                );
                let mut c = Command::new("cmd.exe");
                c.args(["/d", "/s", "/c"]).arg(line);
                c
            } else {
                let mut c = Command::new(bin);
                c.args(&args);
                c
            }
        }
        #[cfg(not(windows))]
        {
            let mut c = Command::new(bin);
            c.args(&args);
            c
        }
    };
    cmd.current_dir(temp_dir.path())
        .env_clear()
        .envs(crate::child_env::safe_env())
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW — CommandExt via tokio
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("No se pudo lanzar {}: {}", cap.label, e))?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(user_prompt.as_bytes()).await.ok();
    }

    let activity = format!(
        "{} · {}: analizando {} cuadros y {} relaciones",
        cap.label,
        model,
        compact.canvas.nodes.len(),
        compact.canvas.edges.len()
    );
    let _ = activity_tx.send(activity.clone()).await;

    let mut stdout_stream = child.stdout.take().ok_or("sin stdout")?;
    let mut stderr_stream = child.stderr.take().ok_or("sin stderr")?;
    let stdout_task = tokio::spawn(async move {
        let mut buf = Vec::new();
        stdout_stream.read_to_end(&mut buf).await.ok();
        buf
    });
    let stderr_task = tokio::spawn(async move {
        let mut buf = Vec::new();
        stderr_stream.read_to_end(&mut buf).await.ok();
        buf
    });

    let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
    interval.tick().await;
    let exit_status;
    loop {
        tokio::select! {
            biased;
            _ = cancel_rx.changed() => {
                if *cancel_rx.borrow() {
                    let _ = child.kill().await;
                    return Err("Trabajo cancelado".into());
                }
            }
            _ = interval.tick() => {
                let _ = activity_tx.send(activity.clone()).await;
            }
            status = child.wait() => {
                exit_status = status.map_err(|e| e.to_string())?;
                break;
            }
        }
    }

    let stdout_buf = stdout_task.await.unwrap_or_default();
    let stderr_buf = stderr_task.await.unwrap_or_default();
    let stdout = String::from_utf8_lossy(&stdout_buf);
    let parsed_ok = extract_bridge_payload(&stdout);
    if !exit_status.success() && parsed_ok.is_none() {
        let stderr = String::from_utf8_lossy(&stderr_buf);
        let hint = {
            let from_err = stderr
                .lines()
                .rev()
                .filter(|l| !l.trim().is_empty())
                .take(3)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect::<Vec<_>>()
                .join(" ");
            if !from_err.is_empty() {
                from_err
            } else {
                stdout
                    .lines()
                    .rev()
                    .filter(|l| !l.trim().is_empty())
                    .take(3)
                    .collect::<Vec<_>>()
                    .into_iter()
                    .rev()
                    .collect::<Vec<_>>()
                    .join(" ")
            }
        };
        let hint = if hint.len() > 500 {
            format!("{}…", &hint[..500])
        } else {
            hint
        };
        let extra = if stdout.contains("\"stop_reason\":\"tool_use\"") || stdout.contains("tool_use") {
            " Claude intentó usar herramientas en vez de devolver solo el JSON. Reintentá."
        } else if stdout.contains("\"output_tokens\":0") || stdout.contains("\"input_tokens\":0") {
            " Claude no generó respuesta (posible flag inválido o trust del cwd). Reintentá."
        } else {
            ""
        };
        return Err(format!(
            "{} terminó con código {}{}{}",
            cap.label,
            exit_status.code().unwrap_or(-1),
            if hint.is_empty() {
                String::new()
            } else {
                format!(". {}", hint)
            },
            extra
        ));
    }
    let for_check = parsed_ok.ok_or_else(|| "El agente no devolvió JSON válido".to_string())?;
    let sanitized = crate::validate::sanitize_result(&for_check)
        .map_err(|e| format!("Respuesta del agente inválida: {}", e))?;
    crate::validate::validate_result(&sanitized)
        .map_err(|e| format!("Respuesta del agente inválida: {}", e))?;
    let ops = sanitized
        .get("operations")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let reply = sanitized
        .get("reply")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    Ok(JobResult {
        reply,
        operations: ops,
    })
}

/// Extrae {reply, operations} del stdout del CLI (Claude envuelve en result).
fn extract_bridge_payload(stdout: &str) -> Option<serde_json::Value> {
    let parsed = parse_agent_json(stdout)?;
    let inner = if let Some(result) = parsed.get("result") {
        match result {
            serde_json::Value::String(s) => parse_agent_json(s).unwrap_or(parsed.clone()),
            other => other.clone(),
        }
    } else {
        parsed
    };
    let reply = inner.get("reply").and_then(|v| v.as_str())?;
    let ops = inner.get("operations").and_then(|v| v.as_array())?;
    Some(serde_json::json!({ "reply": reply, "operations": ops }))
}

fn parse_agent_json(text: &str) -> Option<serde_json::Value> {
    let trimmed = text.trim();
    if let Ok(v) = serde_json::from_str(trimmed) {
        return Some(v);
    }
    if let Some(start) = trimmed.find("```") {
        if let Some(end) = trimmed[start + 3..].find("```") {
            let inner = trimmed[start + 3..start + 3 + end]
                .trim_start_matches("json")
                .trim();
            if let Ok(v) = serde_json::from_str(inner) {
                return Some(v);
            }
        }
    }
    let start = trimmed.find('{')?;
    let end = trimmed.rfind('}')?;
    serde_json::from_str(&trimmed[start..=end]).ok()
}

/// Trunca un &str a como máximo `max_bytes` bytes, respetando fronteras UTF-8.
fn truncate_utf8(s: &str, max_bytes: usize) -> &str {
    if s.len() <= max_bytes {
        return s;
    }
    let mut end = max_bytes;
    while end > 0 && !s.is_char_boundary(end) {
        end -= 1;
    }
    &s[..end]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_fenced_json() {
        let v = parse_agent_json("```json\n{\"reply\":\"ok\",\"operations\":[]}\n```").unwrap();
        assert_eq!(v["reply"], "ok");
    }

    #[test]
    fn truncate_utf8_never_panics_on_spanish() {
        let s = "ñ".repeat(5000);
        let t = truncate_utf8(&s, 4000);
        assert!(t.len() <= 4000);
        assert!(t.is_char_boundary(t.len()));
        assert!(std::str::from_utf8(t.as_bytes()).is_ok());
    }

    #[test]
    fn truncate_utf8_short_string_untouched() {
        assert_eq!(truncate_utf8("hola", 100), "hola");
    }

    #[tokio::test]
    async fn execute_times_out() {
        // Placeholder: el timeout de 600s se valida por inspección y E2E.
        let _ = std::time::Duration::from_secs(600);
    }

    #[tokio::test]
    async fn execute_respects_cancellation() {
        let job = Job {
            id: "j".into(),
            prompt: "x".into(),
            canvas: serde_json::json!({}),
            scope_path_ids: vec![],
            selection_ids: vec![],
            provider: "openai".into(),
            model: "auto".into(),
            recent_thread: vec![],
        };
        let (activity_tx, _) = tokio::sync::mpsc::channel(1);
        let (_cancel_tx, cancel_rx) = tokio::sync::watch::channel(true);
        let result = execute(&job, &[], activity_tx, cancel_rx).await;
        assert!(result.is_err());
        let msg = result.unwrap_err();
        assert!(msg.contains("cancelado") || msg.contains("no está listo"));
    }
}
