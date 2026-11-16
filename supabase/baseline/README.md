# Línea base del esquema — RECONSTRUIDA

El repositorio no conserva el volcado original del esquema `public`
(`apps/web/supabase/migrations/20251014024325_remote_schema.sql` está vacío en todas las ramas, y
`supabase/migrations/` solo trae cuatro migraciones de septiembre de 2026 que suponen el resto ya creado).
Esta carpeta lo reconstruye con lo que se pudo verificar dentro del repositorio.

| Archivo | Origen | Qué aporta |
|---|---|---|
| `00_tablas_reconstruidas.sql` | generado por `scripts/entorno-pruebas/generar-baseline.mjs` desde `apps/web/lib/types/supabase.gen.ts` | 49 tablas, 10 enums, 93 claves foráneas, vista `organizaciones` |
| `01_funciones_historicas.sql` | `create function` / `create trigger` de migraciones de `origin/claude/obra-check-whatsapp-share-pxm23m` y `origin/fix/conocimiento-mcp-folder` | funciones de wallet, FSM y bloques |
| `02_historicas_posteriores/` | migraciones de `origin/fix/conocimiento-mcp-folder` posteriores a los tipos | columnas de proyecto vivo, tablas de auditoría, índices |
| `03_unicidad_historica.sql` | `unique` de las mismas migraciones históricas | 14 restricciones/índices únicos (p. ej. agenda `org_id, socio_id`) |

## Qué se verificó

- Las cuatro migraciones existentes de `supabase/migrations/` aplican sin errores sobre esta base.
- `supabase/tests/canvas_snapshot.sql` pasa.
- `apps/web/__tests__/sql/bridge-queue.sql` **no** pasa tal como está: su fixture inserta una obra sin organización y
  choca con la FK `obras_org_id_fkey` que declaran los tipos generados (pasaba cuando esa FK no estaba cargada).
- Los flujos existentes que usa la simulación (alta de obra, agenda de contratistas, publicación en el feed, login,
  creación directa de tareas, solicitud de presupuesto) funcionan autenticados contra esta base.

## Qué falta exactamente (no está en el repositorio)

1. Valores por defecto, `check`, índices no únicos, políticas RLS y triggers de las 49 tablas heredadas
   (los tipos generados no los incluyen; los defaults del generador son supuestos razonables).
2. Claves primarias: se asume `id` en todas las tablas.
3. Tablas `socio_perfil_extra`, `socio_colaboradores`, `socio_colaborador_asignaciones` (aparecen en migraciones
   históricas pero no en los tipos) y la columna `wallet_movimientos.subtarea_id`: sus funciones/índices quedan sin aplicar.
4. Cualquier cambio hecho en producción entre el 2026-08-19 y el 2026-09-09 que no esté en los tipos.

**Paso externo para reemplazar esta reconstrucción por la base real** (requiere acceso al proyecto Supabase):

```bash
supabase db dump --linked --schema public -f supabase/baseline/00_tablas_reconstruidas.sql
```

y borrar `01`, `02` y `03`. `scripts/entorno-pruebas/aplicar-esquema.sh` no necesita cambios.
