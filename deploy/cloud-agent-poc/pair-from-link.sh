#!/usr/bin/env bash
#
# Grows Cloud Worker — cargar URL y token desde el link de emparejamiento.
#
# Grows muestra en pantalla un link con esta forma al tocar "Conectar":
#   grows://pair?url=https%3A%2F%2Fapp.grows.com.ar&token=<64 hex>
#
# Este script lo parsea y escribe /etc/grows-agent/grows-agent.env con los
# permisos correctos, sin que tengas que copiar el token a mano.
#
# Uso:  sudo bash /opt/grows-agent/pair-from-link.sh
#       (te lo pide por teclado; no queda en el historial del shell)

set -euo pipefail

readonly AGENT_USER="grows-agent"
readonly CONF_DIR="/etc/grows-agent"
readonly CONF_FILE="${CONF_DIR}/grows-agent.env"

[[ "$(id -u)" -eq 0 ]] || { echo "Ejecutá con sudo: sudo bash $0" >&2; exit 2; }
command -v node >/dev/null 2>&1 || { echo "Node no está instalado. Corré install-ubuntu.sh primero." >&2; exit 1; }

echo
echo "Pegá el link de emparejamiento que muestra Grows y presioná Enter."
echo "Empieza con  grows://pair?url=…"
echo
# -r: no interpreta backslashes. -s evitaría el eco, pero acá conviene ver el
# link para detectar un pegado incompleto; el token se valida más abajo.
read -rp "Link: " LINK
echo

[[ -n "${LINK:-}" ]] || { echo "No pegaste nada." >&2; exit 1; }

# Parseamos con Node (ya está instalado) en vez de con regex frágiles.
# El esquema grows:// no lo entiende la clase URL, así que lo mapeamos a https://
PARSED="$(node -e '
  const raw = process.argv[1].trim();
  if (!raw.startsWith("grows://pair")) {
    console.error("El link debe empezar con grows://pair");
    process.exit(1);
  }
  let u;
  try { u = new URL(raw.replace(/^grows:\/\//, "https://")); }
  catch { console.error("El link no se pudo interpretar."); process.exit(1); }
  const url = u.searchParams.get("url");
  const token = u.searchParams.get("token");
  if (!url) { console.error("Al link le falta el parámetro url."); process.exit(1); }
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    console.error("El token no tiene el formato esperado (64 hex).");
    process.exit(1);
  }
  let origin;
  try { origin = new URL(url).origin; }
  catch { console.error("La url del link es inválida."); process.exit(1); }
  if (!origin.startsWith("https://") && !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin)) {
    console.error("La url debe ser HTTPS.");
    process.exit(1);
  }
  // Salida en dos líneas: la consume el bash de abajo.
  process.stdout.write(origin + "\n" + token + "\n");
' "$LINK")" || { echo "No se pudo leer el link. Copialo completo desde Grows." >&2; exit 1; }

GROWS_URL="$(printf '%s' "$PARSED" | sed -n '1p')"
GROWS_TOKEN="$(printf '%s' "$PARSED" | sed -n '2p')"

install -d -m 0750 -o root -g "$AGENT_USER" "$CONF_DIR"

# umask 077 para que el archivo no exista ni un instante como world-readable.
( umask 077
  cat > "$CONF_FILE" <<EOF
# Generado por pair-from-link.sh — $(date -Iseconds)
GROWS_BRIDGE_URL=${GROWS_URL}
GROWS_BRIDGE_TOKEN=${GROWS_TOKEN}
EOF
)
chown root:"$AGENT_USER" "$CONF_FILE"
chmod 0640 "$CONF_FILE"

echo "Configuración guardada en ${CONF_FILE}"
echo "  URL    ${GROWS_URL}"
echo "  Token  presente (64 hex, no se muestra)"
echo
echo "Siguiente paso:"
echo "  sudo bash /opt/grows-agent/check.sh"
echo
