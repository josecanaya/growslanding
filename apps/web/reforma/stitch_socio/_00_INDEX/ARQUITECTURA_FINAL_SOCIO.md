# Arquitectura final socio

> **Actualización (biblioteca física):** las carpetas del material se reordenaron en `stitch_socio/_01_*` … `_11_*`, con descartes en `_99_descartado`. Los nombres antiguos de carpetas que aparecen abajo son el **contexto del análisis**; la **fuente de verdad de rutas** es `STITCH_SOCIO_INDEX.md` en la raíz de `stitch_socio/`.

## 1. Resumen ejecutivo

- **Qué había:** 38 prototipos exportados de Stitch (uno por carpeta, siempre `code.html`), todos mobile-first con Tailwind. Cubren home, obras, jornada en curso, tareas, evidencias, presupuestos, oportunidades, billetera, notificaciones, cuenta, estados de error/feedback y varios “pasos” de cierre. Hay **más de un nombre de producto** en UI (“SocioOperativa”, “AZUL OPERATIVO”, “GROWS”, “PARTNER”, “CONSTRUCCIÓN”, “SOCIOS”), y **más de una variante** del mismo flujo (jornada activa, cierre de bloque, detalle de pedido, estados de presupuesto, historiales).

- **Qué problema tenía:** el material es **diseño referencial**, no una app: rutas, datos y nombres no están unificados; hay **solapamiento fuerte** en ejecución en campo (3 pantallas de “jornada activa” muy parecidas) y en comercial (dos listados de oportunidades, dos `estado_de_presupuesto_*`); el módulo **Mensajes** no aparece como pantalla; la validación de bloques en Grows (lado **cliente**) aquí se refleja como **estado del socio** (en revisión / aprobado / revisión necesaria), lo cual debe alinearse con el FSM real sin duplicar el rol de validación del cliente.

- **Qué decisión se tomó:** una **arquitectura de frontend única, responsive y ejecutable** alineada al panel cliente (dashboard por secciones o rutas equivalentes en `/socio/...`), con **una versión canónica por capacidad** (referencia de pixel en carpeta listada en §3 y §7), **sin duplicar pantallas** para mobile/desktop (un solo layout con bottom nav en `md:hidden` y columnas en `md:grid` donde el HTML ya lo demuestra), y **Obras** como módulo explícito (el material lo trata mucho y encaja con el dominio Grows) además de los módulos que pediste.

---

## 2. Inventario del material

### 2.1 Listado resumido (carpeta → rol)

