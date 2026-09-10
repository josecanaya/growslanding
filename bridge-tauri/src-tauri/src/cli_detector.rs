use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
pub struct CliStatus {
    pub id: String,
    pub label: String,
    pub bin: Option<PathBuf>,
    /// Args to prepend (e.g. path to index.js when bin is Cursor's bundled node.exe).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub prefix_args: Vec<String>,
    pub installed: bool,
    pub logged_in: bool,
    pub version: Option<String>,
}

pub fn detect_all() -> Vec<CliStatus> {
    vec![detect_claude(), detect_codex(), detect_cursor()]
}

fn detect_claude() -> CliStatus {
    let bin = find_bin("claude", &claude_candidates());
    let (installed, logged_in, version) = probe_claude(&bin);
    CliStatus {
        id: "claude".into(),
        label: "Anthropic · Claude".into(),
        bin,
        prefix_args: vec![],
        installed,
        logged_in,
        version,
    }
}

fn detect_codex() -> CliStatus {
    let bin = find_bin("codex", &codex_candidates());
    let (installed, logged_in, version) = probe_codex(&bin);
    CliStatus {
        id: "openai".into(),
        label: "OpenAI · Codex".into(),
        bin,
        prefix_args: vec![],
        installed,
        logged_in,
        version,
    }
}

fn detect_cursor() -> CliStatus {
    // Windows: %LOCALAPPDATA%\cursor-agent\versions\<ver>\node.exe + index.js
    // (agent.cmd solo abre PowerShell; nosotros bypassamos el shim).
    if let Some((node, index)) = resolve_cursor_node_entry() {
        let index_s = index.to_string_lossy().to_string();
        let version = run_with_prefix(&node, &[&index_s], &["--version"])
            .map(|s| s.lines().next().unwrap_or("").trim().to_string());
        let logged_in = version.is_some();
        return CliStatus {
            id: "cursor".into(),
            label: "Cursor".into(),
            bin: Some(node),
            prefix_args: vec![index_s],
            installed: true,
            logged_in,
            version,
        };
    }
    let bin = find_bin("agent", &cursor_candidates())
        .or_else(|| find_bin("cursor-agent", &cursor_candidates()));
    let (installed, logged_in, version) = probe_cursor(&bin);
    CliStatus {
        id: "cursor".into(),
        label: "Cursor".into(),
        bin,
        prefix_args: vec![],
        installed,
        logged_in,
        version,
    }
}

/// Cursor CLI en Windows: LocalAppData\cursor-agent\versions\<latest>\node.exe + index.js
pub fn resolve_cursor_node_entry() -> Option<(PathBuf, PathBuf)> {
    let localapp = std::env::var_os("LOCALAPPDATA")?;
    let root = PathBuf::from(localapp).join("cursor-agent");
    // Prefer latest under versions/
    let versions_dir = root.join("versions");
    if let Ok(entries) = std::fs::read_dir(&versions_dir) {
        let mut versions: Vec<PathBuf> = entries.filter_map(|e| e.ok()).map(|e| e.path()).filter(|p| p.is_dir()).collect();
        versions.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        for dir in versions {
            let node = dir.join("node.exe");
            let index = dir.join("index.js");
            if node.exists() && index.exists() {
                return Some((node, index));
            }
        }
    }
    // Fallback: root itself (unlikely on current installer)
    let node = root.join("node.exe");
    let index = root.join("index.js");
    if node.exists() && index.exists() {
        return Some((node, index));
    }
    None
}

fn run_with_prefix(bin: &PathBuf, prefix: &[&str], args: &[&str]) -> Option<String> {
    let mut all: Vec<&str> = prefix.to_vec();
    all.extend_from_slice(args);
    run(bin, &all)
}

