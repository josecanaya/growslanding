use crate::cli_detector::CliStatus;
use crate::prompt;
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;
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
}

#[derive(Debug, Serialize)]
pub struct JobResult {
    pub reply: String,
    pub operations: Vec<serde_json::Value>,
}

pub async fn execute(job: &Job, capabilities: &[CliStatus]) -> Result<JobResult, String> {
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
    let compact = crate::context::compact(&job.canvas, &job.scope_path_ids, &job.selection_ids);
    let user_prompt = format!(
        "Regla y esquema en AGENTS.md del cwd.\n\nPEDIDO:\n{}\n\nNIVEL VISIBLE DE LA OBRA:\n{}",
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

    let args: Vec<String> = match provider {
        "openai" => ["exec", "-m", model, "--sandbox", "read-only", "--json", "-"]
            .into_iter()
            .map(String::from)
            .collect(),
        "claude" => [
            "-p",
            "--model",
            model,
            "--output-format",
            "json",
            "--permission-mode",
            "plan",
            "--max-turns",
            "1",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
        "cursor" => ["-p", "--model", model, "--output-format", "json"]
            .into_iter()
            .map(String::from)
            .collect(),
        _ => return Err(format!("Proveedor desconocido: {}", provider)),
    };

    let mut cmd = Command::new(bin);
    cmd.args(&args)
        .current_dir(temp_dir.path())
        .env_clear()
        .envs(crate::child_env::safe_env())
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("No se pudo lanzar {}: {}", cap.label, e))?;
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
    let inner = if let Some(result) = parsed.get("result") {
        match result {
            serde_json::Value::String(s) => parse_agent_json(s).unwrap_or(parsed.clone()),
            other => other.clone(),
        }
    } else {
        parsed
    };
    let reply = inner
        .get("reply")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let ops = inner
        .get("operations")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    Ok(JobResult {
        reply,
        operations: ops,
    })
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
/// Nunca panickea con caracteres multibyte (ñ, á, emoji, etc.).
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
        let s = "ñ".repeat(5000); // cada 'ñ' son 2 bytes
        let t = truncate_utf8(&s, 4000);
        assert!(t.len() <= 4000);
        assert!(t.is_char_boundary(t.len()));
        assert!(std::str::from_utf8(t.as_bytes()).is_ok());
    }

    #[test]
    fn truncate_utf8_short_string_untouched() {
        assert_eq!(truncate_utf8("hola", 100), "hola");
    }
}
