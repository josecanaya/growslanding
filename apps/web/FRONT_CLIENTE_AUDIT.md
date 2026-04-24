# FRONT_CLIENTE_AUDIT

## Estado actual
Frontend cliente funcional pero con alta mezcla de data real y demo en rutas clave.

## Hallazgos principales
- `app/cliente/dashboard/page.tsx`: múltiples bloques mock/demo.
- `app/cliente/page.tsx`: lista/estado de obras con datos hardcodeados.
- `app/cliente/tareas/**` y `app/cliente/obras/[obraId]/timeline`: casos demo activos.

## Rutas canónicas sugeridas
- Home cliente: `app/cliente/page.tsx`
- Dashboard operativo: `app/cliente/dashboard/page.tsx`
- Obras: `app/cliente/obras/page.tsx`
- Tareas por obra: `app/cliente/tareas/[obraId]/page.tsx`

## Riesgos
- Mocks invisibles pueden falsear validación de negocio en QA.
- Integración parcial con APIs unificadas puede generar inconsistencias.

## Acción recomendada inmediata
1. Encapsular mocks en flag de desarrollo explícito.
2. Priorizar reemplazo por API real en `dashboard` y `home`.
