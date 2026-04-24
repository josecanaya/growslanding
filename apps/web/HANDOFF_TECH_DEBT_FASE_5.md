# HANDOFF_TECH_DEBT_FASE_5

## Resumen
Se aisló deuda técnica crítica en documentación para no romper core: se registró uso residual de Prisma, headers legacy y mocks productivos pendientes de saneamiento.

## Cambios
- Identificación de endpoints API con Prisma residual:
  - `app/api/obras/route.ts` (PATCH/DELETE)
  - `app/api/roadmap/objetivos/route.ts`
  - `app/api/roadmap/tareas/route.ts`
- Identificación de handlers con headers legacy `x-organizacion-id`/`x-usuario-id` pendientes.
- Desactivación de mock global socio por defecto (`USE_MOCK_DATA = false`).

## Archivos modificados
- `apps/web/lib/mocks/socioMockData.ts`
- Documentación de handoff de fase.

## Riesgos
- Persisten mocks en frontend cliente (`app/cliente/**`) que pueden seguir mezclando datos fake.
- Limpieza completa de Prisma no finalizada en todo el árbol `app/api`.

## Tests realizados
- Linter en archivo modificado sin errores.
- Revisión de coincidencias por búsqueda para Prisma/headers legacy/mocks.

## Pendientes
- Aislar o eliminar consumo Prisma de rutas roadmap y mutaciones de obras.
- Ejecutar saneamiento de mocks en cliente.
- Auditar `NEXT_PUBLIC_DEV_MODE` y otros flags en `lib/config.ts`.

## Próximo agente recomendado
`FRONTEND_SOCIO_STITCH_SENIOR`
