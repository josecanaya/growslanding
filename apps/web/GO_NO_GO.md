# GO_NO_GO

## Estado actual
**READY WITH BLOCKERS**

## Motivo
- Se completaron correcciones técnicas de backend core/datos/permisos.
- Se corrigió un riesgo crítico detectado en QA estático: `api/obras` ahora exige sesión y scope por organizaciones permitidas en `GET/PATCH/DELETE`.
- Se ejecutó una corrida E2E manual parcial con evidencia en `QA_MANUAL_E2E_CORE.md`.
- No se detectaron fallas críticas en pruebas ejecutadas (auth obligatoria y protección ante headers falsos).
- El E2E funcional autenticado completo sigue bloqueado por falta de credenciales QA y dataset controlado.
- Persisten módulos frontend cliente con dependencia de mocks.

## Señales positivas
- Bug crítico `validada` vs `validado` corregido en transición de tarea.
- `GET /api/obras` migrado a Supabase.
- `PATCH/DELETE /api/obras` migrados a Supabase.
- `GET/PATCH/DELETE /api/obras` endurecidos con autenticación y aislamiento por organización.
- Hardening de permisos en `api/tareas` (sin headers inseguros).
- Hardening de permisos en `api/tareas/[id]` y `api/tareas/[id]/asignar-cuadrilla`.
- `wallet/creditos` y `wallet/debitos` validan ownership del actor.
- Centralización inicial de estados core en dominio.
- `tsc --noEmit` en `apps/web` en verde tras fix de tipado de ruta en oportunidades socio.

## Bloqueantes para pasar a GO productivo
1. Ejecutar checklist QA core completo (login, obra, tarea, bloque, evidencia, validación, pago, wallet).
2. Verificar no duplicación de pagos en entorno integrado con datos reales.
3. Resolver o aislar rutas cliente con mocks demo.
4. Completar auditoría de handlers aún dependientes de `x-organizacion-id`/`x-usuario-id`.
5. Validar webhook con `MP_WEBHOOK_SECRET` activo (casos aceptación/rechazo).

## Próximo paso recomendado
Desbloquear credenciales QA (cliente/socio) y dataset de prueba, re-ejecutar `QA_MANUAL_E2E_CORE.md` completo y, con evidencia de flujo autenticado extremo a extremo, reevaluar promoción a `GO`.
