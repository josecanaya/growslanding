#!/usr/bin/env bash
#
# Grows Cloud Worker — atajo de diagnóstico.
#
# Carga /etc/grows-agent/grows-agent.env y corre cloud-agent-check.mjs como el
# usuario grows-agent, para que vea la MISMA sesión de Claude que verá systemd.
#
# Uso:  sudo bash /opt/grows-agent/check.sh
#
# No imprime el token en ningún momento.

set -euo pipefail

readonly AGENT_USER="grows-agent"
readonly CONF_FILE="/etc/grows-agent/grows-agent.env"
readonly APP_DIR="/opt/grows-agent"

[[ "$(id -u)" -eq 0 ]] || { echo "Ejecutá con sudo: sudo bash $0" >&2; exit 2; }
[[ -r "$CONF_FILE" ]]  || { echo "No existe $CONF_FILE. Corré install-ubuntu.sh primero." >&2; exit 1; }

# Leemos la config sin volcarla a la consola ni al entorno del shell actual.
GROWS_BRIDGE_URL="$(sed -n 's/^GROWS_BRIDGE_URL=//p' "$CONF_FILE" | tail -n1)"
GROWS_BRIDGE_TOKEN="$(sed -n 's/^GROWS_BRIDGE_TOKEN=//p' "$CONF_FILE" | tail -n1)"

NODE_BIN="$(command -v node || echo /usr/bin/node)"

# sudo -u con env explícito: el proceso hijo recibe solo lo necesario.
# HOME se fuerza para que Claude encuentre las credenciales de grows-agent.
exec sudo -u "$AGENT_USER" env \
  HOME="/home/${AGENT_USER}" \
  PATH="/home/${AGENT_USER}/.local/bin:/usr/local/bin:/usr/bin:/bin" \
  GROWS_BRIDGE_URL="$GROWS_BRIDGE_URL" \
  GROWS_BRIDGE_TOKEN="$GROWS_BRIDGE_TOKEN" \
  "$NODE_BIN" "${APP_DIR}/cloud-agent-check.mjs"
