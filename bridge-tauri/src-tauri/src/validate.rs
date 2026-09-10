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
    fn rejects_extra_field() {
        let mut op = base_op();
        op["capital"] = json!(200);
        let r = json!({"reply": "x", "operations": [op]});
        assert!(validate_result(&r).unwrap_err().contains("capital"));
    }
}
