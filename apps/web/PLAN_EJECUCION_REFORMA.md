# PLAN_EJECUCION_REFORMA

## Objetivo general
Estabilizar y completar la reforma integral de Grows sin romper el flujo core:

`obra -> tarea -> bloque -> evidencia -> validación -> pago -> wallet`

## Fuente canónica
- `apps/web/SUBAGENTES_GROWS.md`

## Alcance y reglas
- No tocar `apps/landing`.
- No mezclar backend y frontend en una misma fase.
- No agregar features nuevas.
- No rehacer el sistema desde cero.
- Supabase como fuente de verdad.
- Stitch como referencia visual (no lógica de negocio).
- Si hay bloqueo, documentar y continuar con lo seguro.

## Fases y orden estricto
1. **Fase 0 - PM_ORQUESTADOR_SENIOR (planificación)**
   - Crear documentación base y matriz.
2. **Fase 1 - BACKEND_CORE_SENIOR**
   - Corregir P0 de estados/cierre/wallet/evidencia.
3. **Fase 2 - SUPABASE_DATA_SENIOR**
   - Eliminar doble fuente de verdad y aislar Prisma.
4. **Fase 3 - SECURITY_AUTH_SENIOR**
   - Endurecer permisos y validación de pertenencia real.
5. **Fase 4 - BACKEND_CORE_SENIOR**
   - Consolidar dominio y unificar estados.
6. **Fase 5 - TECH_DEBT_CLEANUP_SENIOR**
   - Aislar legacy y documentar deuda técnica.
7. **Fase 6 - FRONTEND_SOCIO_STITCH_SENIOR**
   - Alinear socio a Stitch sin tocar backend.
8. **Fase 7 - FRONTEND_CLIENTE_APP_SENIOR**
   - Estabilizar cliente y separar real/mock.
9. **Fase 8 - QA_CORE_SENIOR**
   - Validación integral final y GO/NO-GO.

## Definición de terminado por fase
- Cada fase debe cerrar con `HANDOFF_[AGENTE]_[FASE].md`.
- Debe incluir: resumen, cambios, archivos, riesgos, tests, pendientes y próximo agente.
- QA interviene al cierre de cada fase y bloquea avance si rompe core.

## Criterio global de éxito
- Core estable.
- Supabase fuente principal.
- Prisma fuera del flujo principal o declarado legacy.
- Permisos críticos endurecidos.
- Estados de dominio coherentes.
- Mocks productivos controlados.
- Front socio alineado a Stitch.
- Handoffs completos y trazables.
