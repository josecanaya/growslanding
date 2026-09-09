# Plan: Grows Agent — app descargable de Windows/Mac/Linux

**Autor:** Claude Sonnet 5 (sesión de arquitectura del bridge)
**Ejecutor esperado:** agente autónomo de menor costo (Haiku, Sonnet mini).
**Repo:** `C:\Users\Usuario\Desktop\Jose\Grows\growslanding`
**Branch base:** `main`
**Fecha:** 2026-09-09

## Overview

Reemplazar el bridge actual (`scripts/grows-bridge.mjs` + `grows-connect.ps1` + registro `grows://` a mano) por una **app descargable ligera** que se llama **Grows Agent**. La app:

1. Se descarga desde un botón dentro de Grows web (usuario ya autenticado).
2. Se instala con doble click, aparece como ícono en la bandeja del sistema (tray).
3. Detecta qué CLIs de IA están instalados y ofrece instalar los que faltan con un botón (Claude Code, Codex, Cursor Agent).
4. Ofrece un botón "Login" por CLI para que el usuario se autentique.
5. Se conecta a Grows web via el protocolo `grows://` (registrado por el instalador).
6. Recibe pedidos, invoca al CLI correspondiente, devuelve JSON al canvas.
7. Se auto-actualiza cuando hay versión nueva.

**El bridge actual (Node script) queda como fallback durante la transición.** No se borra hasta que el % de usuarios en la nueva app sea > 90%.

## Decisiones técnicas fijas (NO cambiar)

- **Framework:** Tauri v2 (última estable). Backend en Rust, UI en HTML/CSS/JavaScript vanilla (nada de React/Vue, keep it minimal).
- **Distribución:** GitHub Releases (repo público `josecanaya/growslanding`). Instaladores `.exe` (NSIS), `.dmg`, `.AppImage`.
- **Firma:** ninguna en MVP. Users ven cartel de SmartScreen la primera vez, con instructivo en la app.
- **Auto-update:** Tauri Updater apuntando a endpoint del server (`/api/bridge/updates/[platform]`).
- **Persistencia local:** archivo JSON en el data dir del OS (usar `tauri::api::path::app_data_dir`).
- **Comunicación con Grows server:** HTTP igual que hoy (polling a `/api/bridge/worker` cada 3s). WebSocket queda para Fase 9.
- **Node runtime en la app:** no se empaqueta. La app REQUIERE que el usuario tenga Node en el PATH (los CLIs de IA lo requieren igual). Si no está, la app muestra "Instalá Node" con link a nodejs.org.

## Estructura de repo final

```
growslanding/
├── bridge-tauri/                      # NUEVO — app Tauri completa
│   ├── src/                           # UI (HTML/CSS/JS vanilla)
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── main.js
│   ├── src-tauri/                     # Backend Rust
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── cli_detector.rs
│   │   │   ├── cli_installer.rs
│   │   │   ├── config.rs
│   │   │   ├── job_runner.rs
│   │   │   ├── pairing.rs
│   │   │   └── prompt.rs
│   │   ├── Cargo.toml
│   │   ├── tauri.conf.json
│   │   ├── icons/
│   │   └── build.rs
│   └── README.md
├── scripts/
│   ├── grows-bridge.mjs               # DEPRECAR — mantener funcional
│   ├── grows-connect.ps1              # DEPRECAR
│   └── install-grows-protocol.ps1     # DEPRECAR
├── apps/web/
│   ├── app/api/bridge/
│   │   ├── worker/route.ts            # existente
│   │   ├── download/route.ts          # NUEVO
│   │   └── updates/[platform]/route.ts # NUEVO
│   └── components/cliente/canvas-editor/workspace/
│       └── GrowsCommandBar.tsx         # modificar: botón descargar
└── .github/workflows/
    └── bridge-release.yml              # NUEVO
```

## Reglas globales de ejecución

1. **Un commit por fase.** Trailer: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.
2. **Push después de cada fase.**
3. **No borrar el bridge Node.** Convive con la app Tauri durante todo el plan.
4. **No modificar la UI de Grows** salvo en Fase 6 (botón descargar).
5. **Si una fase requiere secretos** (API keys, tokens de GitHub para releases), no inventarlos — parar y pedir al usuario.
6. **Testing local:** todo debe correr en la PC del usuario que ya tiene el repo (`C:\Users\Usuario\Desktop\Jose\Grows\growslanding`).
7. **No firmar la app.** SmartScreen warnings son esperados y aceptables en MVP.

## Precondiciones (el humano debe hacer una sola vez antes de empezar)

Verificar/instalar en la PC de desarrollo:
- **Rust:** `rustup` desde https://rustup.rs (instala `cargo` y `rustc`).
- **Node ≥ 18** (ya está).
- **WebView2 Runtime** en Windows (ya viene con Windows 11).
- **Tauri CLI:** `npm install -g @tauri-apps/cli@latest` (o `cargo install tauri-cli --version "^2.0"`).

Verificación:
```bash
cargo --version   # cargo 1.75+
node --version    # v18+
npm exec tauri --version   # tauri-cli 2.x
```

Si falta algo, el agente para y se lo pide al humano.

---

# FASE 0 — Scaffold del proyecto Tauri

**Objetivo:** crear el esqueleto del proyecto `bridge-tauri/` sin lógica de negocio. La app compila, arranca, muestra "Hola Grows".

## Pasos

1. Desde la raíz del repo:
   ```bash
   npm create tauri-app@latest bridge-tauri -- --template vanilla --manager npm --identifier ar.com.grows.agent --name "Grows Agent"
   ```
   - Frontend: `vanilla` (HTML/CSS/JS)
   - Package manager: npm
   - Identifier: `ar.com.grows.agent`
   - Product name: `Grows Agent`
   - Confirmar Rust si pregunta.

