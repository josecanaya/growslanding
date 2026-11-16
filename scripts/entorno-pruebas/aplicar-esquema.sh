#!/usr/bin/env bash
# Aplica a la instancia de pruebas: línea base reconstruida → funciones históricas (mejor esfuerzo)
# → migraciones del repositorio en orden. Con --reiniciar borra antes el esquema public.
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; . supabase/pruebas/.env; set +a
PGURL="postgres://postgres:${POSTGRES_PASSWORD}@127.0.0.1:${PRUEBAS_DB_PORT}/postgres"
case "$PGURL" in *@127.0.0.1:*|*@localhost:*) ;; *) echo "Solo se permite la base local de pruebas"; exit 1;; esac
run() { psql "$PGURL" -v ON_ERROR_STOP=1 -q "$@"; }

if [ "${1:-}" = "--reiniciar" ]; then
  run -c "drop schema public cascade; create schema public; grant usage on schema public to anon, authenticated, service_role; grant all on schema public to postgres;" 2>&1 | grep -v NOTICE || true
fi
if ! run -Atc "select to_regclass('public.obras')" | grep -q obras; then
  echo "· línea base reconstruida"
  run -1 -f supabase/baseline/00_tablas_reconstruidas.sql 2>&1 | grep -v NOTICE || true
  echo "· funciones históricas (mejor esfuerzo; los fallos se listan)"
  psql "$PGURL" -q -f supabase/baseline/01_funciones_historicas.sql 2>&1 | grep ERROR | sed 's/^.*ERROR/   no aplicada:/' || true
  echo "· migraciones históricas posteriores a los tipos (rama fix/conocimiento-mcp-folder)"
  for f in supabase/baseline/02_historicas_posteriores/*.sql; do
    psql "$PGURL" -q -f "$f" 2>&1 | grep ERROR | sed "s|^.*ERROR|   $(basename "$f") no aplicada:|" || true
  done
  run -c "create table if not exists public._migraciones_pruebas (nombre text primary key, aplicada_at timestamptz not null default now());"
fi
for f in supabase/migrations/*.sql; do
  n=$(basename "$f")
  if [ -z "$(run -Atc "select 1 from public._migraciones_pruebas where nombre='$n'")" ]; then
    echo "· migración $n"
    run -1 -f "$f" 2>&1 | grep -v NOTICE || true
    run -c "insert into public._migraciones_pruebas(nombre) values ('$n')"
  fi
done
# Privilegios como en un proyecto Supabase: el acceso real lo decide RLS.
run -c "grant all on all tables in schema public to service_role; grant all on all sequences in schema public to service_role; grant execute on all functions in schema public to service_role; notify pgrst, 'reload schema';"
echo "Esquema de pruebas aplicado."
