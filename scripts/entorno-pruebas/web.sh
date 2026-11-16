#!/usr/bin/env bash
# Sirve apps/web contra la instancia de pruebas. Las variables se pasan por entorno de proceso
# (tienen prioridad sobre cualquier .env.local), así nunca se mezcla con credenciales de producción.
#   web.sh            → build de producción + next start (middleware de autenticación activo)
#   web.sh --dev      → next dev (más rápido para iterar; el middleware no exige sesión en desarrollo)
set -euo pipefail
cd "$(dirname "$0")/../../apps/web"
[ -f .env.pruebas.local ] || { echo "Falta .env.pruebas.local: corré scripts/entorno-pruebas/levantar.sh"; exit 1; }
set -a; . ./.env.pruebas.local; set +a
case "$NEXT_PUBLIC_SUPABASE_URL" in http://127.0.0.1:*|http://localhost:*) ;; *) echo "URL no local: abortado"; exit 1;; esac
PUERTO="${PRUEBAS_WEB_URL##*:}"
export NEXT_TELEMETRY_DISABLED=1
if [ "${1:-}" = "--dev" ]; then exec npx next dev -p "$PUERTO" -H 127.0.0.1; fi
[ "${1:-}" = "--sin-build" ] || { npx prisma generate && npx next build; }  # igual que "npm run build" del producto
exec npx next start -p "$PUERTO" -H 127.0.0.1