| Carpeta | Rol aproximado |
|---------|----------------|
| `home_socio_ultra_simplificada_6` | Panel / home: trabajo actual, atajos |
| `mis_obras` | Lista de obras (hub) |
| `jornada_ahora` | Módulo “Ahora”: cronómetro, obra, acciones (pausar / evitar incumplimientos) |
| `jornada_activa_controles_refinados_1` | Jornada en vivo: checklist, progreso, LIVE |
| `jornada_activa_ux_optimizada` | Variante de jornada activa (misma familia) |
| `jornada_activa_slide_to_finish` | Jornada activa + **slide to finish** |
| `continuar_trabajo_acci_n_nica` | Reanudar trabajo (hero + CTA) |
| `tareas_de_la_obra_minimal` | Lista de tareas de una obra |
| `detalle_etapa_preparaci_n` | Detalle de etapa / fase (preparación) |
| `trabajo_asignado` | Detalle de asignación / alcance |
| `carga_de_evidencia_foto` | Carga de evidencia |
| `estado_en_validaci_n_simple` | Socio: bloque “en validación” |
| `feedback_aprobado` | Post-validación positiva |
| `feedback_revisi_n_necesaria` | Post-validación con corrección |
| `cierre_de_bloque_simplificado` | Resumen al cerrar bloque / jornada |
| `cierre_de_bloque_resumen_r_pido` | Variante cierre de bloque (rápida) |
| `confirmaci_n_de_paso_refinada` | Micro-pantalla de confirmación de paso |
| `presupuestar_ultra_simple` | Flujo presupuestar (con bottom nav) |
| `nuevo_presupuesto_r_pido` | Crear presupuesto |
| `editar_paquete_de_presupuesto` | Editar ítems / paquetes |
| `resumen antes de presupuestar` | Resumen pre-envío |
| `detalle_de_pedido_simplificado` | Detalle de pedido (estética B/N atípica) |
| `detalle_de_pedido_ultra_simple` | Detalle de pedido (paleta Grows #163274) |
| `mis_presupuestos` | Listado de presupuestos |
| `estado_de_presupuesto_simplificado` | Estado de un presupuesto (detalle) |
| `estado_de_presupuesto_simple` | Duplicado funcional de estado de presupuesto |
| `budget_detail_layer_2` | Detalle de presupuesto (capa 2) |
| `presupuesto_enviado_con_preview` | Enviado + preview |
| `oportunidades_operativas_lista_r_pida` | Oportunidades (lista) |
| `oportunidades_premium_operative` | Oportunidades (variante “premium”) |
| `billetera_operativa` | Billetera socio |
| `notificaciones_operativo` | Feed de notificaciones |
| `mis_datos` | Cuenta / datos personales |
| `detalle_de_integrante_layer_2` | Documentación de tripulación / integrante |
| `historial_de_obras` | Historial obras finalizadas (bento) |
| `historial_de_trabajos` | Historial tipo portafolio / editorial |
| `estados_de_error_y_bloqueo` | Catálogo de error/bloqueo |
| `error_bloqueo_directo` | Un caso concreto de error/bloqueo |
| `presupuestar_ultra_simple` | (repetido arriba) flujo con nav inferior |

*Nota: una carpeta tiene espacio en el nombre: `resumen antes de presupuestar` — en código conviene renombrar a `resumen_antes_de_presupuestar`.*

### 2.2 Mobile / desktop / compartido

- **Con enfoque mobile explícito:** bottom nav con `md:hidden` en, entre otras, `estado_en_validaci_n_simple`, `cierre_de_bloque_simplificado`, `presupuestar_ultra_simple` — patrón coherente con **un solo layout** que en desktop oculta la barra inferior y gana aire con grillas `md:grid-cols-*` (visto en `mis_obras`, `jornada_ahora`, `mis_datos`, `historial_de_obras`, `historial_de_trabajos`).

- **Desktop-friendly / ancho lectura:** `mis_obras`, `historial_de_obras`, `historial_de_trabajos`, `mis_datos` (secciones `md:px-24`, `max-w-7xl`).

- **No hay** dos codebases: todo es **el mismo enfoque responsive**; no se define una segunda app “desktop only”.

---

## 3. Duplicados y unificación

### 3.1 Módulo “Jornada activa” (mayor solapamiento)

- **Se repite:** `jornada_activa_controles_refinados_1`, `jornada_activa_ux_optimizada`, `jornada_activa_slide_to_finish` — misma estructura (header AZUL/tema oscuro, título tarea, cronómetro o progreso, checklist / acciones).

- **Versión canónica (implementación):** **`jornada_activa_controles_refinados_1`** como **única pantalla** de “Ahora / en ejecución con sesión viva”.

- **Qué se fusiona:** el gesto **slide to confirmar cierre** de `jornada_activa_slide_to_finish` pasa a ser **un componente** (p. ej. `SlideToConfirm`) usado al **finalizar jornada o cerrar bloque**, no una tercera ruta a mantener.

- **Qué se elimina como referencia de pantalla completa:** `jornada_activa_ux_optimizada`, `jornada_activa_slide_to_finish` (conservar solo el JS/patrón de slide en shared).

### 3.2 Cierre de bloque

- **Se repite:** `cierre_de_bloque_simplificado` y `cierre_de_bloque_resumen_r_pido`.

- **Canónica:** **`cierre_de_bloque_simplificado`** (título y flujo de “resumen de finalización” + nav coherente con otros flujos).

- **Eliminar como duplicado:** `cierre_de_bloque_resumen_r_pido` (sustituir con estados/variantes de la misma vista si hace falta un modo “ultra breve”).

### 3.3 Detalle de pedido (antes de presupuestar)

- **Se repite:** `detalle_de_pedido_simplificado` vs `detalle_de_pedido_ultra_simple`.

- **Canónica:** **`detalle_de_pedido_ultra_simple`** — alinea a tokens Grows (`#163274`, superficies) y a la barra fija PRESUPUESTAR; la “simplificado” B/N es outlier de marca.

- **Eliminar referencia a:** `detalle_de_pedido_simplificado`.

### 3.4 Estado de presupuesto

- **Se repite:** `estado_de_presupuesto_simplificado` y `estado_de_presupuesto_simple` (mismo título en `<title>`).

- **Canónica:** **`estado_de_presupuesto_simplificado`**.

- **Eliminar referencia a:** `estado_de_presupuesto_simple`.

### 3.5 Oportunidades

- **Se repite:** `oportunidades_operativas_lista_r_pida` vs `oportunidades_premium_operative`.

- **Canónica:** **`oportunidades_operativas_lista_r_pida`**.

- **Eliminar o fusionar en tema/densidad:** `oportunidades_premium_operative` (si se desea un “modo denso” en el futuro, debe ser el mismo contenedor; no otra ruta en v1).

### 3.6 Historial

- **Se repite:** `historial_de_trabajos` (portfolio editorial) vs `historial_de_obras` (bento, “proyectos finalizados”).

- **Canónica:** **`historial_de_obras`** (mejor mapeo a “obras” en Grows y métricas de cierre).

- **Fusionar o eliminar:** tratar `historial_de_trabajos` como **exploración visual alternativa**; no implementar dos historiales. Si hace falta un segundo layout, **única ruta** `cuenta/historial` con toggle vista (lista/galería), patrón tomado de `historial_de_obras`.

### 3.7 Error / bloqueo

- **Se repite:** `estados_de_error_y_bloqueo` (más amplio) y `error_bloqueo_directo` (un caso).

- **Canónica:** **`estados_de_error_y_bloqueo`** como **sistema** de estados; `error_bloqueo_directo` se absorbe como **una variante** (plantilla) dentro del mismo módulo de UI.

---

## 4. Módulos finales

Módulos del producto (usuario **socio** en Grows), con objetivo claro:

| Módulo | Objetivo |
|--------|----------|
| **Panel** | Resumen: trabajo actual, alertas, accesos a Ahora, obras, dinero. Referencia: `home_socio_ultra_simplificada_6`. |
| **Obras** | Lista y acceso a contexto de obra; referencia: `mis_obras`. *Requerido por el material y por el dominio; no es feature nueva, es módulo explícito.* |
| **Ahora** | Foco de ejecución: sin sesión + con sesión; cronómetro, CTAs, incumplimientos. Referencia: `jornada_ahora` + canónica activa + `continuar_trabajo_acci_n_nica` donde aplique. |
| **Tareas** | Backlog y detalle por obra/bloque; referencia: `tareas_de_la_obra_minimal`, `trabajo_asignado`, `detalle_etapa_preparaci_n`. |
| **Evidencias** | Subida y estado de carga. Referencia: `carga_de_evidencia_foto`. |
| **Validación** (lado socio) | Seguimiento de revisión del **cliente** sobre bloques (no re-implementar la UI de validar del cliente). Referencia: `estado_en_validaci_n_simple`, `feedback_aprobado`, `feedback_revisi_n_necesaria`. |
| **Presupuestos** | Listado, detalle, creación, edición, envío, preview. Referencia: `mis_presupuestos`, `nuevo_presupuesto_r_pido`, `editar_paquete_de_presupuesto`, `resumen antes de presupuestar`, `estado_de_presupuesto_simplificado`, `budget_detail_layer_2`, `presupuesto_enviado_con_preview`, `presupuestar_ultra_simple`. |
| **Oportunidades** | Ingreso comercial a pedidos/solicitudes. Sub-módulo de **Presupuestos** o ruta bajo el mismo flujo. Referencia: `oportunidades_operativas_lista_r_pida`. |
| **Mensajes** | Hilo / inbox por contexto (obra o sistema). *No hay Stitch en la carpeta; se define contrato y shell vacío.* |
| **Billetera** | Saldo, movimientos, claridad operativa. Referencia: `billetera_operativa`. |
| **Notificaciones** | Feed y deep-links. Referencia: `notificaciones_operativo`. |
| **Cuenta** | Perfil, datos, preferencias, historial, equipo si aplica. Referencia: `mis_datos`, `historial_de_obras` (vista archivada), `detalle_de_integrante_layer_2` (equipo/crew). |

---

## 5. Arquitectura final

### 5.1 Navegación principal

- **Bottom nav (móvil)** y **equivalente en sidebar o rail (desktop)**, mismas 5/6 entradas para no duplicar mental model:

  1. **Panel** (home)
  2. **Ahora** (o “En curso”)
  3. **Obras** (o **Trabajos** si se prefiere copy único; datos = obras)
  4. **Presupuestos** (incluye acceso a **Oportunidades**)
  5. **Billetera**

- **Accesos secundarios** (no obligatorios en barra principal): **Tareas** (muy asociado a Obra; puede ser tab dentro de obra), **Notificaciones** (icono header), **Cuenta** (avatar / menú).

*Justificación: el material pone billetera y presupuestos en el mismo hábito de “dinero y ofertas”; “tareas” aparece en contexto de obra más que como tab global en todos los mockups.*

### 5.2 Jerarquía de pantallas

```
Panel
  → Obra (detalle) → Tareas (lista) → Tarea / Etapa
                        → Evidencias (carga) → [estado en validación]
  → Ahora
      → (sin jornada) jornada_ahora
      → (con jornada) ahora/activa [canónica]
      → Cierre de bloque → feedback cliente (validación)
  → Presupuestos
      → Oportunidades
      → Detalle pedido
      → Flujo: nuevo / editar / resumen / enviado
  → Billetera
Cuenta (menú)
  → Mis datos
  → Historial obras
  → Tripulación / integrantes (si el producto lo habilita)
Notificaciones (global)
Mensajes (sub-vista: desde notificación o CTA; no duplicar con landing)
```

### 5.3 Relación entre módulos (flujo socio)

1. **Entra** por Panel u **Oportunidad** (Presupuestos).
2. **Presupuestos** o **Aceptación** alimenta **Obra / Tarea** (backend); el socio ve **Ahora** cuando hay trabajo asignado en curso.
3. **Ahora** genera **Evidencias**; el cliente **valida** (fuera de este módulo); el socio ve resultado en **Validación (feedback)**.
4. **Billetera** refleja pagos/ liberaciones ligadas a validación y reglas de negocio (solo datos; sin lógica duplicada en front).

### 5.4 Unificación mobile / desktop (decisión)

- **Una sola app responsive.** Los HTML ya usan `md:` y `md:hidden` para barra inferior; **no** se mantienen dos árboles de rutas (`/m/` vs `/d/`).
- **Layouts:** un **AppShell** con `TopBar` + contenido; en `< md` añadir `BottomNav`; en `≥ md` opcional **Sidebar** o solo topbar con más ancho (como `mis_datos` / `mis_obras`).

---

## 6. Estructura de carpetas (árbol propuesto)

Raíz bajo la app web existente, p. ej. `apps/web/app/socio` o `apps/web/src/app/(socio)/socio` — **solo estructura lógica**:

```text
/socio
  /panel                 # home resumen
  /obras
    [id]/
      page.tsx           # contexto obra
      /tareas
      /evidencias
  /ahora
    /activa              # jornada en vivo (canónica + slide confirm en shared)
  /tareas                 # lista cross-obra si se expone; si no, re-export desde obra
  /evidencias
  /validacion            # estados de revisión (socio)
  /presupuestos
    /oportunidades
    /[id]
    /nuevo
    /editar
  /billetera
  /notificaciones
  /mensajes
  /cuenta
    /datos
    /historial
  /components             # o ../components/socio si preferís colocal rules del repo
  /shared
    /states              # error, empty, loading (patrón estados_de_error_y_bloqueo)
  /navigation
    AppShell.tsx
    BottomNav.tsx
    SocioTopBar.tsx
```

*Ajuste fino de rutas a convención del monorepo (App Router, grupos, etc.); el árbol es el contrato funcional.*

---

## 7. Qué se elimina (del plan de producto, no borrar discos a ciegas)

| Referencia material | Justificación |
|---------------------|---------------|
| `jornada_activa_ux_optimizada` | Redundante con canónica de activa. |
| `jornada_activa_slide_to_finish` | Misma pantalla; conservar solo interacción. |
| `cierre_de_bloque_resumen_r_pido` | Duplicado de cierre; unificar. |
| `detalle_de_pedido_simplificado` | Tema y sistema visual fuera de Grows. |
| `estado_de_presupuesto_simple` | Duplicado de `simplificado`. |
| `oportunidades_premium_operative` | Duplicado de oportunidades; sin segunda ruta. |
| `historial_de_trabajos` | Segundo historial; un solo módulo (variante opcional más adelante). |
| `error_bloqueo_directo` | Absorbido en sistema de errores. |
| Naming “Azul operativo / SocioOperativa / PARTNER” en UI | Sustituir por **Grows** + rol **Socio** en copy. |

*Los `code.html` pueden quedarse en `stitch_socio` como archivo muerto de referencia visual; el equipo **no** debe citarlos como fuentes de verdad múltiples*

---

## 8. Faltantes para Stitch

### 8.1 Pantallas

- **Mensajes:** bandeja, hilo, compositor, estado vacío; alineado a cómo el cliente ya agrupa en “Notificaciones” si el producto mantiene un solo esquema.
- **Validación (terminología):** copy claro: el socio no “valida al cliente”, **reenvía o corrige** según `feedback_revisi_n_necesaria` — coherente con FSM tareas.
- **Transiciones entre** `jornada_ahora` ↔ `ahora/activa` (cuando inicia o pausa sesión).

### 8.2 Estados (empty / loading / error)

- **Empty:** sin obras, sin oportunidades, sin notificaciones, billetera sin movimientos, presupuestos vacíos, “ahora” sin tarea.
- **Loading:** listas, envío de evidencia, envío de presupuesto, preview PDF (si aplica).
- **Error / bloqueo:** unificar con `estados_de_error_y_bloqueo` (red, amarillo, y bloqueo legal/técnico).
- **Offline / reconexión:** no cubierto en el material; definir al menos un patrón de banner o pantalla mínima.

### 8.3 Flujos incompletos

- **Cierre** → notificación al cliente y **feedback**; falta hilo **único** en diagrama (solo pantallas sueltas).
- **Presupuestos:** encadenar explícitamente: oportunidad → `detalle_de_pedido_ultra_simple` → `presupuestar_ultra_simple` / `nuevo_presupuesto_r_pido` → `resumen antes de presupuestar` → `presupuesto_enviado_con_preview`.
- **Equipo** (`detalle_de_integrante_layer_2`): permisos y cuándo se muestra (obra vs cuenta).

### 8.4 Componentes clave a extraer (no duplicar por pantalla)

- `TopBar` unificado (hoy mezcla GROWS / PARTNER / SOCIOS).
- `BottomNav` unificado.
- `SlideToConfirm` (de `jornada_activa_slide_to_finish`).
- `StatusBanner` (validación, error, en revisión).
- `PrimaryWorkCard` (trabajo actual en home).

### 8.5 Variantes mobile/desktop

- No pedir a Stitch “otra app desktop”; pedir **el mismo flujo** en ancho 1440 con sidebar opcional y sin bottom bar.

---

## 9. Handoff frontend

### 9.1 Qué módulos existen (contrato)

| Módulo | Existe en material | Listo para implementar UI |
|--------|--------------------|---------------------------|
| Panel | Sí | Sí |
| Obras | Sí | Sí |
| Ahora + activa | Sí (fusionado) | Sí (unificar 3 en 1) |
| Tareas / etapas | Sí (parcial) | Sí |
| Evidencias | Sí | Sí |
| Validación (socio) | Sí (estados) | Sí (sin lógica de validación del cliente) |
| Presupuestos + oportunidades | Sí | Sí (con recorte de duplicados) |
| Billetera | Sí | Sí |
| Notificaciones | Sí (lista) | Sí (deep link a definir) |
| Cuenta + historial + datos | Sí | Sí (un historial) |
| Mensajes | No | **Shell + empty states**; contenido acoplado a backend/realtime |

### 9.2 Cómo se organiza

- Ver **§6**; navegación **§5.1**; canonicidad **§3** y **§7**.

### 9.3 Qué implementar primero (orden sugerido)

1. **AppShell** + tokens + nombre **Grows** (eliminar ruido de marca de los mocks).
2. **Panel** + **Obras** (entrada al mundo del socio).
3. **Ahora** (`jornada_ahora` + vista activa canónica + componente de cierre).
4. **Tareas** (lista minimal + detalle etapa / asignado).
5. **Evidencias** + estados de **validación/feedback** (3 pantallas conectadas).
6. **Presupuestos** (flujo completo con recortes de §7).
7. **Billetera** + **Notificaciones** + **Cuenta** (incl. historial unificado).
8. **Mensajes** (cuando haya API/contrato; mientras, rutas y placeholders).

### 9.4 Qué no tocar

- **Backend** (APIs, Supabase, reglas de pago, FSM de tareas en servidor).
- **Landing** pública.
- **Panel cliente** (no duplicar `ValidarSection` en socio; el socio no es el validador de bloques del cliente).
- Reescritura “por gusto” de flujos ya cubiertos por un canónico en §3.

### 9.5 Qué depende del backend

- Mensajes, notificaciones en tiempo real, asignación de tareas, estados de presupuesto, montos y movimientos de billetera, permisos de tripulación, URLs de evidencias y de preview de presupuesto (PDF). El front asume **contratos** ya existentes o documentados en el repo de API; no inventar endpoints aquí.

---

## 10. Recomendación final

1. Cerrar en diseño/ Stitch **un único mapa de pantallas** con las canónicas de la §3, **más** las piezas faltantes de la §8 (especialmente **Mensajes** y estados transversales).
2. En código, arrancar por **AppShell + Panel + Obras + Ahora** para fijar navegación y no acumular deuda de rutas.
3. Prohibido añadir nuevas “variantes A/B” en carpetas: todo cambio pasa a **componente** o **prop** (densidad, tema), no otra ruta.

**Siguiente paso inmediato:** generar con Stitch (o Figma) **un solo** flowchart y **un solo** lenguaje visual Grows, usando como pixel reference las carpetas **canónicas** listadas en §3 y §7, y rellenar con §8 lo que aún no existe en `stitch_socio`.

---

*Documento generado a partir del análisis de `reforma/stitch_socio` (38× `code.html`) y alineado al contexto de producto Grows (panel cliente, flujo tareas/validación en cliente, sin extender scope backend ni landing).*
