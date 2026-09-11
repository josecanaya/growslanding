#!/usr/bin/env bash
#
# Grows Cloud Worker — instalador para Ubuntu (POC).
#
# Prepara una VM limpia para ejecutar scripts/grows-bridge.mjs como servicio
# systemd, bajo el usuario grows-agent, con la sesión de Claude persistiendo en
# /home/grows-agent.
#
# NO inicia el servicio: falta que cargues URL+token y que autentiques Claude.
# NO contiene secretos. NO toca Grows Agent Desktop (Tauri) ni el repo web.
#
# Uso:
#   sudo bash install-ubuntu.sh                 # instala todo, incluido Claude
#   sudo bash install-ubuntu.sh --skip-claude   # no instala Claude (lo hacés vos)
#   sudo bash install-ubuntu.sh --skip-node     # no toca Node (ya tenés 18+)
#
# Idempotente: se puede volver a correr para actualizar el worker.

set -euo pipefail

# ── Parámetros ───────────────────────────────────────────────────────────────
readonly AGENT_USER="grows-agent"
readonly AGENT_HOME="/home/${AGENT_USER}"
readonly APP_DIR="/opt/grows-agent"
readonly CONF_DIR="/etc/grows-agent"
readonly CONF_FILE="${CONF_DIR}/grows-agent.env"
readonly SERVICE_NAME="grows-agent"
readonly UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
readonly NODE_MAJOR="22"
readonly RAW_BASE="https://raw.githubusercontent.com/josecanaya/growslanding/main"

SKIP_CLAUDE=0
SKIP_NODE=0
for arg in "$@"; do
  case "$arg" in
    --skip-claude) SKIP_CLAUDE=1 ;;
    --skip-node)   SKIP_NODE=1 ;;
    -h|--help)     sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $arg" >&2; exit 2 ;;
  esac
done

# ── Utilidades ───────────────────────────────────────────────────────────────
log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
die()  { printf '\n\033[31mERROR: %s\033[0m\n\n' "$*" >&2; exit 1; }

# ── 1. Comprobaciones previas ────────────────────────────────────────────────
log "Comprobando el sistema"

[[ "$(id -u)" -eq 0 ]] || die "Ejecutá con sudo: sudo bash $0"

[[ "$(uname -s)" == "Linux" ]] || die "Este instalador es solo para Linux."

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|aarch64) info "Arquitectura: ${ARCH}" ;;
  *) die "Arquitectura no soportada por Claude Code: ${ARCH} (se requiere x86_64 o aarch64)." ;;
esac

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  info "Sistema: ${PRETTY_NAME:-desconocido}"
  case "${ID:-}" in
    ubuntu|debian) : ;;
    *) info "AVISO: probado en Ubuntu/Debian. Continuando igual." ;;
  esac
else
  info "AVISO: no se pudo leer /etc/os-release."
fi

command -v systemctl >/dev/null 2>&1 || die "systemd no está disponible en esta VM."

# ── 2. Usuario del servicio ──────────────────────────────────────────────────
log "Usuario del servicio: ${AGENT_USER}"

if id "$AGENT_USER" >/dev/null 2>&1; then
  info "Ya existe. No se modifica (su HOME conserva la sesión de Claude)."
else
  # --create-home: la sesión de Claude vive acá y debe sobrevivir reboots.
  # Sin contraseña: se entra con `sudo -iu grows-agent`, nunca por SSH directo.
  useradd --create-home --home-dir "$AGENT_HOME" --shell /bin/bash "$AGENT_USER"
  info "Creado con HOME en ${AGENT_HOME}"
fi

[[ -d "$AGENT_HOME" ]] || die "No existe ${AGENT_HOME} tras crear el usuario."

# ── 3. Node.js ───────────────────────────────────────────────────────────────
log "Node.js"

