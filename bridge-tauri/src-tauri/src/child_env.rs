/// Devuelve solo las variables de entorno que los CLIs necesitan para funcionar
/// (login, sesiones, PATH, TEMP). Excluye credenciales del bridge y API keys.
/// Espeja `childEnvironment` de grows-bridge.mjs.
pub fn safe_env() -> Vec<(String, String)> {
    const KEEP: &[&str] = &[
        "PATH",
        "Path",
        "PATHEXT",
        "SYSTEMROOT",
        "SystemRoot",
        "WINDIR",
        "COMSPEC",
        "TEMP",
        "TMP",
        "HOME",
        "USERPROFILE",
        "HOMEDRIVE",
        "HOMEPATH",
        "USERNAME",
        "USER",
        "LOCALAPPDATA",
        "APPDATA",
        "CODEX_HOME",
        // Cursor CLI puede leer la sesión vía esta key si el usuario la configuró.
        // No es el token del bridge; no inventamos valores — solo pasamos si ya existe.
        "CURSOR_API_KEY",
    ];
    let mut out = Vec::new();
    for &k in KEEP {
        if let Ok(v) = std::env::var(k) {
            if !v.is_empty() {
                out.push((k.to_string(), v));
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn excludes_grows_bridge_token() {
        std::env::set_var("GROWS_BRIDGE_TOKEN", "s3cr3t");
        std::env::set_var("OPENAI_API_KEY", "sk-abc");
        let e = safe_env();
        assert!(!e.iter().any(|(k, _)| k == "GROWS_BRIDGE_TOKEN"));
        assert!(!e.iter().any(|(k, _)| k == "OPENAI_API_KEY"));
        assert!(e.iter().any(|(k, _)| k == "PATH" || k == "Path"));
    }
}
