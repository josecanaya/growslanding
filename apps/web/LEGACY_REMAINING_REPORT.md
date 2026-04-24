# LEGACY_REMAINING_REPORT

## Legacy identificado

### Servicios deprecated
- `lib/services/tarea.service.ts` (legacy Prisma, marcado deprecated)
- `lib/services/tareas.service.ts` (wrapper deprecated)

### Endpoints legacy/no-core con deuda
- `app/api/roadmap/objetivos/route.ts` (Prisma)
- `app/api/roadmap/tareas/route.ts` (Prisma)

### Patrones legacy de seguridad
- Uso de `x-organizacion-id` / `x-usuario-id` en rutas secundarias de socios/notificaciones/mensajes/cuadrillas.

## Decisión de reforma
- No eliminar archivos dudosos ni endpoints potencialmente consumidos.
- Aislar y documentar primero, migrar después por prioridad de riesgo.

## Prioridad sugerida
1. Legacy con impacto en mutaciones de negocio.
2. Legacy con dependencias activas del frontend.
3. Scripts/demo.