2. Editar `bridge-tauri/src-tauri/tauri.conf.json`:
   - `productName`: `Grows Agent`
   - `version`: `0.1.0`
   - `identifier`: `ar.com.grows.agent`
   - `app.windows[0].title`: `Grows Agent`
   - `app.windows[0].width`: 480, `height`: 600
   - `app.windows[0].resizable`: false
   - `bundle.targets`: `["nsis", "app", "dmg", "appimage"]`
   - `bundle.icon`: usar los iconos default por ahora.

3. Reemplazar `bridge-tauri/src/index.html` por un stub:
   ```html
   <!doctype html>
   <html>
     <head><title>Grows Agent</title><link rel="stylesheet" href="styles.css"/></head>
     <body><main><h1>Grows Agent</h1><p>Cargando...</p></main><script type="module" src="main.js"></script></body>
   </html>
   ```

4. `bridge-tauri/src/styles.css`:
   ```css
   * { box-sizing: border-box; margin: 0; padding: 0; }
   body { font-family: -apple-system, "Segoe UI", sans-serif; padding: 20px; background: #F6F5F1; color: #15161A; }
   h1 { font-size: 18px; margin-bottom: 16px; }
   ```

5. `bridge-tauri/src/main.js`:
   ```js
   const { invoke } = window.__TAURI__.core;
   window.addEventListener('DOMContentLoaded', () => {
     document.querySelector('p').textContent = 'Listo.';
   });
   ```

6. `.gitignore` en `bridge-tauri/`:
   ```
   /node_modules
   /src-tauri/target
   /dist
   ```

## Verificación

```bash
cd bridge-tauri
npm install
npx tauri dev
```

Debe abrir una ventana 480×600 con "Grows Agent" y "Listo.". No debe haber errores en consola de Rust.

Cerrar con Ctrl+C.

## Done cuando
- `bridge-tauri/` existe con el scaffold.
- `npx tauri dev` arranca sin errores.
- Commit: `Fase 0: scaffold Tauri app`.
- Push.

## Fuera de alcance
- No lógica de negocio.
- No iconos custom (van en fase 5).

---

# FASE 1 — Detector nativo de CLIs (Rust)

**Objetivo:** módulo `cli_detector.rs` que detecta claude/codex/cursor-agent en el sistema, devuelve rutas absolutas y estado de auth.

## Archivos

**Crear** `bridge-tauri/src-tauri/src/cli_detector.rs`:

```rust
use std::path::PathBuf;
use std::process::Command;
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct CliStatus {
    pub id: String,          // "claude" | "openai" | "cursor"
    pub label: String,
    pub bin: Option<PathBuf>,
    pub installed: bool,
    pub logged_in: bool,
    pub version: Option<String>,
}

pub fn detect_all() -> Vec<CliStatus> {
    vec![
        detect_claude(),
        detect_codex(),
        detect_cursor(),
    ]
}

fn detect_claude() -> CliStatus {
    let bin = find_bin("claude", &claude_globs());
    let (installed, logged_in, version) = probe_claude(&bin);
    CliStatus { id: "claude".into(), label: "Anthropic · Claude".into(), bin, installed, logged_in, version }
}

fn detect_codex() -> CliStatus {
    let bin = find_bin("codex", &codex_globs());
    let (installed, logged_in, version) = probe_codex(&bin);
    CliStatus { id: "openai".into(), label: "OpenAI · Codex".into(), bin, installed, logged_in, version }
}

fn detect_cursor() -> CliStatus {
    let bin = find_bin("cursor-agent", &cursor_globs());
    let (installed, logged_in, version) = probe_cursor(&bin);
    CliStatus { id: "cursor".into(), label: "Cursor".into(), bin, installed, logged_in, version }
}

fn find_bin(name: &str, globs: &[PathBuf]) -> Option<PathBuf> {
    // 1) PATH
    if let Ok(path) = which::which(name) {
        // Preferir .cmd sobre .ps1 en Windows (ver bridge Node actual para razón)
        if path.extension().map(|e| e == "ps1").unwrap_or(false) {
            let cmd = path.with_extension("cmd");
            if cmd.exists() { return Some(cmd); }
        }
        return Some(path);
    }
    // 2) globs de ubicaciones conocidas
    for g in globs {
        if g.exists() { return Some(g.clone()); }
    }
    None
}

fn claude_globs() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let base = PathBuf::from(&appdata).join("Claude").join("claude-code");
        if let Ok(entries) = std::fs::read_dir(&base) {
            let mut versions: Vec<_> = entries.filter_map(|e| e.ok())
                .filter_map(|e| e.file_name().into_string().ok())
                .filter(|n| n.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false))
                .collect();
            versions.sort_by(|a, b| b.cmp(a));
            for v in versions { out.push(base.join(&v).join("claude.exe")); }
        }
        out.push(PathBuf::from(&appdata).join("npm").join("claude.cmd"));
    }
    out
}

fn codex_globs() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Some(appdata) = std::env::var_os("APPDATA") {
        out.push(PathBuf::from(&appdata).join("npm").join("codex.cmd"));
    }
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        out.push(PathBuf::from(&home).join(".local").join("bin").join("codex.exe"));
        out.push(PathBuf::from(&home).join(".codex").join("bin").join("codex.exe"));
    }
    out
}

fn cursor_globs() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Some(localapp) = std::env::var_os("LOCALAPPDATA") {
        out.push(PathBuf::from(&localapp).join("Programs").join("cursor").join("resources").join("app").join("bin").join("cursor-agent.cmd"));
    }
    if let Some(appdata) = std::env::var_os("APPDATA") {
        out.push(PathBuf::from(&appdata).join("npm").join("cursor-agent.cmd"));
    }
    out
}

fn probe_claude(bin: &Option<PathBuf>) -> (bool, bool, Option<String>) {
    let Some(bin) = bin else { return (false, false, None); };
    let version = run(bin, &["--version"]).map(|s| s.lines().next().unwrap_or("").trim().to_string());
    // claude auth status devuelve JSON con {"loggedIn": bool}
    let auth = run(bin, &["auth", "status"]).unwrap_or_default();
    let logged_in = auth.contains("\"loggedIn\": true") || auth.contains("\"loggedIn\":true");
    (true, logged_in, version)
}

fn probe_codex(bin: &Option<PathBuf>) -> (bool, bool, Option<String>) {
    let Some(bin) = bin else { return (false, false, None); };
    let version = run(bin, &["--version"]).map(|s| s.trim().to_string());
    let auth = run(bin, &["login", "status"]);
    let logged_in = auth.as_ref().map(|s| !s.to_lowercase().contains("not logged") && !s.to_lowercase().contains("no session")).unwrap_or(false);
    (true, logged_in, version)
}

fn probe_cursor(bin: &Option<PathBuf>) -> (bool, bool, Option<String>) {
    let Some(bin) = bin else { return (false, false, None); };
    let version = run(bin, &["--version"]).map(|s| s.trim().to_string());
    // cursor-agent no tiene "auth status" — asumir logged si versión responde
    (true, version.is_some(), version)
}

fn run(bin: &PathBuf, args: &[&str]) -> Option<String> {
    let output = Command::new(bin).args(args).output().ok()?;
    if !output.status.success() && output.stdout.is_empty() { return None; }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
}
```