/// Solo rutas a .exe reales. Nunca .ps1/.cmd: en Windows eso abre PowerShell.
fn find_bin(name: &str, candidates: &[PathBuf]) -> Option<PathBuf> {
    for c in candidates {
        if let Some(exe) = as_exe(c) {
            return Some(exe);
        }
    }
    // which puede devolver .ps1; lo pelamos a .exe o lo descartamos.
    if let Ok(path) = which::which(name) {
        if let Some(exe) = as_exe(&path) {
            return Some(exe);
        }
        if let Some(peeled) = peel_npm_shim(&path) {
            return Some(peeled);
        }
    }
    None
}

fn as_exe(path: &Path) -> Option<PathBuf> {
    if !path.exists() {
        return None;
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if ext == "exe" {
        return Some(path.to_path_buf());
    }
    if ext == "cmd" || ext == "bat" || ext == "ps1" {
        return peel_npm_shim(path);
    }
    // Binarios unix / Windows sin extensión (p.ej. `agent` de Cursor CLI)
    #[cfg(windows)]
    {
        // En Windows, archivo sin extensión puede ser el CLI portable
        if ext.is_empty() {
            return Some(path.to_path_buf());
        }
        return None;
    }
    #[cfg(not(windows))]
    {
        Some(path.to_path_buf())
    }
}

fn peel_npm_shim(shim: &Path) -> Option<PathBuf> {
    let parent = shim.parent()?;
    let name = shim
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    let guesses: Vec<PathBuf> = match name.as_str() {
        "claude" => vec![
            parent
                .join("node_modules")
                .join("@anthropic-ai")
                .join("claude-code")
                .join("bin")
                .join("claude.exe"),
        ],
        "codex" => vec![
            parent
                .join("node_modules")
                .join("@openai")
                .join("codex")
                .join("bin")
                .join("codex.exe"),
            parent
                .join("node_modules")
                .join("@openai")
                .join("codex")
                .join("codex.exe"),
        ],
        "cursor-agent" | "agent" => vec![
            shim.with_extension("exe"),
            parent.join("cursor-agent.exe"),
            parent.join("agent.exe"),
        ],
        _ => vec![shim.with_extension("exe")],
    };
    guesses.into_iter().find(|p| p.exists())
}

fn claude_candidates() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let appdata = PathBuf::from(appdata);
        out.push(
            appdata
                .join("npm")
                .join("node_modules")
                .join("@anthropic-ai")
                .join("claude-code")
                .join("bin")
                .join("claude.exe"),
        );
        let base = appdata.join("Claude").join("claude-code");
        push_versioned_exes(&base, "claude.exe", &mut out);
    }
    if let Some(localapp) = std::env::var_os("LOCALAPPDATA") {
        let base = PathBuf::from(localapp)
            .join("Claude")
            .join("claude-code");
        push_versioned_exes(&base, "claude.exe", &mut out);
    }
    out
}

fn codex_candidates() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let appdata = PathBuf::from(appdata);
        out.push(
            appdata
                .join("npm")
                .join("node_modules")
                .join("@openai")
                .join("codex")
                .join("bin")
                .join("codex.exe"),
        );
    }
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        let home = PathBuf::from(home);
        out.push(home.join(".local").join("bin").join("codex.exe"));
        out.push(home.join(".codex").join("bin").join("codex.exe"));
    }
    out
}

fn cursor_candidates() -> Vec<PathBuf> {
    let mut out = vec![];
    // Installer win32: %LOCALAPPDATA%\cursor-agent\ (shims .cmd; el runtime real es versions\*\node.exe)
    if let Some(localapp) = std::env::var_os("LOCALAPPDATA") {
        let root = PathBuf::from(&localapp).join("cursor-agent");
        out.push(root.join("agent.cmd"));
        out.push(root.join("cursor-agent.cmd"));
        if let Ok(entries) = std::fs::read_dir(root.join("versions")) {
            let mut versions: Vec<_> = entries.filter_map(|e| e.ok()).map(|e| e.path()).filter(|p| p.is_dir()).collect();
            versions.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
            for dir in versions {
                out.push(dir.join("node.exe"));
            }
        }
        let bin = PathBuf::from(localapp)
            .join("Programs")
            .join("cursor")
            .join("resources")
            .join("app")
            .join("bin");
        out.push(bin.join("cursor-agent.exe"));
        out.push(bin.join("agent.exe"));
    }
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        let local_bin = PathBuf::from(&home).join(".local").join("bin");
        out.push(local_bin.join("agent.exe"));
        out.push(local_bin.join("agent"));
        out.push(local_bin.join("cursor-agent.exe"));
    }
    out
}

