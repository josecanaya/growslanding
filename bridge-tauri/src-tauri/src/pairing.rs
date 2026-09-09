use crate::config::{self, BridgeConfig};
use url::Url;

pub fn handle_pair_url(app: &tauri::AppHandle, raw: &str) -> Result<(), String> {
    let parsed = Url::parse(raw).map_err(|e| e.to_string())?;
    if parsed.scheme() != "grows" || parsed.host_str() != Some("pair") {
        return Err("URL inválida".into());
    }
    let mut url = None;
    let mut token = None;
    for (k, v) in parsed.query_pairs() {
        match k.as_ref() {
            "url" => url = Some(v.to_string()),
            "token" => token = Some(v.to_string()),
            _ => {}
        }
    }
    let url = url.ok_or("Falta url")?;
    let token = token.ok_or("Falta token")?;
    if !token.chars().all(|c| c.is_ascii_hexdigit()) || token.len() != 64 {
        return Err("Token inválido".into());
    }
    config::save(app, &BridgeConfig {
        url: Some(url),
        token: Some(token),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_bad_scheme() {
        assert!(handle_pair_url_parse_only("https://example.com").is_err());
    }

    fn handle_pair_url_parse_only(raw: &str) -> Result<(String, String), String> {
        let parsed = Url::parse(raw).map_err(|e| e.to_string())?;
        if parsed.scheme() != "grows" || parsed.host_str() != Some("pair") {
            return Err("URL inválida".into());
        }
        let mut url = None;
        let mut token = None;
        for (k, v) in parsed.query_pairs() {
            match k.as_ref() {
                "url" => url = Some(v.to_string()),
                "token" => token = Some(v.to_string()),
                _ => {}
            }
        }
        Ok((url.ok_or("Falta url")?, token.ok_or("Falta token")?))
    }

    #[test]
    fn parses_pair_url() {
        let token = "a".repeat(64);
        let raw = format!("grows://pair?url=https://app.grows.com.ar&token={}", token);
        let (url, t) = handle_pair_url_parse_only(&raw).unwrap();
        assert_eq!(url, "https://app.grows.com.ar");
        assert_eq!(t.len(), 64);
    }
}
