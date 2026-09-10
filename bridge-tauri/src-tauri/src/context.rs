use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Serialize)]
pub struct CompactContext {
    #[serde(rename = "currentScopeId")]
    pub current_scope_id: Option<String>,
    #[serde(rename = "scopePathIds")]
    pub scope_path_ids: Vec<String>,
    #[serde(rename = "selectionIds")]
    pub selection_ids: Vec<String>,
    #[serde(rename = "recentThread", skip_serializing_if = "Vec::is_empty")]
    pub recent_thread: Vec<Value>,
    pub canvas: CompactCanvas,
}

#[derive(Debug, Serialize)]
pub struct CompactCanvas {
    #[serde(rename = "obraNombre", skip_serializing_if = "Option::is_none")]
    pub obra_nombre: Option<String>,
    pub nodes: Vec<CompactNode>,
    pub edges: Vec<CompactEdge>,
}

#[derive(Debug, Serialize)]
pub struct CompactNode {
    pub id: String,
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    #[serde(rename = "type")]
    pub node_type: Option<String>,
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(rename = "fromNodeId", skip_serializing_if = "Option::is_none")]
    pub from_node_id: Option<String>,
    #[serde(rename = "toNodeId", skip_serializing_if = "Option::is_none")]
    pub to_node_id: Option<String>,
    #[serde(rename = "transformKind", skip_serializing_if = "Option::is_none")]
    pub transform_kind: Option<String>,
    #[serde(rename = "durationDays", skip_serializing_if = "Option::is_none")]
    pub duration_days: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct CompactEdge {
    pub id: String,
    #[serde(rename = "sourceId")]
    pub source_id: String,
    #[serde(rename = "targetId")]
    pub target_id: String,
    pub relation: String,
}

/// Portada de compactJobContext (grows-bridge.mjs): scope + selección + referencias.
pub fn compact(
    canvas: &Value,
    scope_path_ids: &[String],
    selection_ids: &[String],
    recent_thread: &[Value],
) -> CompactContext {
    let scope_id = scope_path_ids.last().cloned();
    let selected: std::collections::HashSet<&String> = selection_ids.iter().collect();
    let empty = Vec::new();
    let nodes_val = canvas.get("nodes").and_then(|v| v.as_array()).unwrap_or(&empty);
    let edges_val = canvas.get("edges").and_then(|v| v.as_array()).unwrap_or(&empty);

    let mut included: std::collections::HashSet<String> = std::collections::HashSet::new();
    for n in nodes_val {
        let id = n.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string();
        let parent = n.get("parentId").and_then(|v| v.as_str());
        let matches_scope = match &scope_id {
            Some(s) => parent == Some(s.as_str()),
            None => parent.is_none() || parent == Some(""),
        };
        if matches_scope || selected.contains(&id) {
            included.insert(id);
        }
    }
    for n in nodes_val {
        let id = n.get("id").and_then(|v| v.as_str()).unwrap_or_default();
        if !included.contains(id) {
            continue;
        }
        if let Some(from) = n.get("fromNodeId").and_then(|v| v.as_str()) {
            included.insert(from.to_string());
        }
        if let Some(to) = n.get("toNodeId").and_then(|v| v.as_str()) {
            included.insert(to.to_string());
        }
    }

    let mut out_nodes = Vec::new();
    for n in nodes_val {
        let id = n.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string();
        if !included.contains(&id) {
            continue;
        }
        out_nodes.push(CompactNode {
            id: id.clone(),
            parent_id: n.get("parentId").and_then(|v| v.as_str()).map(String::from),
            node_type: n.get("type").and_then(|v| v.as_str()).map(String::from),
            title: n.get("title").and_then(|v| v.as_str()).map(String::from),
            description: n.get("descripcion").and_then(|v| v.as_str()).map(String::from),
            status: n
                .get("graphStatus")
                .or(n.get("estadoTarea"))
                .or(n.get("estadoNivel"))
                .and_then(|v| v.as_str())
                .map(String::from),
            from_node_id: n.get("fromNodeId").and_then(|v| v.as_str()).map(String::from),
            to_node_id: n.get("toNodeId").and_then(|v| v.as_str()).map(String::from),
            transform_kind: n.get("transformKind").and_then(|v| v.as_str()).map(String::from),
            duration_days: n.get("duracionDias").and_then(|v| v.as_f64()),
        });
    }

    let mut out_edges = Vec::new();
    for e in edges_val {
        let src = e.get("sourceId").and_then(|v| v.as_str()).unwrap_or_default();
        let tgt = e.get("targetId").and_then(|v| v.as_str()).unwrap_or_default();
        if !included.contains(src) || !included.contains(tgt) {
            continue;
        }
        out_edges.push(CompactEdge {
            id: e.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
            source_id: src.to_string(),
            target_id: tgt.to_string(),
            relation: e
                .get("relation")
                .and_then(|v| v.as_str())
                .unwrap_or("precede")
                .to_string(),
        });
    }

    CompactContext {
        current_scope_id: scope_id,
        scope_path_ids: scope_path_ids.to_vec(),
        selection_ids: selection_ids.to_vec(),
        recent_thread: recent_thread.to_vec(),
        canvas: CompactCanvas {
            obra_nombre: canvas.get("obraNombre").and_then(|v| v.as_str()).map(String::from),
            nodes: out_nodes,
            edges: out_edges,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn compact_scope_and_selection_only() {
        let canvas = json!({
            "obraNombre": "Casa",
            "nodes": [
                { "id": "floor", "parentId": null, "type": "etapa", "title": "Piso" },
                { "id": "a", "parentId": "floor", "type": "tarea", "title": "A" },
                { "id": "b", "parentId": "floor", "type": "tarea", "title": "B" },
                { "id": "other", "parentId": null, "type": "etapa", "title": "Otro" }
            ],
            "edges": [
                { "id": "ab", "sourceId": "a", "targetId": "b", "relation": "precede" }
            ]
        });
        let ctx = compact(&canvas, &["floor".into()], &[], &[]);
        let ids: Vec<&str> = ctx.canvas.nodes.iter().map(|n| n.id.as_str()).collect();
        assert_eq!(ids, vec!["a", "b"]);
        assert_eq!(ctx.canvas.edges.len(), 1);
        assert_eq!(ctx.current_scope_id.as_deref(), Some("floor"));
    }

    #[test]
    fn compact_includes_selection_from_outside_scope() {
        let canvas = json!({
            "nodes": [
                { "id": "a", "parentId": "s1", "title": "A" },
                { "id": "x", "parentId": "s2", "title": "X" }
            ], "edges": []
        });
        let ctx = compact(&canvas, &["s1".into()], &["x".into()], &[]);
        let ids: Vec<&str> = ctx.canvas.nodes.iter().map(|n| n.id.as_str()).collect();
        assert!(ids.contains(&"a"));
        assert!(ids.contains(&"x"));
    }
}
