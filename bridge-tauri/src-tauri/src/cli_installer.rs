use crate::cli_detector;
use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
}

pub fn install(id: &str) -> InstallResult {
    if id == "cursor" {
        if cli_detector::resolve_cursor_node_entry().is_some() {
            return InstallResult {
                success: true,
                message: "Cursor CLI ya está instalado en esta PC. Cerrá este mensaje: debería pasar a Listo / Login.".into(),
            };
        }
        return InstallResult {
            success: false,
            message: "No encontré Cursor CLI. En PowerShell corré:\nirm 'https://cursor.com/install?win32=true' | iex\nDespués reiniciá Grows Agent.".into(),
        };
    }
    let package = match id {
        "claude" => "@anthropic-ai/claude-code",
        "openai" => "@openai/codex",
        _ => {
            return InstallResult {
                success: false,
                message: format!("CLI desconocido: {}", id),
            }
        }
    };
    let mut cmd = Command::new(npm_cmd());
    cmd.args(["install", "-g", package]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output();
    match output {
        Ok(o) if o.status.success() => InstallResult {
            success: true,
            message: format!("{} instalado.", package),
        },
        Ok(o) => InstallResult {
            success: false,
            message: String::from_utf8_lossy(&o.stderr).to_string(),
        },
        Err(e) => InstallResult {
            success: false,
            message: format!("npm no encontrado. Instala Node.js primero. ({})", e),
        },
    }
}

pub fn open_login(id: &str, bin: &std::path::Path) -> InstallResult {
    let (launch_bin, args): (std::path::PathBuf, Vec<String>) = match id {
        "claude" => (bin.to_path_buf(), vec!["auth".into(), "login".into()]),
        "openai" => (bin.to_path_buf(), vec!["login".into()]),
        "cursor" => {
            if let Some((node, index)) = cli_detector::resolve_cursor_node_entry() {
                (node, vec![index.to_string_lossy().into_owned(), "login".into()])
            } else if !bin.as_os_str().is_empty() {
                (bin.to_path_buf(), vec!["login".into()])
            } else {
                return InstallResult {
                    success: false,
                    message: "No encontré Cursor CLI instalado.".into(),
                };
            }
        }
        _ => {
            return InstallResult {
                success: false,
                message: "Este CLI no requiere login manual.".into(),
            }
        }
    };
    #[cfg(windows)]
    let result = {
        let mut cmdline = format!("\"{}\"", launch_bin.display());
        for a in &args {
            cmdline.push(' ');
            if a.chars().any(|c| c.is_whitespace()) {
                cmdline.push('"');
                cmdline.push_str(a);
                cmdline.push('"');
            } else {
                cmdline.push_str(a);
            }
        }
        Command::new("cmd")
            .args(["/C", "start", "cmd", "/K", &cmdline])
            .spawn()
    };
    #[cfg(not(windows))]
    let result = Command::new(&launch_bin).args(&args).spawn();
    match result {
        Ok(_) => InstallResult {
            success: true,
            message: "Terminal abierta. Seguí las instrucciones y volvé acá cuando termines.".into(),
        },
        Err(e) => InstallResult {
            success: false,
            message: format!("No se pudo abrir la terminal: {}", e),
        },
    }
}

fn npm_cmd() -> &'static str {
    if cfg!(windows) {
        "npm.cmd"
    } else {
        "npm"
    }
}
