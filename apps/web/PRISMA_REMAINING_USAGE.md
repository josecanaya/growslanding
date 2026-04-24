# PRISMA_REMAINING_USAGE

## Estado
Prisma ya no participa del flujo principal de obras/tareas/bloques/wallet productivo crítico.

## Uso remanente identificado

### Endpoints API (legacy/no-core)
- `app/api/roadmap/objetivos/route.ts`
- `app/api/roadmap/tareas/route.ts`

### Servicios legacy
- `lib/services/tarea.service.ts` (deprecated)
- `lib/services/tareas.service.ts` (wrapper deprecated)
- `lib/services/obra.service.ts`
- `lib/services/suscripcion.service.ts`
- `lib/services/evento.service.ts`
- `lib/services/notificacion.service.ts`

### Scripts/seed/debug
- `scripts/*` relacionados a sanity, demo, debug y verificación.
- `prisma/seed*`

## Decisión
- **No migrar en bloque** en esta fase para evitar regresión funcional.
- Mantenerlos aislados/documentados hasta pase de cleanup dedicado.

## Prioridad de migración sugerida
1. Servicios legacy importados por runtime productivo.
2. Endpoints API expuestos al frontend real.
3. Scripts de soporte.