**Modificar** `bridge-tauri/src-tauri/Cargo.toml` — agregar dependencias:
```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
which = "6"
```

**Modificar** `bridge-tauri/src-tauri/src/main.rs`:
```rust
mod cli_detector;

#[tauri::command]
fn detect_clis() -> Vec<cli_detector::CliStatus> {
    cli_detector::detect_all()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![detect_clis])
        .run(tauri::generate_context!())
        .expect("error while running Grows Agent");
}
```

**Actualizar** `bridge-tauri/src/main.js` para probar:
```js
const { invoke } = window.__TAURI__.core;
window.addEventListener('DOMContentLoaded', async () => {
  const clis = await invoke('detect_clis');
  document.querySelector('main').innerHTML = '<h1>CLIs detectados</h1><pre>' + JSON.stringify(clis, null, 2) + '</pre>';
});
```

## Verificación

```bash
cd bridge-tauri
npx tauri dev
```

Debe abrir la ventana y mostrar el array de 3 CLIs con sus estados. En la PC del usuario debe detectar `claude` como `installed: true, logged_in: true` (según el estado actual). Codex y Cursor probablemente `installed: false`.

## Done cuando
- La ventana muestra el JSON con los 3 CLIs.
- Detecta correctamente Claude en `%APPDATA%\npm\claude.cmd`.
- No hay `.ps1` en los `bin` (fue reemplazado por `.cmd`).
- Commit: `Fase 1: detector nativo de CLIs en Rust`.
- Push.

---

# FASE 2 — Instalador de CLIs desde la app

**Objetivo:** botones "Instalar" y "Login" por CLI dentro de la ventana.

## Archivos

**Crear** `bridge-tauri/src-tauri/src/cli_installer.rs`:

```rust
use std::process::Command;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
}

pub fn install(id: &str) -> InstallResult {
    let package = match id {
        "claude" => "@anthropic-ai/claude-code",
        "openai" => "@openai/codex",
        "cursor" => return InstallResult { success: false, message: "Cursor Agent viene con el editor Cursor. Descargalo de cursor.com.".into() },
        _ => return InstallResult { success: false, message: format!("CLI desconocido: {}", id) },
    };
    let output = Command::new(npm_cmd()).args(["install", "-g", package]).output();
    match output {
        Ok(o) if o.status.success() => InstallResult { success: true, message: format!("{} instalado.", package) },
        Ok(o) => InstallResult { success: false, message: String::from_utf8_lossy(&o.stderr).to_string() },
        Err(e) => InstallResult { success: false, message: format!("npm no encontrado. Instala Node.js primero. ({})", e) },
    }
}

pub fn open_login(id: &str, bin: &std::path::Path) -> InstallResult {
    let args: Vec<&str> = match id {
        "claude" => vec!["auth", "login"],
        "openai" => vec!["login"],
        _ => return InstallResult { success: false, message: "Este CLI no requiere login manual.".into() },
    };
    // Abrir en terminal externa porque es interactivo (abre navegador)
    #[cfg(windows)]
    let result = Command::new("cmd").args(["/C", "start", "cmd", "/K"]).arg(bin).args(&args).spawn();
    #[cfg(not(windows))]
    let result = Command::new(bin).args(&args).spawn();
    match result {
        Ok(_) => InstallResult { success: true, message: "Terminal abierta. Seguí las instrucciones y volvé acá cuando termines.".into() },
        Err(e) => InstallResult { success: false, message: format!("No se pudo abrir la terminal: {}", e) },
    }
}

fn npm_cmd() -> &'static str {
    if cfg!(windows) { "npm.cmd" } else { "npm" }
}
```

