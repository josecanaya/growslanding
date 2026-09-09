use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
}

pub fn install(id: &str) -> InstallResult {
    let package = match id {
        "claude" => "@anthropic-ai/claude-code",
        "openai" => "@openai/codex",
        "cursor" => {
            return InstallResult {
                success: false,
                message: "Cursor Agent viene con el editor Cursor. Descargalo de cursor.com.".into(),
            }
        }
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
    let args: Vec<&str> = match id {
        "claude" => vec!["auth", "login"],
        "openai" => vec!["login"],
        _ => {
            return InstallResult {
                success: false,
                message: "Este CLI no requiere login manual.".into(),
            }
        }
    };
    #[cfg(windows)]
    let result = Command::new("cmd")
        .args(["/C", "start", "cmd", "/K"])
        .arg(bin)
        .args(&args)
        .spawn();
    #[cfg(not(windows))]
    let result = Command::new(bin).args(&args).spawn();
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
