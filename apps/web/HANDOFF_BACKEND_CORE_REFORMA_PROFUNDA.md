# HANDOFF_BACKEND_CORE_REFORMA_PROFUNDA

## Resumen
Se reforzó el núcleo `tarea -> bloque -> validación -> wallet` con foco en consistencia de estados y permisos sobre mutaciones críticas, manteniendo el flujo core sin rediseño.

## Cambios reales aplicados
- `api/tareas/[id]/transition` sigue usando estado final de bloque `validado` y tarea `validada` con constantes de dominio.
- `api/tareas/[id]/route` migrado a sesión real (sin headers legacy) para `GET/PATCH`.
- `api/tareas/[id]/asignar-cuadrilla` migrado a sesión real + `PermisoService` para validar rol cliente.
- `api/wallet/creditos` y `api/wallet/debitos` ahora validan ownership real del `owner_id` antes de crear movimientos.
- `api/payments/webhook` agrega validación opcional de secreto (`MP_WEBHOOK_SECRET`) para endurecer entrada.

## Archivos tocados
- `app/api/tareas/[id]/route.ts`
- `app/api/tareas/[id]/asignar-cuadrilla/route.ts`
- `app/api/wallet/creditos/route.ts`
- `app/api/wallet/debitos/route.ts`
- `app/api/payments/webhook/route.ts`

## Deuda detectada
- `WalletMvpService` mantiene `assertMovimientoNoDuplicado` para evitar duplicidad por subtarea, pero hay rutas legacy de wallet que podrían duplicar sin usar ese servicio.
- Persiste código legacy de tareas con Prisma (`lib/services/tarea.service.ts`) fuera del flujo principal actual.

## Riesgos
- `api/tareas/[id]/asignar-cuadrilla` conserva compatibilidad con `cuadrilla_id` legacy y puede depender de constraints viejas en BD.

## Tests realizados
- Revisión de linter en archivos modificados (sin errores nuevos).
- Validación estática de ruta crítica de transición/cierre por bloques.

## Próximo agente recomendado
`SUPABASE_DATA_SENIOR`