**Modificar** `main.rs`:
```rust
mod cli_detector;
mod cli_installer;

#[tauri::command]
fn detect_clis() -> Vec<cli_detector::CliStatus> {
    cli_detector::detect_all()
}

#[tauri::command]
fn install_cli(id: String) -> cli_installer::InstallResult {
    cli_installer::install(&id)
}

#[tauri::command]
fn login_cli(id: String, bin: String) -> cli_installer::InstallResult {
    cli_installer::open_login(&id, std::path::Path::new(&bin))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![detect_clis, install_cli, login_cli])
        .run(tauri::generate_context!())
        .expect("error while running Grows Agent");
}
```

**Reescribir** `bridge-tauri/src/index.html` + `main.js` + `styles.css` con la UI real:

`index.html`:
```html
<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>Grows Agent</title><link rel="stylesheet" href="styles.css"/></head>
  <body>
    <header>
      <h1>Grows Agent</h1>
      <span id="status" class="status">Desconectado</span>
    </header>
    <section id="clis"></section>
    <footer><small>v0.1.0 · <a href="#" id="open-logs">Ver logs</a></small></footer>
    <script type="module" src="main.js"></script>
  </body>
</html>
```

`styles.css`:
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, "Segoe UI", sans-serif; padding: 16px; background: #F6F5F1; color: #15161A; font-size: 13px; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
h1 { font-size: 16px; font-weight: 600; }
.status { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #E4E3DE; }
.status.ok { background: #DCFCE7; color: #166534; }
.cli-card { background: white; border: 1px solid #E4E3DE; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
.cli-card .label { flex: 1; }
.cli-card .label b { display: block; font-size: 13px; }
.cli-card .label small { color: #8B8C90; font-size: 11px; }
.cli-card button { border: none; background: #15161A; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.cli-card button:disabled { opacity: 0.5; cursor: not-allowed; }
.cli-card button.secondary { background: transparent; color: #15161A; border: 1px solid #D3D2CC; }
.cli-card .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; }
.cli-card .badge.ok { background: #DCFCE7; color: #166534; }
.cli-card .badge.warn { background: #FEF3C7; color: #92400E; }
.cli-card .badge.error { background: #FEE2E2; color: #991B1B; }
footer { text-align: center; margin-top: 16px; color: #8B8C90; }
a { color: #15161A; }
```

`main.js`:
```js
const { invoke } = window.__TAURI__.core;

async function render() {
  const clis = await invoke('detect_clis');
  const container = document.getElementById('clis');
  container.innerHTML = clis.map(c => {
    const badge = c.logged_in ? '<span class="badge ok">Listo</span>'
      : c.installed ? '<span class="badge warn">Sin sesión</span>'
      : '<span class="badge error">No instalado</span>';
    const action = c.logged_in ? ''
      : c.installed ? `<button data-action="login" data-id="${c.id}" data-bin="${c.bin}">Login</button>`
      : `<button data-action="install" data-id="${c.id}">Instalar</button>`;
    return `<div class="cli-card">
      <div class="label"><b>${c.label}</b><small>${c.version ?? 'no detectado'}</small></div>
      ${badge}${action}
    </div>`;
  }).join('');
  container.querySelectorAll('button').forEach(btn => btn.addEventListener('click', handleClick));
}

async function handleClick(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  btn.disabled = true;
  btn.textContent = action === 'install' ? 'Instalando...' : 'Abriendo...';
  const cmd = action === 'install' ? 'install_cli' : 'login_cli';
  const args = action === 'install' ? { id } : { id, bin: btn.dataset.bin };
  const result = await invoke(cmd, args);
  alert(result.message);
  await render();
}

window.addEventListener('DOMContentLoaded', render);
setInterval(render, 5000); // refresca cada 5s por si el usuario cambia estado
```

## Verificación

```bash
cd bridge-tauri
npx tauri dev
```

- Debe mostrar 3 tarjetas con el label, versión y badge.
- Click en "Instalar" en un CLI faltante debe ejecutar npm y (a los 30-60s) mostrar alert de éxito.
- Click en "Login" debe abrir una terminal con `claude auth login`.
- Después de login, refrescar debe mostrar el badge verde "Listo".

## Done cuando
- UI funcional con las 3 tarjetas.
- Instalar y Login funcionan end-to-end en la PC del usuario.
- Commit: `Fase 2: UI e instalador de CLIs`.
- Push.

## Fuera de alcance
- Cursor no se puede instalar via npm (viene con el editor Cursor). Solo mostrar mensaje que redirige a cursor.com.
- No autoupdate del CLI. Solo instalación inicial.

---

# FASE 3 — Job runner (reemplaza executeJob del bridge Node)

**Objetivo:** portar la lógica de `scripts/grows-bridge.mjs` a Rust. El agente Tauri hace lo mismo: pollea `/api/bridge/worker`, ejecuta el CLI con el prompt, devuelve el JSON.

## Archivos

**Crear** `bridge-tauri/src-tauri/src/config.rs`:

```rust
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BridgeConfig {
    pub url: Option<String>,       // "https://app.grows.com.ar"
    pub token: Option<String>,     // hex 64
}

pub fn config_path(app: &tauri::AppHandle) -> PathBuf {
    tauri::Manager::path(app).app_data_dir().unwrap().join("bridge.private.json")
}

pub fn load(app: &tauri::AppHandle) -> BridgeConfig {
    let path = config_path(app);
    std::fs::read_to_string(&path).ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save(app: &tauri::AppHandle, cfg: &BridgeConfig) -> std::io::Result<()> {
    let path = config_path(app);
    if let Some(dir) = path.parent() { std::fs::create_dir_all(dir)?; }
    std::fs::write(&path, serde_json::to_string_pretty(cfg).unwrap())
}
```

**Crear** `bridge-tauri/src-tauri/src/prompt.rs` — el contrato del agente (temporal, hasta Fase 8 que lo sirve el server):

```rust
pub const AGENT_CONTEXT: &str = r#"# Grows — Contrato del agente

## Rol
Sos el asistente de planificación de Grows. Respondé en español y breve.

## Formato de salida
Devolvé EXCLUSIVAMENTE un objeto JSON con la forma:
{"reply": string, "operations": array}

Sin texto antes ni después. Sin bloques markdown.

## Campo `type` (acción)
Uno de: create_node, update_node, delete_node, create_edge, delete_edge, propose_transform.

## Campo `nodeType` (categoría, NO confundir con type)
Uno de: etapa, planta, sector, ambiente, tarea, estado, o null.

## Campos requeridos en cada operación
type, id, parentId, title, description, nodeType, sourceId, targetId, relation,
fromNodeId, toNodeId, transformKind, executorKind, quantity, unit, durationDays,
sources, assumptions.

Información extra (capital, montos, cálculos) va dentro de "description" o "assumptions".
"#;
```

**Crear** `bridge-tauri/src-tauri/src/job_runner.rs`:

Portar la lógica de `executeJob` de `grows-bridge.mjs`. Estructura:

```rust
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tokio::process::Command;
use tokio::io::AsyncWriteExt;
use crate::cli_detector::{self, CliStatus};
use crate::prompt::AGENT_CONTEXT;

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
}

#[derive(Debug, Serialize)]
pub struct JobResult {
    pub reply: String,
    pub operations: Vec<serde_json::Value>,
}

pub async fn execute(job: &Job, capabilities: &[CliStatus]) -> Result<JobResult, String> {
    let cap = capabilities.iter().find(|c| c.id == job.provider && c.logged_in)
        .ok_or_else(|| format!("Proveedor {} no está listo", job.provider))?;
    let bin = cap.bin.as_ref().ok_or("Sin binario detectado")?;

    let temp_dir = tempfile::tempdir().map_err(|e| e.to_string())?;
    tokio::fs::write(temp_dir.path().join("AGENTS.md"), AGENT_CONTEXT).await.map_err(|e| e.to_string())?;

    let user_prompt = format!(
        "PEDIDO:\n{}\n\nNIVEL VISIBLE DE LA OBRA:\n{}",
        &job.prompt[..job.prompt.len().min(4000)],
        serde_json::to_string(&job.canvas).unwrap_or_default()
    );

    let args: Vec<String> = match job.provider.as_str() {
        "openai" => vec!["exec", "-m", &job.model, "--sandbox", "read-only", "--json", "-"]
            .into_iter().map(String::from).collect(),
        "claude" => vec!["-p", "--model", &job.model, "--output-format", "json", "--permission-mode", "plan", "--max-turns", "1"]
            .into_iter().map(String::from).collect(),
        "cursor" => vec!["-p", "--model", &job.model, "--output-format", "json"]
            .into_iter().map(String::from).collect(),
        _ => return Err(format!("Proveedor desconocido: {}", job.provider)),
    };

    let mut cmd = Command::new(bin);
    cmd.args(&args).current_dir(temp_dir.path())
       .stdin(std::process::Stdio::piped())
       .stdout(std::process::Stdio::piped())
       .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    { use std::os::windows::process::CommandExt; cmd.creation_flags(0x08000000); }  // CREATE_NO_WINDOW

    let mut child = cmd.spawn().map_err(|e| format!("No se pudo lanzar {}: {}", cap.label, e))?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(user_prompt.as_bytes()).await.ok();
    }
    let output = child.wait_with_output().await.map_err(|e| e.to_string())?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let tail = stderr.lines().rev().take(2).collect::<Vec<_>>().join(" ");
        return Err(format!("{} exit={:?}. {}", cap.label, output.status.code(), tail));
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed = parse_agent_json(&stdout).ok_or_else(|| "El agente no devolvió JSON válido".to_string())?;
    let inner = if let Some(result) = parsed.get("result") { parse_agent_json(&result.to_string()).unwrap_or(parsed) } else { parsed };
    let reply = inner.get("reply").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let ops = inner.get("operations").and_then(|v| v.as_array()).cloned().unwrap_or_default();
    Ok(JobResult { reply, operations: ops })
}

fn parse_agent_json(text: &str) -> Option<serde_json::Value> {
    let trimmed = text.trim();
    if let Ok(v) = serde_json::from_str(trimmed) { return Some(v); }
    // fences markdown
    if let Some(start) = trimmed.find("```") {
        if let Some(end) = trimmed[start+3..].find("```") {
            let inner = trimmed[start+3..start+3+end].trim_start_matches("json").trim();
            if let Ok(v) = serde_json::from_str(inner) { return Some(v); }
        }
    }
    // extraer entre llaves
    let start = trimmed.find('{')?;
    let end = trimmed.rfind('}')?;
    serde_json::from_str(&trimmed[start..=end]).ok()
}
```

**Crear el loop principal** en `main.rs`:

```rust
mod cli_detector;
mod cli_installer;
mod config;
mod job_runner;
mod prompt;

use std::sync::Arc;
use tokio::sync::RwLock;

struct AppState {
    running: Arc<RwLock<bool>>,
}

#[tauri::command]
async fn start_worker(app: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<(), String> {
    *state.running.write().await = true;
    let running = state.running.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            if !*running.read().await { break; }
            if let Err(e) = poll_and_execute(&app).await {
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

async fn poll_and_execute(app: &tauri::AppHandle) -> Result<(), String> {
    let cfg = config::load(app);
    let (url, token) = (cfg.url.ok_or("sin config")?, cfg.token.ok_or("sin token")?);
    let caps = cli_detector::detect_all();
    let ready: Vec<_> = caps.iter().filter(|c| c.logged_in).cloned().collect();
    let capabilities_json: Vec<serde_json::Value> = ready.iter().map(|c| serde_json::json!({
        "id": c.id, "label": c.label, "models": [], "limitDescription": ""
    })).collect();

    let client = reqwest::Client::new();
    let claim: serde_json::Value = client.post(format!("{}/api/bridge/worker", url))
        .bearer_auth(&token)
        .json(&serde_json::json!({"action": "claim", "capabilities": capabilities_json, "activity": "Esperando pedidos"}))
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let Some(job_val) = claim.get("job").filter(|v| !v.is_null()) else { return Ok(()); };
    let lease: String = claim.get("leaseToken").and_then(|v| v.as_str()).ok_or("sin lease")?.into();
    let job: job_runner::Job = serde_json::from_value(job_val.clone()).map_err(|e| e.to_string())?;

    let result = job_runner::execute(&job, &ready).await;
    let body = match result {
        Ok(r) => serde_json::json!({"action":"complete","jobId":job.id,"leaseToken":lease,"result":{"reply":r.reply,"operations":r.operations}}),
        Err(e) => serde_json::json!({"action":"fail","jobId":job.id,"leaseToken":lease,"error":e}),
    };
    client.post(format!("{}/api/bridge/worker", url))
        .bearer_auth(&token).json(&body).send().await.map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState { running: Arc::new(RwLock::new(false)) })
        .invoke_handler(tauri::generate_handler![
            detect_clis, install_cli, login_cli, start_worker, stop_worker
        ])
        .run(tauri::generate_context!())
        .expect("error while running Grows Agent");
}

#[tauri::command] fn detect_clis() -> Vec<cli_detector::CliStatus> { cli_detector::detect_all() }
#[tauri::command] fn install_cli(id: String) -> cli_installer::InstallResult { cli_installer::install(&id) }
#[tauri::command] fn login_cli(id: String, bin: String) -> cli_installer::InstallResult { cli_installer::open_login(&id, std::path::Path::new(&bin)) }
```

Agregar en `Cargo.toml`:
```toml
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
tempfile = "3"
```

## Verificación

Manualmente crear el config en el data dir de Tauri (`%APPDATA%\ar.com.grows.agent\bridge.private.json`) con un token de pairing válido. Arrancar la app, invocar `start_worker` desde la consola de dev tools:
```js
await __TAURI__.core.invoke('start_worker');
```

Ir a la app de Grows y crear un job desde la command bar. El agente Tauri debe recogerlo, ejecutarlo y devolver el resultado. Verificar en la UI de Grows que la propuesta aparece.

## Done cuando
- La app Tauri completa un job end-to-end con Claude.
- Commit: `Fase 3: job runner en Rust`.
- Push.

---

# FASE 4 — Protocol handler `grows://`

**Objetivo:** cuando el usuario clickea "Conectar" en Grows web, se abre `grows://pair?url=...&token=...` y la app Tauri lo captura.

## Cambios

**Modificar** `bridge-tauri/src-tauri/tauri.conf.json`:
```json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["grows"]
      }
    }
  }
}
```

**Agregar plugin en `Cargo.toml`:**
```toml
tauri-plugin-deep-link = "2"
```

**En `main.rs`:**
```rust
use tauri::Manager;

.plugin(tauri_plugin_deep_link::init())
.setup(|app| {
    let app_handle = app.handle().clone();
    app.deep_link().on_open_url(move |event| {
        for url in event.urls() {
            handle_grows_url(&app_handle, url.as_str());
        }
    });
    Ok(())
})
```

**Crear** `bridge-tauri/src-tauri/src/pairing.rs`:
```rust
use url::Url;
use crate::config::{self, BridgeConfig};

pub fn handle_pair_url(app: &tauri::AppHandle, raw: &str) -> Result<(), String> {
    let parsed = Url::parse(raw).map_err(|e| e.to_string())?;
    if parsed.scheme() != "grows" || parsed.host_str() != Some("pair") {
        return Err("URL inválida".into());
    }
    let mut url = None; let mut token = None;
    for (k, v) in parsed.query_pairs() {
        match k.as_ref() { "url" => url = Some(v.to_string()), "token" => token = Some(v.to_string()), _ => {} }
    }
    let url = url.ok_or("Falta url")?;
    let token = token.ok_or("Falta token")?;
    if !token.chars().all(|c| c.is_ascii_hexdigit()) || token.len() != 64 { return Err("Token inválido".into()); }
    config::save(app, &BridgeConfig { url: Some(url), token: Some(token) }).map_err(|e| e.to_string())
}
```

Agregar `url = "2"` en `Cargo.toml`.

## Verificación

En Windows, después de instalar la app (o en dev con `npx tauri dev`, va al registry), abrir un `grows://pair?url=https://app.grows.com.ar&token=<64 hex>` desde el navegador. Debe activar la app Tauri, guardar el config y arrancar el worker.

## Done cuando
- Deep link registrado.
- Config se guarda al recibir URL.
- Commit: `Fase 4: protocol handler grows://`.
- Push.

---

# FASE 5 — Build multiplataforma via GitHub Actions

**Objetivo:** cada tag `v*` en el repo dispara build de instaladores para Windows/Mac/Linux y los publica como GitHub Release.

## Archivos

**Crear** `.github/workflows/bridge-release.yml`:

```yaml
name: Bridge Release
on:
  push:
    tags: ["v*"]
jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
          - platform: macos-latest
            target: universal-apple-darwin
          - platform: ubuntu-latest
            target: x86_64-unknown-linux-gnu
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: dtolnay/rust-toolchain@stable
      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt update
          sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
      - name: Install project deps
        working-directory: bridge-tauri
        run: npm ci
      - name: Build
        working-directory: bridge-tauri
        run: npm exec tauri build
      - name: Upload artifacts
        uses: softprops/action-gh-release@v2
        with:
          files: |
            bridge-tauri/src-tauri/target/release/bundle/nsis/*.exe
            bridge-tauri/src-tauri/target/release/bundle/dmg/*.dmg
            bridge-tauri/src-tauri/target/release/bundle/appimage/*.AppImage
```

## Verificación

```bash
git tag v0.1.0
git push origin v0.1.0
```

Debe aparecer un Release en GitHub con los 3 instaladores.

## Done cuando
- El release v0.1.0 tiene los 3 archivos.
- Commit: `Fase 5: build multiplataforma GitHub Actions`.
- Push (los cambios de yml, no el tag — el tag ya está).

## Fuera de alcance
- No firma (código sin firmar, warnings esperados).

---

# FASE 6 — Botón "Descargar conector" en Grows web

**Objetivo:** que en la app de Grows aparezca un botón que descarga el instalador correcto según OS del navegador.

## Archivos

**Crear** `apps/web/app/api/bridge/download/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

const LATEST_VERSION = '0.1.0';
const BASE = `https://github.com/josecanaya/growslanding/releases/download/v${LATEST_VERSION}`;

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform') || detectPlatform(request.headers.get('user-agent') || '');
  const map: Record<string, string> = {
    windows: `${BASE}/Grows.Agent_${LATEST_VERSION}_x64-setup.exe`,
    mac: `${BASE}/Grows.Agent_${LATEST_VERSION}_universal.dmg`,
    linux: `${BASE}/Grows.Agent_${LATEST_VERSION}_amd64.AppImage`,
  };
  const url = map[platform];
  if (!url) return NextResponse.json({ error: 'plataforma no soportada' }, { status: 400 });
  return NextResponse.redirect(url, 302);
}

function detectPlatform(ua: string): string {
  if (/windows/i.test(ua)) return 'windows';
  if (/mac/i.test(ua)) return 'mac';
  return 'linux';
}
```

**Modificar** `apps/web/components/cliente/canvas-editor/workspace/GrowsCommandBar.tsx`:

En el Dialog de settings ("Conectar un agente"), agregar antes de las tarjetas de providers:

```tsx
<div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
  <p className="text-sm font-medium mb-1">¿Es tu primera vez?</p>
  <p className="text-xs text-blue-800 mb-3">Necesitás instalar el conector de Grows en esta PC. Es una app liviana (~10 MB).</p>
  <a href="/api/bridge/download" download className="inline-block rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700">
    Descargar conector local
  </a>
  <details className="mt-2"><summary className="text-xs text-blue-800 cursor-pointer">Vas a ver una advertencia de Windows/Mac — es normal</summary>
    <p className="text-xs text-blue-800 mt-1">Windows: click en "Más información" → "Ejecutar de todas formas".<br/>Mac: click derecho en el .dmg → "Abrir" → "Abrir de todas formas".</p>
  </details>
</div>
```

## Verificación

- `curl -I http://localhost:3000/api/bridge/download?platform=windows` debe devolver 302 hacia GitHub.
- En la app, el botón aparece dentro del diálogo de conectar y descarga el instalador.

## Done cuando
- Endpoint responde con redirect según platform.
- Botón visible en el diálogo.
- Commit: `Fase 6: botón descargar conector local`.
- Push.

---

# FASE 7 — Auto-update

**Objetivo:** cuando publicás v0.2.0, las apps instaladas se actualizan solas.

## Cambios

**En `tauri.conf.json`:**
```json
{
  "plugins": {
    "updater": {
      "endpoints": ["https://app.grows.com.ar/api/bridge/updates/{{target}}"],
      "pubkey": "<generar con: npx tauri signer generate>"
    }
  }
}
```

Guardar la clave privada en secreto (no commitear).

**Crear** `apps/web/app/api/bridge/updates/[platform]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const LATEST = { version: '0.1.0', notes: 'Release inicial', pub_date: '2026-09-09T00:00:00Z' };
const BASE = `https://github.com/josecanaya/growslanding/releases/download/v${LATEST.version}`;

export async function GET(_r: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const url = platform.includes('windows') ? `${BASE}/Grows.Agent_${LATEST.version}_x64-setup.nsis.zip`
    : platform.includes('darwin') ? `${BASE}/Grows.Agent.app.tar.gz`
    : `${BASE}/grows-agent_${LATEST.version}_amd64.AppImage.tar.gz`;
  return NextResponse.json({ ...LATEST, url, signature: '<firma-por-plataforma>' });
}
```

En Fase 7 dejar el signature como placeholder; solo funciona cuando se implementa el pipeline de firma (Fase 10+).

## Done cuando
- Endpoint responde JSON válido.
- La app Tauri no rompe al chequear updates (aunque no aplique).
- Commit: `Fase 7: endpoint de updates`.
- Push.

---

# FASE 8 — Contrato del agente servido por el server

**Objetivo:** el `AGENT_CONTEXT` (hoy hardcodeado en `prompt.rs`) se sirve desde el server. Cambiarlo no requiere republicar la app.

## Archivos

**Crear** `apps/web/lib/bridge/agent-context.md` — mover el contenido literal de `bridge-tauri/src-tauri/src/prompt.rs`.

**Crear** `apps/web/app/api/bridge/agent-context/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return NextResponse.json({ message: 'no autorizado' }, { status: 401 });
  const db = createServiceSupabaseClient() as any;
  const dev = await db.from('grows_bridge_devices').select('id')
    .eq('token_hash', createHash('sha256').update(token).digest('hex'))
    .is('revoked_at', null).maybeSingle();
  if (dev.error || !dev.data) return NextResponse.json({ message: 'no autorizado' }, { status: 401 });
  const content = await readFile(path.join(process.cwd(), 'apps/web/lib/bridge/agent-context.md'), 'utf8');
  return new NextResponse(content, { status: 200, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=1800' } });
}
```

**Modificar** `bridge-tauri/src-tauri/src/prompt.rs`:
```rust
use std::sync::RwLock;
static CACHED: RwLock<Option<String>> = RwLock::new(None);
const FALLBACK: &str = "# Grows\nContrato no disponible. Devolvé JSON minimal.";

pub async fn fetch_and_cache(url: &str, token: &str) -> Result<(), String> {
    let ctx = reqwest::Client::new().get(format!("{}/api/bridge/agent-context", url))
        .bearer_auth(token).send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;
    *CACHED.write().unwrap() = Some(ctx);
    Ok(())
}

pub fn current() -> String {
    CACHED.read().unwrap().clone().unwrap_or_else(|| FALLBACK.into())
}
```

Y en `job_runner::execute`, reemplazar `AGENT_CONTEXT` por `crate::prompt::current()`.

Llamar `prompt::fetch_and_cache` en `main.rs` al `start_worker` y cada 30 min.

## Done cuando
- El archivo `agent-context.md` existe en el server.
- Endpoint autenticado responde el markdown.
- El agente Tauri fetch al arrancar y lo cachea.
- Commit: `Fase 8: contrato del agente servido por el server`.
- Push.

---

# FASE 9 (opcional) — WebSocket bidireccional

**Objetivo:** reemplazar polling HTTP por WebSocket. Grows web push directo al agente sin latencia.

Deferir. Solo hacer si Fase 3-8 funcionan estables por 2+ semanas en producción con usuarios reales.

Notas técnicas:
- Servidor: Supabase Realtime como canal (más simple que gestionar WS propios).
- Cliente Tauri: `tokio-tungstenite` o suscripción a Supabase Realtime.

---

# FASE 10 (opcional) — Motor de reglas local + memoria

**Objetivo:** filtrar pedidos que se pueden resolver sin IA. Cache local del canvas. Memoria de convenciones del usuario.

Deferir. Requiere análisis previo de qué % de pedidos son deterministas. Empezar por portar `localGraphProposal` de `grows-bridge.mjs` a Rust.

---

# Migración y comunicación al usuario

Después de completar Fases 0-8:

1. El bridge Node (`scripts/grows-bridge.mjs`) sigue funcional. Los usuarios actuales no rompen.
2. La app Tauri es la ruta recomendada. Grows web muestra el botón "Descargar conector" prominentemente.
3. Cuando el usuario conecta desde la app Tauri, sobreescribe el device en Supabase — el bridge Node viejo queda huérfano (sin token válido) y se desconecta solo.
4. A las 4 semanas de release: agregar mensaje en Grows web "El conector viejo se deprecará el DD/MM. Migrá a la app". A los 3 meses: borrar el script Node.

## Rollback de emergencia

Si la app Tauri tiene bug crítico:
1. Marcar el release en GitHub como "pre-release" — el endpoint de updates deja de servirlo.
2. Reactivar el flujo viejo en `GrowsCommandBar.tsx` (mostrar los pasos del bridge Node).
3. Emitir hotfix.

---

## Referencias del código existente que el agente debe conocer

- **Bridge Node actual (a portar):** `scripts/grows-bridge.mjs`
- **Endpoint worker (no cambia):** `apps/web/app/api/bridge/worker/route.ts`
- **Aplicador de operaciones:** `apps/web/lib/bridge/operations.ts`
- **UI del command bar:** `apps/web/components/cliente/canvas-editor/workspace/GrowsCommandBar.tsx`
- **Config path actual (Node):** `%LOCALAPPDATA%\Grows\bridge.private.json`
- **Config path futuro (Tauri):** `%APPDATA%\ar.com.grows.agent\bridge.private.json`

## Estimación honesta

| Fase | Duración | Riesgo |
|---|---|---|
| 0 | 1h | bajo |
| 1 | 4h | bajo |
| 2 | 4h | bajo |
| 3 | 1-2 días | medio (portar lógica) |
| 4 | 4h | bajo |
| 5 | 4h | medio (GitHub Actions primero build es siempre pain) |
| 6 | 2h | bajo |
| 7 | 3h | medio |
| 8 | 3h | bajo |

**Total core (0-8):** 4-6 días de trabajo dedicado.

Fases 9-10 son días adicionales cada una.

## Reglas para el agente ejecutor

- **Si te trabás en una fase, no avances a la siguiente.** Reportá el bloqueo con: qué intentaste, qué error viste, qué archivos tocaste.
- **No inventes API keys, tokens ni credenciales de GitHub.** Si un paso los requiere, parar y pedirle al usuario.
- **No borres código del bridge Node.** Solo agregar cosas nuevas en `bridge-tauri/`.
- **No modifiques la UI de Grows** salvo en Fase 6 y estrictamente el bloque indicado.
- **Después de cada fase:** `git status`, revisar que solo estén los archivos esperados, commit + push.
