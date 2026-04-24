# FRONT_SOCIO_IMPLEMENTATION_PLAN

## Fuente visual canónica
- `reforma/stitch_socio/STITCH_SOCIO_INDEX.md`
- `reforma/stitch_socio/ARQUITECTURA_VISUAL_SOCIO.md`
- `reforma/stitch_socio/HANDOFF_FRONT_SOCIO.md`

## Objetivo
Ordenar implementación socio por módulos sin tocar backend y sin mocks silenciosos.

## Mapeo de módulos (actual -> objetivo)
- `app/socio/panel` -> panel home Stitch (`_01_panel`).
- `app/socio/ahora` -> jornada hub/activa (`_02_ahora`).
- `app/socio/tareas` -> lista/detalle tareas (`_03_tareas`).
- `app/socio/evidencias` -> carga evidencia (`_04_evidencias`).
- `app/socio/presupuestos` + `oportunidades` -> flujo `_06_presupuestos`.
- `app/socio/billetera` -> `_08_billetera`.
- `app/socio/notificaciones` -> `_09_notificaciones`.
- `app/socio/cuenta` -> `_10_cuenta`.
- `app/socio/mensajes` -> pendiente por faltante visual/contrato.

## Plan incremental seguro
1. Eliminar acoples a mocks en pantallas de entrada socio.
2. Unificar componentes compartidos de layout/navigation según Stitch.
3. Mantener rutas actuales para no romper navegación.
4. Documentar bloqueos de API en `FRONT_BLOCKERS.md`.