fn push_versioned_exes(base: &Path, exe_name: &str, out: &mut Vec<PathBuf>) {
    if let Ok(entries) = std::fs::read_dir(base) {
        let mut versions: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter_map(|e| e.file_name().into_string().ok())
            .filter(|n| n.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false))
            .collect();
        versions.sort_by(|a, b| b.cmp(a));
        for v in versions {
            out.push(base.join(v).join(exe_name));
        }
    }
}

fn probe_claude(bin: &Option<PathBuf>) -> (bool, bool, Option<String>) {
    let Some(bin) = bin else {
        return (false, false, None);
    };
    let version = run(bin, &["--version"]).map(|s| s.lines().next().unwrap_or("").trim().to_string());
    let auth = run(bin, &["auth", "status"]).unwrap_or_default();
    let logged_in = auth.contains("\"loggedIn\": true") || auth.contains("\"loggedIn\":true");
    (true, logged_in, version)
}

fn probe_codex(bin: &Option<PathBuf>) -> (bool, bool, Option<String>) {
    let Some(bin) = bin else {
        return (false, false, None);
    };
    let version = run(bin, &["--version"]).map(|s| s.trim().to_string());
    let auth = run(bin, &["login", "status"]);
    let logged_in = auth
        .as_ref()
        .map(|s| {
            let lower = s.to_lowercase();
            !lower.contains("not logged") && !lower.contains("no session")
        })
        .unwrap_or(false);
    (true, logged_in, version)
}

fn probe_cursor(bin: &Option<PathBuf>) -> (bool, bool, Option<String>) {
    let Some(bin) = bin else {
        return (false, false, None);
    };
    let version = run(bin, &["--version"]).map(|s| s.trim().to_string());
    (true, version.is_some(), version)
}

fn run(bin: &PathBuf, args: &[&str]) -> Option<String> {
    // Solo .exe: sin cmd.exe ni PowerShell de por medio.
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let mut cmd = Command::new(bin);
        cmd.args(args);
        cmd.creation_flags(CREATE_NO_WINDOW);
        let output = cmd.output().ok()?;
        if !output.status.success() && output.stdout.is_empty() {
            return None;
        }
        return Some(String::from_utf8_lossy(&output.stdout).to_string());
    }
    #[cfg(not(windows))]
    {
        let output = Command::new(bin).args(args).output().ok()?;
        if !output.status.success() && output.stdout.is_empty() {
            return None;
        }
        Some(String::from_utf8_lossy(&output.stdout).to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_three_providers() {
        let all = detect_all();
        assert_eq!(all.len(), 3);
        assert_eq!(all[0].id, "claude");
        assert_eq!(all[1].id, "openai");
        assert_eq!(all[2].id, "cursor");
        for cli in &all {
            if let Some(bin) = &cli.bin {
                let ext = bin.extension().and_then(|e| e.to_str()).unwrap_or("");
                assert!(
                    ext.eq_ignore_ascii_case("exe")
                        || ext.is_empty()
                        || cfg!(not(windows)),
                    "bin debe ser .exe (o agent sin extensión), got {:?}",
                    bin
                );
                assert_ne!(ext, "ps1");
            }
        }
        eprintln!("{}", serde_json::to_string_pretty(&all).unwrap());
    }

    #[test]
    fn peels_npm_claude_shim() {
        let shim = PathBuf::from(r"C:\Users\fake\AppData\Roaming\npm\claude.ps1");
        // sin archivo real → None; solo chequea que no paniquea
        let _ = peel_npm_shim(&shim);
    }
}
