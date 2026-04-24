# Arquitectura visual — frente socio (Grows)

## Módulos finales

| Módulo | Carpeta | Rol |
|--------|---------|-----|
| Panel (home) | `_01_panel/panel_responsive_home` | Entrada, trabajo actual, atajos |
| Obras | `_01_panel/obras_responsive_list` | Hub de obras (lista responsive) |
| Ahora | `_02_ahora/*` | Ejecución: hub sin sesión, jornada activa, reanudar, cierre |
| Tareas | `_03_tareas/*` | Lista, etapa, asignación |
| Evidencias | `_04_evidencias/*` | Carga de evidencia |
| Validación | `_05_validacion/*` | Socio: seguimiento de revisión del cliente (no confundir con UI “validar” del cliente) |
| Presupuestos | `_06_presupuestos/*` + `oportunidades_responsive_lista` | Oportunidades, crear, editar, detalle, estados, envío |
| Mensajes | `_07_mensajes` | **Solo faltante documentado** — sin `code.html` |
| Billetera | `_08_billetera/*` | Saldo y movimientos |
| Notificaciones | `_09_notificaciones/*` | Feed |
| Cuenta | `_10_cuenta/*` | Perfil, historial, tripulación |
| Navegación / compartido | `_11_navigation_shared/*` | Errores, bloqueos, micro-confirmación |

## Pantallas principales por módulo (referencia = carpeta hija)

### `_01_panel`
- **Canónica home:** `panel_responsive_home/code.html`
- **Canónica obras:** `obras_responsive_list/code.html`

### `_02_ahora`
- **Canónica hub (cronómetro / acciones):** `ahora_responsive_jornada_hub`
- **Canónica jornada en vivo (LIVE, checklist):** `ahora_responsive_jornada_activa` — **única** pantalla de “activa”
- **Secundaria útil:** `ahora_responsive_continuar_trabajo` (entrada hero)
- **Flujo cierre:** `cierre_bloque_responsive_resumen`

### `_03_tareas`
- `tareas_responsive_lista_obra`, `tareas_responsive_detalle_etapa`, `tareas_responsive_trabajo_asignado`

### `_04_evidencias`
- `evidencias_responsive_carga_foto`

### `_05_validacion`
- `validacion_responsive_en_validacion`, `validacion_responsive_feedback_aprobado`, `validacion_responsive_feedback_revision`

### `_06_presupuestos`
- **Oportunidades (canónica):** `oportunidades_responsive_lista`
- **Flujo:** `presupuestos_responsive_detalle_pedido` → `presupuestos_responsive_wizard_nav` / `presupuestos_responsive_nuevo` → `presupuestos_responsive_resumen_previo` → `presupuestos_responsive_enviado_preview`
- **Listado / estado / detalle:** `presupuestos_responsive_mis_lista`, `presupuestos_responsive_estado`, `presupuestos_responsive_budget_detail`, `presupuestos_responsive_editar_paquete`

### `_08_billetera` / `_09_notificaciones` / `_10_cuenta`
- Un `code.html` canónico por módulo en cada carpeta (ver nombres `*_main`, `*_feed`, `cuenta_responsive_*`).

### `_11_navigation_shared`
- `shared_responsive_catalogo_error_bloqueo` — sistema de plantillas de error
- `shared_responsive_confirmacion_paso_micro` — micro-pantalla de paso

## Relación entre módulos (flujo visual)

1. **Panel** → **Obras** o **Ahora** / **Presupuestos** según contexto.
2. **Obras** → **Tareas** → **Evidencias** → **Validación** (estados de feedback del cliente hacia el socio).
3. **Ahora** conecta con **Cierre** y, indirectamente, con **Validación** al liberar bloque.
4. **Billetera** se entiende **después** de flujos de pago/validación (solo presentación; sin lógica en Stitch).

## Navegación (inferida del material)

- **Barra inferior** en muchos `code.html` (`md:hidden`) = nav principal móvil.
- **Top bar** con menú, logo, avatar o notificaciones = shell común.
- **Desktop:** misma estructura; bottom nav oculta; más columnas y márgenes.

## Criterio mobile / desktop

- **Base:** `responsive` en un solo HTML por pantalla.
- **“Principal” del diseño:** **mobile-first** (anchos `max-w-md`, CTA fijos al pie). Desktop amplía grillas; **no** hay segunda captura obligatoria.

## Qué se conserva (para implementar)

- Todo bajo `_01_` a `_11_` excepto lo señalado como variante o descartado.
- Nombre de marca en UI: unificar a **Grows** en implementación (varios mockups dicen otras marcas de prototipo).

## Qué se fusiona

- Tres jornadas “activa” antiguas → **una** referencia: `ahora_responsive_jornada_activa` + lógica de **slide** extraída de `_90_variantes/ahora_variante_slide_to_finish_componente`.
- Cierres, estados de presupuesto, oportunidades, historiales duplicados → ver `_99_descartado`.

## Qué se elimina del uso (no borrado de disco)

- Contenido en `_99_descartado` — no usar para UI final.
- Cualquier subcarpeta cuyo nombre empiece con `_dup_`, `_outlier_` o `_absorbido_` en `_99_descartado`.

## Variante útil (no canónica de pantalla)

- `_90_variantes/ahora_variante_slide_to_finish_componente` — conservar el **comportamiento** (slide) como componente, no como ruta aislada.
