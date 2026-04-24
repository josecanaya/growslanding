# HANDOFF_SUPABASE_DATA_FASE_2

## Resumen
Se avanzó en la unificación de fuente de verdad hacia Supabase en flujo principal de obras y planes, eliminando Prisma del `GET /api/obras` y estandarizando `organizations` como tabla canónica con fallback legacy documentado.

## Cambios
- Migración de `GET /api/obras` de Prisma a Supabase.
- Cálculo de cantidad de tareas por obra en respuesta de `GET /api/obras`.
- `plan.service` ahora usa `organizations` como canónica y fallback `organizaciones` temporal.

## Archivos modificados
- `apps/web/app/api/obras/route.ts`
- `apps/web/lib/services/plan.service.ts`

## Riesgos
- `PATCH/DELETE /api/obras` siguen con Prisma (legacy pendiente).
- El conteo de tareas por obra en `GET /api/obras` se calcula en segunda consulta (impacto en performance a monitorear).

## Tests realizados
- Validación de compilación/linter en archivos tocados.
- Revisión de contrato de respuesta para mantener compatibilidad (`organization`, `_count.tareas`).

## Pendientes
- Migrar `PATCH/DELETE /api/obras` a Supabase.
- Auditar endpoints `roadmap/*` que todavía usan Prisma.
- Regenerar `supabase.gen.ts` en una tarea dedicada de sync de esquema.

## Próximo agente recomendado
`SECURITY_AUTH_SENIOR`
