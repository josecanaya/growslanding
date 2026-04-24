# Handoff — agente de frontend (frente socio Grows)

## Qué construir primero (orden sugerido)

1. **Shell de app** (TopBar, contenedor, tokens alineados a `#163274` / superficies del mock).
2. **`_01_panel`** — `panel_responsive_home` + `obras_responsive_list` (navegación y contexto de obra quedan claros).
3. **`_02_ahora`** — `ahora_responsive_jornada_hub` y `ahora_responsive_jornada_activa` (núcleo operativo).
4. **`_03_tareas`**, **`_04_evidencias`**, **`_05_validacion`** (cadena de trabajo en obra).
5. **`_06_presupuestos`** (pantallas numerosas; respetar flujo: oportunidad → detalle → crear/editar → resumen → enviado).
6. **`_08_billetera`**, **`_09_notificaciones`**, **`_10_cuenta`**.
7. **Mensajes** — solo cuando exista contrato de API: usar `_07_mensajes/README_FALTANTE.md` y placeholders.

## Carpetas de referencia principal (prioridad)

| Prioridad | Ruta | Notas |
|-----------|------|--------|
| P0 | `_01_panel/panel_responsive_home` | Home canónica |
| P0 | `_01_panel/obras_responsive_list` | Lista obras |
| P0 | `_02_ahora/ahora_responsive_jornada_activa` | Jornada en vivo (única canónica) |
| P1 | `_06_presupuestos/*` | Mayor volumen de pantallas; misma guía de estilo en todos |
| P1 | `_11_navigation_shared/shared_responsive_catalogo_error_bloqueo` | Errores y bloqueos |
| P2 | `_90_variantes/ahora_variante_slide_to_finish_componente` | Patrón de interacción, no pantalla |

**No** uses como base de layout nada bajo `_99_descartado/`.

## Módulos prioritarios de negocio

1. Ahora (ejecución) + Tareas + Evidencias + Validación (cadena de campo).
2. Presupuestos + Oportunidades (ingreso comercial).
3. Billetera + Cuenta (confianza y perfil).
4. Notificaciones (entrada a profundas).

## Qué no debe tocar el frontend aquí

- **Backend** (APIs, Supabase, FSM, pagos reales).
- **Landing** pública.
- Lógica de **validación de bloques del cliente** replicada como si el socio fuera el cliente: el socio solo ve **estados** (material en `_05_validacion`).

## Qué depende de backend o contrato aún inexistente

- **Mensajes** (hilos, realtime, no leídos, permisos por obra).
- **Notificaciones** (payload, deep links, mark read).
- **Billetera** (montos, estados, extractos) — el HTML es fachada.
- **Evidencias** (upload, almacenamiento, límites de archivo).
- **Presupuestos** (estados oficiales, PDF, aprobación).

## Faltantes para pedir a Stitch (o Figma)

### Pantallas
- Inbox y **hilo** de **mensajes** (móvil + ancho de escritorio simulado en mismo layout responsive).
- **Empty state** coherente por módulo: obras, tareas, presupuestos, billetera, notificaciones, mensajes, evidencias, oportunidades.
- **Loading** (skeleton o spinners) en listas y detalle.
- **Transición** explícita `jornada_hub` → `jornada_activa` (misma app shell).
- (Opcional) **PNG export** del flujo P0 con naming consistente si el diseño fija moodboard; el repo actual **solo** tiene HTML.

### Estados
- `empty`, `loading`, `error` de red, `sin permisos`, `fuera de cobertura` (o banner único reutilizable).
- Variantes **desktop** en el **mismo** diseño: no otra app; solo ancho 1280+ en mock.

### Flujos incompletos
- **Mensajes** y su relación con notificación (CTA al hilo).
- Cierre de bloque → comprobación de qué pasa con **notificación** al cliente (solo ref copy).

### No pedir
- Nuevas features de producto no alineadas al MVP actual.
- Duplicar la misma pantalla solo por “tema” distinto (Azul/Partner, etc.); unificar a **Grows**.

## Dónde está el análisis largo

- `_00_INDEX/ARQUITECTURA_FINAL_SOCIO.md` — decisiones, tablas, duplicados viejos mapeados a esta biblioteca.

## Regla de oro

Si una carpeta no está en `STITCH_SOCIO_INDEX.md` como canónica o variante, **no la implementes** sin revisión de producto.
