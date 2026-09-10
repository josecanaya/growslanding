use serde_json::Value;

const OP_TYPES: &[&str] = &[
    "create_node",
    "update_node",
    "delete_node",
    "create_edge",
    "delete_edge",
    "propose_transform",
];
const NODE_TYPES: &[&str] = &["etapa", "planta", "sector", "ambiente", "tarea", "estado"];
const RELATIONS: &[&str] = &[
    "precede",
    "depende_de",
    "habilita",
    "requiere",
    "afecta",
    "se_ejecuta_mediante",
];
const TRANSFORM_KINDS: &[&str] = &["conocimiento", "coordinacion", "ejecucion"];
const EXECUTOR_KINDS: &[&str] = &["humano", "empresa", "agente", "sin_asignar"];
const REQUIRED_FIELDS: &[&str] = &[
    "type",
    "id",
    "parentId",
    "title",
    "description",
    "nodeType",
    "sourceId",
    "targetId",
    "relation",
    "fromNodeId",
    "toNodeId",
    "transformKind",
    "executorKind",
    "quantity",
    "unit",
    "durationDays",
    "sources",
    "assumptions",
];

pub fn validate_result(v: &Value) -> Result<(), String> {
    let sanitized = sanitize_result(v)?;
    validate_result_strict(&sanitized)
}

/// Quita campos inventados por el LLM y completa los requeridos con null/[].
pub fn sanitize_result(v: &Value) -> Result<Value, String> {
    let obj = v.as_object().ok_or("El agente no devolvió un objeto JSON")?;
    let reply = obj.get("reply").and_then(|v| v.as_str()).ok_or("Falta 'reply'")?;
    let ops = obj
        .get("operations")
        .and_then(|v| v.as_array())
        .ok_or("Falta 'operations' como array")?;
    let mut clean_ops = Vec::with_capacity(ops.len());
    for op in ops {
        let op = op.as_object().ok_or("Operación no es un objeto")?;
        let mut m = serde_json::Map::new();
        for f in REQUIRED_FIELDS {
            let default = if *f == "sources" || *f == "assumptions" {
                Value::Array(vec![])
            } else if *f == "type" {
                Value::Null
            } else {
                Value::Null
            };
            // Alias comunes del LLM (solo strings/null; objetos inventados se ignoran)
            let value = if op.contains_key(*f) {
                op.get(*f).cloned().unwrap_or(default)
            } else if *f == "id" {
                op.get("nodeId")
                    .filter(|v| v.is_string() || v.is_null())
                    .cloned()
                    .unwrap_or(Value::Null)
            } else if *f == "nodeType" {
                op.get("node")
                    .filter(|v| v.is_string() || v.is_null())
                    .or_else(|| op.get("tipo").filter(|v| v.is_string() || v.is_null()))
                    .cloned()
                    .unwrap_or(Value::Null)
            } else if *f == "title" {
                op.get("name")
                    .filter(|v| v.is_string() || v.is_null())
                    .or_else(|| op.get("nombre").filter(|v| v.is_string() || v.is_null()))
                    .cloned()
                    .unwrap_or(Value::Null)
            } else if *f == "parentId" {
                op.get("parent")
                    .filter(|v| v.is_string() || v.is_null())
                    .or_else(|| op.get("padre").filter(|v| v.is_string() || v.is_null()))
                    .cloned()
                    .unwrap_or(Value::Null)
            } else {
                default
            };
            m.insert((*f).to_string(), value);
        }
        // Si inventó "node" como objeto anidado, no lo copiamos; el resto ya está en campos canónicos.
        clean_ops.push(Value::Object(m));
    }
    Ok(serde_json::json!({
        "reply": reply,
        "operations": clean_ops,
    }))
}

