use std::sync::RwLock;

static CACHED: RwLock<Option<String>> = RwLock::new(None);

const FALLBACK: &str = "# Grows\nContrato no disponible. Devolvé JSON minimal {\"reply\":\"error\",\"operations\":[]}.";

/// Contrato embebido de respaldo (también vive en el server).
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
