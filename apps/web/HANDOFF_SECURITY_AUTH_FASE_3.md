# HANDOFF_SECURITY_AUTH_FASE_3

## Resumen
Se endurecieron validaciones de permisos para evitar confianza en headers inseguros y se corrigieron resoluciones de pertenencia organización/usuario usando sesión real de Supabase.

## Cambios
- `POST/GET /api/tareas` ya no dependen de `x-organizacion-id` ni `x-usuario-id`; usan sesión autenticada.
- Verificación explícita de pertenencia `usuario -> organización` antes de mutar/leer tareas.
- `PermisoService` corrige lookup de socio (solo `user_id` real) y usa `organizations.user_id` canónico con fallback legacy.
- Endurecimiento de `middleware`: `NEXT_PUBLIC_DEV_MODE` no puede bypass auth en producción.
- Resolución de owner wallet alineada a `organizations.user_id` en saldo y movimientos.

## Archivos modificados
- `apps/web/app/api/tareas/route.ts`
- `apps/web/lib/services/permiso.service.ts`
- `apps/web/middleware.ts`
- `apps/web/app/api/wallet/saldo/route.ts`
- `apps/web/app/api/wallet/movimientos/route.ts`

## Riesgos
- Existen otros handlers que aún consumen `x-organizacion-id`/`x-usuario-id` y requieren migración gradual.
- Cambios de permisos pueden exponer integraciones frontend que dependían de headers legacy.

## Tests realizados
- Linter en archivos modificados sin errores.
- Revisión manual de paths críticos tocados (tareas/wallet/middleware/permisos).

## Pendientes
- Auditar y migrar handlers restantes con headers legacy (eventos, mensajes, notificaciones, socios, cuadrillas, etc.).
- Revisar `api/presupuestos/*` para patrón de sesión + pertenencia.
- Endurecer `api/payments/webhook` con validaciones de origen y recurso.

## Próximo agente recomendado
`BACKEND_CORE_SENIOR` (Fase 4 dominio/estados)
