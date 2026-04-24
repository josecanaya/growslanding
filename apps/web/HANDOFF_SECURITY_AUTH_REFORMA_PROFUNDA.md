# HANDOFF_SECURITY_AUTH_REFORMA_PROFUNDA

## Resumen
Se avanzó en endurecimiento real de permisos en handlers críticos del core, migrando validación de headers a sesión real y pertenencia a recurso.

## Cambios
- `api/tareas/[id]/route.ts`: GET/PATCH con sesión + organizaciones permitidas.
- `api/tareas/[id]/asignar-cuadrilla`: sesión + rol cliente en org real de la tarea.
- `api/wallet/creditos` y `api/wallet/debitos`: validación de owner contra usuario autenticado.
- `api/payments/webhook`: secreto opcional para origen confiable.

## Archivos modificados
- `app/api/tareas/[id]/route.ts`
- `app/api/tareas/[id]/asignar-cuadrilla/route.ts`
- `app/api/wallet/creditos/route.ts`
- `app/api/wallet/debitos/route.ts`
- `app/api/payments/webhook/route.ts`

## Pendientes
- Migrar `api/socios/invitar` y `api/socios/[id]/tareas` a sesión real.
- Barrer rutas de notificaciones/mensajes/cuadrillas que siguen con headers legacy.

## Riesgo residual
- Moderado en endpoints secundarios no migrados.

## Próximo agente recomendado
`TECH_DEBT_CLEANUP_SENIOR`