fn validate_result_strict(v: &Value) -> Result<(), String> {
    let obj = v.as_object().ok_or("El agente no devolvió un objeto JSON")?;
    let reply = obj.get("reply").and_then(|v| v.as_str()).ok_or("Falta 'reply'")?;
    if reply.len() > 16000 {
        return Err("'reply' es demasiado largo (>16000)".into());
    }
    let ops = obj
        .get("operations")
        .and_then(|v| v.as_array())
        .ok_or("Falta 'operations' como array")?;
    if ops.len() > 100 {
        return Err(format!("Demasiadas operaciones ({} > 100)", ops.len()));
    }
    for op in ops {
        let op = op.as_object().ok_or("Operación no es un objeto")?;
        for k in op.keys() {
            if !REQUIRED_FIELDS.contains(&k.as_str()) {
                return Err(format!(
                    "El agente inventó el campo \"{}\" (no existe en el canvas). Esos datos van en \"description\" o \"assumptions\".",
                    k
                ));
            }
        }
        let ty = op
            .get("type")
            .and_then(|v| v.as_str())
            .ok_or("Falta 'type' en operación")?;
        if !OP_TYPES.contains(&ty) {
            return Err(format!(
                "Tipo de operación no permitido: \"{}\". Permitidos: {}",
                ty,
                OP_TYPES.join(", ")
            ));
        }
        for f in REQUIRED_FIELDS {
            if !op.contains_key(*f) {
                return Err(format!("Falta el campo \"{}\" en la operación \"{}\"", f, ty));
            }
        }
        check_enum(op, "nodeType", NODE_TYPES)?;
        check_enum(op, "relation", RELATIONS)?;
        check_enum(op, "transformKind", TRANSFORM_KINDS)?;
        check_enum(op, "executorKind", EXECUTOR_KINDS)?;
        for f in [
            "id",
            "parentId",
            "title",
            "description",
            "sourceId",
            "targetId",
            "fromNodeId",
            "toNodeId",
            "unit",
        ] {
            if let Some(Value::String(s)) = op.get(f) {
                if s.len() > 8000 {
                    return Err(format!("El campo \"{}\" es demasiado largo", f));
                }
            }
        }
        for f in ["quantity", "durationDays"] {
            if let Some(v) = op.get(f) {
                if v.is_null() {
                    continue;
                }
                let n = v
                    .as_f64()
                    .ok_or_else(|| format!("Valor numérico inválido en \"{}\"", f))?;
                if !n.is_finite() || n < 0.0 {
                    return Err(format!("Valor numérico inválido en \"{}\"", f));
                }
            }
        }
        for f in ["sources", "assumptions"] {
            if let Some(Value::Array(a)) = op.get(f) {
                if a.len() > 50 {
                    return Err(format!("Lista inválida en \"{}\"", f));
                }
                for item in a {
                    let s = item
                        .as_str()
                        .ok_or_else(|| format!("Lista inválida en \"{}\"", f))?;
                    if s.len() > 4000 {
                        return Err(format!("Lista inválida en \"{}\"", f));
                    }
                }
            } else if !op.get(f).map(|v| v.is_null()).unwrap_or(true) {
                return Err(format!("Lista inválida en \"{}\"", f));
            }
        }
    }
    Ok(())
}

fn check_enum(
    op: &serde_json::Map<String, Value>,
    field: &str,
    allowed: &[&str],
) -> Result<(), String> {
    match op.get(field) {
        Some(Value::Null) | None => Ok(()),
        Some(Value::String(s)) if allowed.contains(&s.as_str()) => Ok(()),
        _ => Err(format!(
            "Valor no permitido en \"{}\" (opciones: {})",
            field,
            allowed.join(", ")
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn base_op() -> serde_json::Value {
        let mut m = serde_json::Map::new();
        for f in REQUIRED_FIELDS {
            m.insert(f.to_string(), Value::Null);
        }
        m.insert("type".into(), json!("create_node"));
        m.insert("sources".into(), json!([]));
        m.insert("assumptions".into(), json!([]));
        m.insert("id".into(), json!("tmp-1"));
        m.insert("title".into(), json!("X"));
        m.insert("nodeType".into(), json!("tarea"));
        Value::Object(m)
    }

    #[test]
    fn accepts_valid() {
        let r = json!({"reply": "ok", "operations": [base_op()]});
        assert!(validate_result(&r).is_ok());
    }

    #[test]
    fn rejects_invalid_type() {
        let mut op = base_op();
        op["type"] = json!("etapa");
        let r = json!({"reply": "x", "operations": [op]});
        assert!(validate_result(&r).unwrap_err().contains("Tipo de operación"));
    }

    #[test]
    fn strips_extra_field_then_accepts() {
        let mut op = base_op();
        op["capital"] = json!(200);
        op["node"] = json!("tarea");
        let r = json!({"reply": "x", "operations": [op]});
        assert!(validate_result(&r).is_ok());
        let clean = sanitize_result(&r).unwrap();
        assert!(clean["operations"][0].get("capital").is_none());
        assert!(clean["operations"][0].get("node").is_none());
    }

    #[test]
    fn maps_aliases_and_ignores_object_node() {
        let r = json!({
            "reply": "ok",
            "operations": [{
                "type": "create_node",
                "nodeId": "tmp-1",
                "name": "Viga",
                "parent": "floor-1",
                "node": {"inventado": true},
                "tipo": "tarea",
                "capital": 99
            }]
        });
        let clean = sanitize_result(&r).unwrap();
        let op = &clean["operations"][0];
        assert_eq!(op["id"], json!("tmp-1"));
        assert_eq!(op["title"], json!("Viga"));
        assert_eq!(op["parentId"], json!("floor-1"));
        assert_eq!(op["nodeType"], json!("tarea"));
        assert!(op.get("capital").is_none());
        assert!(validate_result(&r).is_ok());
    }
}
