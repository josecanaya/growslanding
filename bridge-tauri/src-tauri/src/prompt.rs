use std::sync::RwLock;

static CACHED: RwLock<Option<String>> = RwLock::new(None);

const FALLBACK: &str = "# Grows\nContrato no disponible. Devolvé JSON minimal {\"reply\":\"error\",\"operations\":[]}.";

/// Contrato embebido = archivo canónico del server (include_str en compile-time).
pub const AGENT_CONTEXT: &str = include_str!("../../../apps/web/lib/bridge/agent-context.md");

pub async fn fetch_and_cache(url: &str, token: &str) -> Result<(), String> {
    let ctx = reqwest::Client::new()
        .get(format!("{}/api/bridge/agent-context", url.trim_end_matches('/')))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    if ctx.trim().is_empty() {
        return Err("contexto vacío".into());
    }
    *CACHED.write().unwrap() = Some(ctx);
    Ok(())
}

pub fn current() -> String {
    CACHED
        .read()
        .unwrap()
        .clone()
        .or_else(|| Some(AGENT_CONTEXT.to_string()))
        .unwrap_or_else(|| FALLBACK.into())
}

#[cfg(test)]
mod tests {
    use super::AGENT_CONTEXT;
    #[test]
    fn embedded_contract_matches_server() {
        assert!(AGENT_CONTEXT.contains("create_node"));
        assert!(AGENT_CONTEXT.contains("nodeType"));
        assert!(AGENT_CONTEXT.contains("tmp-1"));
        assert!(!AGENT_CONTEXT.contains("\"type\":\"create_node\",\"id\":null"));
    }
}
