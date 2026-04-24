# SECURITY_REVIEW_GROWS

## Alcance auditado
- `api/tareas/route.ts`
- `api/tareas/[id]/route.ts`
- `api/tareas/[id]/asignar-cuadrilla/route.ts`
- `api/tareas-subtareas/[id]/validar/route.ts`
- `api/wallet/*` (saldo, movimientos, creditos, debitos)
- `api/obras/route.ts`
- `api/payments/webhook/route.ts`
- `lib/services/permiso.service.ts`
- `middleware.ts`

## Cambios de seguridad aplicados en esta fase
- Eliminado uso de `x-organizacion-id`/`x-usuario-id` en `api/tareas/[id]/route.ts` y `api/tareas/[id]/asignar-cuadrilla`.
- Validación por sesión real + pertenencia a organización en rutas de tarea actualizadas.
- `wallet/creditos` y `wallet/debitos` ahora validan ownership real de wallet antes de mutar.
- `payments/webhook` agrega validación opcional de secreto (`MP_WEBHOOK_SECRET`).
- Dev mode ya restringido para no desproteger producción (`middleware`).

## Hallazgos pendientes (no corregidos en este pase)
- `api/socios/invitar` y `api/socios/[id]/tareas` todavía dependen de headers legacy.
- Existen rutas de notificaciones/mensajes/cuadrillas con patrón header legacy.
- Falta un middleware/guard central para reducir duplicación de checks por handler.

## Riesgo residual
- **Medio** en endpoints secundarios con headers legacy.
- **Bajo** en flujo core principal tocado en esta reforma.
