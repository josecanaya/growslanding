# TECH_DEBT_REPORT

## Deuda cerrada en esta reforma
- Migración de `PATCH/DELETE /api/obras` a Supabase.
- Endurecimiento de permisos en rutas críticas de tareas.
- Validación de ownership en mutaciones wallet (`creditos`/`debitos`).
- Control opcional de secreto en webhook de pagos.

## Deuda abierta
- Rutas secundarias con headers legacy.
- Servicios legacy basados en Prisma (`tarea.service`, `tareas.service`).
- Alto volumen de `as any` en handlers/servicios.
- Mocks persistentes en frontend cliente y parte de socio.

## Riesgos
- Refactor agresivo de tipado puede introducir regresiones si se hace sin cobertura.
- Migración masiva de seguridad en todos los handlers requiere plan de rollout.

## Recomendación
- Ejecutar siguiente iteración enfocada en:
  1. Seguridad de rutas secundarias.
  2. Reducción de mocks cliente.
  3. Eliminación progresiva de Prisma legacy.
