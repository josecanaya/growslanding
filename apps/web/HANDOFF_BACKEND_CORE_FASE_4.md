# HANDOFF_BACKEND_CORE_FASE_4

## Resumen
Se consolidó dominio de estados para reducir inconsistencias futuras entre tarea y bloque, centralizando estados oficiales en un módulo único reutilizado por API y servicios.

## Cambios
- Nuevo módulo `lib/domain/estados-core.ts` con estados oficiales y finales de tarea/bloque.
- `TareaFsmService` y `SubtareaMvpService` consumen constantes de dominio centralizado.
- `api/tareas/[id]/transition` consume constantes compartidas para validación de cierre.

## Archivos modificados
- `apps/web/lib/domain/estados-core.ts`
- `apps/web/lib/services/tarea-fsm.service.ts`
- `apps/web/lib/services/subtarea-mvp.service.ts`
- `apps/web/app/api/tareas/[id]/transition/route.ts`

## Riesgos
- Otros módulos legacy todavía pueden usar strings hardcodeados de estado.
- Falta barrido global para normalizar todo el repo con estas constantes.

## Tests realizados
- Verificación de coherencia estática de estados en flujo core.
- Linter sin errores en archivos tocados.

## Pendientes
- Extender uso de `estados-core` a handlers y componentes que hoy comparan strings sueltos.
- Evaluar centralización adicional para estados de pagos/wallet si corresponde.

## Próximo agente recomendado
`TECH_DEBT_CLEANUP_SENIOR`
