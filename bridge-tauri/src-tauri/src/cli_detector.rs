use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
pub struct CliStatus {
    pub id: String,
    pub label: String,
    pub bin: Option<PathBuf>,
    pub installed: bool,
    pub logged_in: bool,
    pub version: Option<String>,
}

pub fn detect_all() -> Vec<CliStatus> {
    vec![detect_claude(), detect_codex(), detect_cursor()]
}

fn detect_claude() -> CliStatus {
    let bin = find_bin("claude", &claude_globs());
    let (installed, logged_in, version) = probe_claude(&bin);
    CliStatus {
        id: "claude".into(),
        label: "Anthropic · Claude".into(),
        bin,
        installed,
        logged_in,
        version,
    }
}

fn detect_codex() -> CliStatus {
    let bin = find_bin("codex", &codex_globs());
    let (installed, logged_in, version) = probe_codex(&bin);
    CliStatus {
        id: "openai".into(),
        label: "OpenAI · Codex".into(),
        bin,
        installed,
        logged_in,
        version,
    }
}

fn detect_cursor() -> CliStatus {
    let bin = find_bin("cursor-agent", &cursor_globs());
    let (installed, logged_in, version) = probe_cursor(&bin);
    CliStatus {
        id: "cursor".into(),
        label: "Cursor".into(),
        bin,
        installed,
        logged_in,
        version,
    }
}

fn find_bin(name: &str, globs: &[PathBuf]) -> Option<PathBuf> {
    if let Ok(path) = which::which(name) {
        // Preferir .cmd sobre .ps1 en Windows (ver bridge Node actual)
        if path.extension().map(|e| e == "ps1").unwrap_or(false) {
            let cmd = path.with_extension("cmd");
            if cmd.exists() {
                return Some(cmd);
            }
        }
        return Some(path);
    }
    for g in globs {
        if g.exists() {
            return Some(g.clone());
        }
    }
    None
}

fn claude_globs() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let base = PathBuf::from(&appdata).join("Claude").join("claude-code");
        if let Ok(entries) = std::fs::read_dir(&base) {
            let mut versions: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter_map(|e| e.file_name().into_string().ok())
                .filter(|n| n.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false))
                .collect();
            versions.sort_by(|a, b| b.cmp(a));
            for v in versions {
                out.push(base.join(&v).join("claude.exe"));
            }
        }
        out.push(PathBuf::from(&appdata).join("npm").join("claude.cmd"));
    }
    if let Some(localapp) = std::env::var_os("LOCALAPPDATA") {
        let base = PathBuf::from(&localapp).join("Claude").join("claude-code");
        if let Ok(entries) = std::fs::read_dir(&base) {
            let mut versions: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter_map(|e| e.file_name().into_string().ok())
                .filter(|n| n.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false))
                .collect();
            versions.sort_by(|a, b| b.cmp(a));
            for v in versions {
                out.push(base.join(&v).join("claude.exe"));
            }
        }
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
        out.push(
            PathBuf::from(&localapp)
                .join("Programs")
                .join("cursor")
                .join("resources")
                .join("app")
                .join("bin")
                .join("cursor-agent.cmd"),
        );
    }
    if let Some(appdata) = std::env::var_os("APPDATA") {
        out.push(PathBuf::from(&appdata).join("npm").join("cursor-agent.cmd"));
    }
    out
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
    let mut cmd = Command::new(bin);
    cmd.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW — evita flash de terminal
    }
    let output = cmd.output().ok()?;
    if !output.status.success() && output.stdout.is_empty() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
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
                assert_ne!(bin.extension().and_then(|e| e.to_str()), Some("ps1"));
            }
        }
        eprintln!("{}", serde_json::to_string_pretty(&all).unwrap());
    }
}
