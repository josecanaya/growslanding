# Índice — biblioteca visual frente socio (Grows)

## Qué contiene esta carpeta

- **Referencias exportadas desde Stitch** como `code.html` (HTML + Tailwind en CDN). **No hay archivos PNG** en el repositorio actual: la “imagen” de referencia es el HTML abierto en el navegador.
- **Una sola convención de layout:** **responsive compartido** (mobile-first con breakpoints `md:`). No existen pares `*_mobile` / `*_desktop` separados para la misma pantalla: un solo `code.html` por pantalla salvo **variantes** y **descartes** documentados.

## Cómo está organizada

| Carpeta | Contenido |
|---------|-----------|
| `_00_INDEX` | Documentación de arquitectura previa (`ARQUITECTURA_FINAL_SOCIO.md`) y punteros |
| `_01_panel` | Home socio + **listado de obras** (hub de entrada) |
| `_02_ahora` | Jornada (hub, activa, continuar, cierre de bloque) |
| `_03_tareas` | Lista por obra, etapa, trabajo asignado |
| `_04_evidencias` | Carga de foto / evidencia |
| `_05_validacion` | Estados de revisión del cliente (en validación, feedback) |
| `_06_presupuestos` | Oportunidades, flujo presupuesto completo |
| `_07_mensajes` | **Vacío de referencia** — faltante explícito (ver README) |
| `_08_billetera` | Billetera operativa |
| `_09_notificaciones` | Feed de notificaciones |
| `_10_cuenta` | Datos, historial obras, tripulación |
| `_11_navigation_shared` | Estados de error/bloqueo, micro-confirmaciones |
| `_90_variantes` | Material útil no canónico (p. ej. patrón slide to finish) |
| `_99_descartado` | Duplicados y outliers; **no usar** para implementación |

## Cómo leer “mobile / desktop”

1. Abrí el `code.html` en el navegador.
2. Usá herramientas de desarrollador (ancho responsive).
3. En el código: buscá `md:hidden` (barra inferior solo móvil), `md:grid-cols-*`, `max-w-md` (columna central tipo móvil), `md:px-24` / `max-w-7xl` (lectura ancha).

**Regla de producto:** la implementación es **una app responsive**; no dos capturas sueltas.

## Módulos existentes (canónicos en código)

- **Panel** → `_01_panel/panel_responsive_home`
- **Obras (lista)** → `_01_panel/obras_responsive_list`
- **Ahora** → `_02_ahora/…`
- **Tareas** → `_03_tareas/…`
- **Evidencias** → `_04_evidencias/…`
- **Validación (lado socio)** → `_05_validacion/…`
- **Presupuestos (incl. oportunidades)** → `_06_presupuestos/…`
- **Mensajes** → faltante (carpeta `_07_mensajes`)
- **Billetera** → `_08_billetera/…`
- **Notificaciones** → `_09_notificaciones/…`
- **Cuenta** → `_10_cuenta/…`
- **Navegación / estados compartidos** → `_11_navigation_shared/…`

## Qué carpetas son canónicas (prioridad 1 al implementar)

Toma como **verdad de pixel** el árbol bajo `_01_`–`_11_` excluyendo subcarpetas cuyo nombre empiece con `_` dentro de presupuestos (no hay) y excluyendo `_90_` y `_99_`.

## Dónde están los descartes

- **`_99_descartado`**: no implementar; conservados solo para auditoría o comparación. Ver `_99_descartado/README.md`.

## Variantes secundarias

- **`_90_variantes`**: p. ej. `ahora_variante_slide_to_finish_componente` — **no** es pantalla final; extraer el **gesto** como componente (`SlideToConfirm`) en la app.

## Faltantes detectados (resumen)

- Módulo **Mensajes** (inbox / hilo / vacío / permisos).
- Estados transversales **empty / loading / error** de lista global (más allá del catálogo de errores).
- **Loading** y **skeletons** de listas.
- **Offline** / reconexión.
- Exports fijos **PNG** opcionales (Stitch) si el equipo prefiere moodboard; no reemplazan al HTML.

## Archivos de documentación

| Archivo | Uso |
|---------|-----|
| `STITCH_SOCIO_INDEX.md` | Este índice |
| `ARQUITECTURA_VISUAL_SOCIO.md` | Módulos, flujos, criterio visual |
| `HANDOFF_FRONT_SOCIO.md` | Orden de build, qué tocar, faltantes para Stitch |
| `_00_INDEX/ARQUITECTURA_FINAL_SOCIO.md` | Análisis detallado previo (decisiones y tablas) |

## Convención de nombres (carpetas)

- `{área}_responsive_{descripción_corta}`: una carpeta = una pantalla o bloque, con `code.html` dentro.
- **No** se duplican nombres “mobile/desktop” en archivos: el responsive vive en un solo HTML.
