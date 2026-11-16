#!/usr/bin/env bash
# Levanta (o retoma) la instancia de pruebas completa: claves → contenedores → esquema → identidades.
# Idempotente: se puede correr todas las veces que haga falta. Con --reiniciar borra los datos de public.
set -euo pipefail
cd "$(dirname "$0")/../.."
node scripts/entorno-pruebas/claves.mjs
if ! docker info >/dev/null 2>&1; then
  echo "· iniciando el servicio de Docker"
  (dockerd >/tmp/dockerd-grows-pruebas.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
docker compose -f supabase/pruebas/docker-compose.yml --env-file supabase/pruebas/.env up -d --wait 2>&1 | grep -v "^$" | tail -6 || true
set -a; . supabase/pruebas/.env; set +a
for _ in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PRUEBAS_API_PORT}/auth/v1/health")" = "200" ] && \
  [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PRUEBAS_API_PORT}/storage/v1/status")" = "200" ] && break; sleep 2
done
bash scripts/entorno-pruebas/aplicar-esquema.sh "${1:-}"
# PostgREST recarga su caché de esquema de forma asíncrona: esperar a que responda antes de sembrar.
for _ in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" "http://127.0.0.1:${PRUEBAS_API_PORT}/rest/v1/obra_circuito?limit=1")" = "200" ] && break; sleep 2
done
node scripts/entorno-pruebas/sembrar.mjs
echo "Instancia de pruebas lista en http://127.0.0.1:${PRUEBAS_API_PORT} (base en 127.0.0.1:${PRUEBAS_DB_PORT})."