node_major() { node --version 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/'; }

if command -v node >/dev/null 2>&1 && [[ "$(node_major)" -ge 18 ]]; then
  info "Ya instalado: $(node --version) (se requiere 18+)"
elif [[ "$SKIP_NODE" -eq 1 ]]; then
  die "Node 18+ no está y se pidió --skip-node."
else
  info "Instalando Node ${NODE_MAJOR}.x desde NodeSource…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg >/dev/null
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" \
    | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  chmod 0644 /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs >/dev/null
  command -v node >/dev/null 2>&1 || die "La instalación de Node falló."
  info "Instalado: $(node --version)"
fi

NODE_BIN="$(command -v node)"
info "Binario: ${NODE_BIN}"

# ── 4. Archivos del worker ───────────────────────────────────────────────────
log "Worker en ${APP_DIR}"

install -d -m 0755 -o root -g root "$APP_DIR"

# El script puede correr desde el repo clonado o suelto en la VM.
# Si encuentra los archivos al lado, los copia; si no, los baja de GitHub.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." 2>/dev/null && pwd || echo "")"

fetch_file() {
  local rel_repo="$1" dest="$2" url="$3"
  if [[ -n "$REPO_ROOT" && -f "${REPO_ROOT}/${rel_repo}" ]]; then
    install -m 0644 -o root -g root "${REPO_ROOT}/${rel_repo}" "$dest"
    info "Copiado desde el repo: ${rel_repo}"
  elif [[ -f "${SCRIPT_DIR}/$(basename "$dest")" ]]; then
    install -m 0644 -o root -g root "${SCRIPT_DIR}/$(basename "$dest")" "$dest"
    info "Copiado desde la carpeta local: $(basename "$dest")"
  else
    curl -fsSL "$url" -o "$dest" || die "No se pudo descargar ${url}"
    chmod 0644 "$dest"; chown root:root "$dest"
    info "Descargado: $(basename "$dest")"
  fi
  [[ -s "$dest" ]] || die "${dest} quedó vacío."
}

fetch_file "scripts/grows-bridge.mjs" \
           "${APP_DIR}/grows-bridge.mjs" \
           "${RAW_BASE}/scripts/grows-bridge.mjs"

fetch_file "deploy/cloud-agent-poc/cloud-agent-check.mjs" \
           "${APP_DIR}/cloud-agent-check.mjs" \
           "${RAW_BASE}/deploy/cloud-agent-poc/cloud-agent-check.mjs"

fetch_file "deploy/cloud-agent-poc/check.sh" \
           "${APP_DIR}/check.sh" \
           "${RAW_BASE}/deploy/cloud-agent-poc/check.sh"
chmod 0755 "${APP_DIR}/check.sh"

fetch_file "deploy/cloud-agent-poc/pair-from-link.sh" \
           "${APP_DIR}/pair-from-link.sh" \
           "${RAW_BASE}/deploy/cloud-agent-poc/pair-from-link.sh"
chmod 0755 "${APP_DIR}/pair-from-link.sh"

# Validación de sintaxis: mejor fallar acá que en el primer arranque.
"$NODE_BIN" --check "${APP_DIR}/grows-bridge.mjs" \
  || die "grows-bridge.mjs no es JavaScript válido."
info "Sintaxis del worker verificada."

# ── 5. Configuración (URL + token) ───────────────────────────────────────────
log "Configuración en ${CONF_DIR}"

# root escribe, grows-agent solo lee. El token nunca es world-readable.
install -d -m 0750 -o root -g "$AGENT_USER" "$CONF_DIR"

if [[ -f "$CONF_FILE" ]]; then
  info "Ya existe ${CONF_FILE}. No se sobrescribe (conserva tu token)."
else
  cat > "$CONF_FILE" <<'EOF'
# Completá estos dos valores y luego:  sudo systemctl start grows-agent
# El token se obtiene UNA vez desde Grows (ver README, PARTE 4).
GROWS_BRIDGE_URL=
GROWS_BRIDGE_TOKEN=
EOF
  info "Plantilla creada. Falta completarla."
fi
chown root:"$AGENT_USER" "$CONF_FILE"
chmod 0640 "$CONF_FILE"
info "Permisos: root:${AGENT_USER} 0640"

# ── 6. Claude Code ───────────────────────────────────────────────────────────
log "Claude Code"

claude_present() {
  sudo -u "$AGENT_USER" test -x "${AGENT_HOME}/.local/bin/claude" 2>/dev/null
}

if claude_present; then
  CLAUDE_VER="$(sudo -iu "$AGENT_USER" claude --version 2>/dev/null | head -n1 || echo 'desconocida')"
  info "Ya instalado para ${AGENT_USER}: ${CLAUDE_VER}"
elif [[ "$SKIP_CLAUDE" -eq 1 ]]; then
  info "Omitido por --skip-claude. Instalalo como ${AGENT_USER} (ver README, PARTE 3)."
else
  info "Instalando con el instalador oficial, como ${AGENT_USER} (no como root)…"
  # Comando oficial de https://code.claude.com/docs/en/setup
  # Se ejecuta como grows-agent para que quede en su HOME y su sesión persista.
  if sudo -iu "$AGENT_USER" bash -lc 'curl -fsSL https://claude.ai/install.sh | bash' >/tmp/claude-install.log 2>&1; then
    info "Instalado en ${AGENT_HOME}/.local/bin/claude"
  else
    info "AVISO: la instalación automática falló (log: /tmp/claude-install.log)."
    info "       Instalalo a mano — ver README, PARTE 3:"
    info "         sudo -iu ${AGENT_USER}"
    info "         curl -fsSL https://claude.ai/install.sh | bash"
  fi
fi

# ── 7. Servicio systemd ──────────────────────────────────────────────────────
log "Servicio systemd"

if [[ -n "$REPO_ROOT" && -f "${REPO_ROOT}/deploy/cloud-agent-poc/grows-agent.service" ]]; then
  install -m 0644 -o root -g root "${REPO_ROOT}/deploy/cloud-agent-poc/grows-agent.service" "$UNIT_PATH"
elif [[ -f "${SCRIPT_DIR}/grows-agent.service" ]]; then
  install -m 0644 -o root -g root "${SCRIPT_DIR}/grows-agent.service" "$UNIT_PATH"
else
  curl -fsSL "${RAW_BASE}/deploy/cloud-agent-poc/grows-agent.service" -o "$UNIT_PATH" \
    || die "No se pudo obtener el unit de systemd."
  chmod 0644 "$UNIT_PATH"
fi

# El unit asume /usr/bin/node. Si Node está en otro lado, lo ajustamos.
if [[ "$NODE_BIN" != "/usr/bin/node" ]]; then
  sed -i "s|ExecStart=/usr/bin/node |ExecStart=${NODE_BIN} |" "$UNIT_PATH"
  info "ExecStart ajustado a ${NODE_BIN}"
fi

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null 2>&1
info "Unit instalado y habilitado para el arranque."

# ── 8. Resumen ───────────────────────────────────────────────────────────────
CONF_READY=0
if [[ -s "$CONF_FILE" ]] \
  && grep -q '^GROWS_BRIDGE_URL=.\+' "$CONF_FILE" \
  && grep -q '^GROWS_BRIDGE_TOKEN=.\+' "$CONF_FILE"; then
  CONF_READY=1
fi

printf '\n\033[1m── Instalación terminada ──\033[0m\n\n'
printf '  Usuario     %s (HOME %s)\n' "$AGENT_USER" "$AGENT_HOME"
printf '  Worker      %s/grows-bridge.mjs\n' "$APP_DIR"
printf '  Config      %s\n' "$CONF_FILE"
printf '  Servicio    %s (habilitado, DETENIDO)\n\n' "$SERVICE_NAME"

if [[ "$CONF_READY" -eq 0 ]]; then
  printf '\033[33mFALTA 1/2 — cargar URL y token desde Grows:\033[0m\n'
  printf '    sudo bash %s/pair-from-link.sh    # pegás el link grows://pair… y listo\n' "$APP_DIR"
  printf '    # (o a mano:  sudo nano %s )\n\n' "$CONF_FILE"
fi

printf '\033[33mFALTA 2/2 — autenticar Claude (una sola vez):\033[0m\n'
printf '    sudo -iu %s\n' "$AGENT_USER"
printf '    claude\n'
printf '    # seguí el link que imprime, pegá el código, y salí con /exit\n\n'

printf 'Después verificá y arrancá:\n'
printf '    sudo bash %s/check.sh          # diagnóstico (no toca la cola de jobs)\n' "$APP_DIR"
printf '    sudo systemctl start %s\n' "$SERVICE_NAME"
printf '    journalctl -u %s -f\n\n' "$SERVICE_NAME"
