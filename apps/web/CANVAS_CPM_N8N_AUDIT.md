# Canvas de Obra + CPM tipo n8n — Auditoría técnica (repo + Stitch)

**Fecha de auditoría:** 2026-04-24  
**Alcance:** `apps/web` (sin tocar otras apps del monorepo salvo referencias puntuales).  
**Regla del usuario:** no se modificó código de producto; este archivo es el entregable acordado.

---

## 1. Qué existe en el repositorio

### 1.1 Editor / lienzo con nodos y aristas (experiencia “n8n-like”)

| Pieza | Ruta | Qué hace |
|--------|------|-----------|
| **TaskCanvas** | `components/clienteTecnico/TaskCanvas.tsx` | Lienzo con **nodos** (tareas), **zoom**, arrastre, **handles** entrada/salida, conexión visual entre tareas, menú “Agregar precedencia”, cálculo visual de CPM en el nodo (holgura / camino crítico). Implementación **propia** (div + SVG), no librería de grafo. |
| **OrganizaSection** | `components/clienteTecnico/OrganizaSection.tsx` | Orquesta datos de Supabase, **Zustand** (`useOrganizaStore`), `calcularCPM` de `lib/utils/cpm.ts`, **persistencia** de `tarea_precedencias` (insert/update/delete), y opcionalmente **guardado de métricas CPM** vía API. |
| **useOrganizaStore** | `lib/hooks/useOrganizaStore.ts` | Estado local por `obraId`: orden del lienzo, `x/y`, `duracion`, `dependeDe`. |
| **EditorVisualTareas** | `components/cliente/EditorVisualTareas.tsx` | Otro lienzo/grafo con zoom y nodos por **etapa**; lógica duplicada respecto a TaskCanvas a nivel de concepto. |
| **DetalleObra** | `components/cliente/DetalleObra.tsx` | CPM **embebido** (forward/backward) sobre modelo de tareas con `precedencia: string[]` (UI/legado, no el mismo pipeline que TaskCanvas + Supabase). |

### 1.2 Dependencias entre tareas (datos reales)

| Pieza | Ruta | Qué hace |
|--------|------|-----------|
| Tabla / uso **Supabase** | Varios | Filas en **`tarea_precedencias`**: al menos `tarea_id`, `depende_de` (predecesora). Código: `OrganizaSection`, `app/api/tareas/[id]/transition/route.ts` (gating de transiciones), `AhoraSection`, `TareasEnCurso`, `TareasSection` (carga de precedencias), `app/api/qr/resolve`. |
| Orden topológico | `utils/ordenarTareasPorPrecedencias.ts` | Kahn + niveles; usado en flujos de socio (“siguiente tarea” según DAG). |
| Tipos de dominio | `lib/types/grows.types.ts` | `TareaPrecedencia` con `tarea_predecesora_id`, `tipo_dependencia`, `lag_dias` (el **código de pantalla** a veces usa solo `depende_de`; conviene alinear nombres al esquema real). |

### 1.3 CPM (Critical Path Method) en backend y utilitarios

| Pieza | Ruta | Qué hace |
|--------|------|-----------|
| CPM puro (frontend util) | `lib/utils/cpm.ts` | `calcularCPM`, forward/backward, float, crítico. **Fuente de verdad recomendada** para el visor. |
| Servicio CPM + Supabase | `lib/services/cpm.service.ts` | `calcularCPMDesdeSupabase(obraId)` — arma grafo desde tareas y precedencias. |
| API | `app/api/obras/[id]/cpm/route.ts` | GET: devuelve camino crítico y tareas con holguras. |
| API | `app/api/obras/[id]/guardar-cpm/route.ts` | POST: persiste es/ef/ls/lf/float en **tareas** (si el esquema en Supabase lo contempla; validar en integración). |

### 1.4 Rutas y estado de “producto” vs prototipo

| Ruta / componente | Estado |
|-------------------|--------|
| `components/cliente/TareasSection.tsx` | Contiene tabs **resumen / organiza / asignar / etapas / validar** e incrusta **OrganizaSection** en el tab “organiza”. **No hay import de `TareasSection` bajo `app/`** en esta auditoría: el shell completo con lienzo conectado a Supabase queda **sin ruta pública** (código hecho pero no enrutado). |
| `app/cliente/tareas/page.tsx` y `app/cliente/tareas/[obraId]/page.tsx` | Navegación y datos **mock** (`clienteMockData`). Botón al editor. |
| `app/cliente/tareas/[obraId]/editor/page.tsx` | **Editor autónomo** con datos mock in-page (Gantt/dependencias de ejemplo), **no reutiliza** `TaskCanvas` / `OrganizaSection`. Misma estructura duplicada en `app/tareas/[id]/editor/page.tsx` (código casi idéntico al inicio). |
| `app/cliente/etapas/page.tsx` + `components/cliente/EtapasSection.tsx` | **Timeline de 3 etapas** (Estructura / Obra gris / Terminaciones) con progreso desde tareas reales. **Sí** está enrutada; alinea con el “nivel 1” del concepto de canvas, pero **sin** integración al editor de grafo. |

### 1.5 Dependencias npm relevantes (no hay React Flow)

`package.json` **no** incluye `@xyflow/react` ni `reactflow`. Sí incluye:
- `konva` / `react-konva` (posible base para escenas 2D; el canvas actual de tareas no depende de ello de forma obvia en TaskCanvas),
- `@dnd-kit/*`,
- `three` / `web-ifc` (otros módulos BIM/3D, no el editor CPM actual).

**Conclusión explícita:** el “CPM tipo n8n” en código es un **lienzo custom + DAG en DB**, no un producto n8n ni React Flow.

---

## 2. Dónde está (índice rápido)

- **Grafo UI (n8n-like):** `components/clienteTecnico/TaskCanvas.tsx`  
- **Lógica editor + Supabase + CPM en cliente:** `components/clienteTecnico/OrganizaSection.tsx`  
- **Store del lienzo:** `lib/hooks/useOrganizaStore.ts`  
- **CPM:** `lib/utils/cpm.ts`, `lib/services/cpm.service.ts`, `app/api/obras/[id]/cpm/route.ts`, `app/api/obras/[id]/guardar-cpm/route.ts`  
- **Precedencias y ejecución:** `tarea_precedencias` (Supabase) + `app/api/tareas/[id]/transition/route.ts` + `utils/ordenarTareasPorPrecedencias.ts`  
- **Prototipo ruta deseada por producto (mock hoy):** `app/cliente/tareas/[obraId]/editor/page.tsx`  
- **Segundo duplicado de prototipo:** `app/tareas/[id]/editor/page.tsx`  
- **CPM duplicado (legado en componente de obra):** `components/cliente/DetalleObra.tsx`  
- **Referencia visual Stitch (lectura de diseño):**  
  - `reforma/stitch_arquitectura_usuario/referencias_visuales_organizadas/canvas_soporte/*.html`  
  - `reforma/stitch_arquitectura_usuario/builder_canvas_de_obra/code.html`  
  - `reforma/stitch_arquitectura_usuario/canvas_desktop/code.html`  
  - `reforma/stitch_arquitectura_usuario/checklist tareas/code.html`  

---

## 3. Qué sirve (reutilizar)

1. **`lib/utils/cpm.ts` + `CPMService` + API `/api/obras/[id]/cpm`** — modelo y cálculo de CPM alineado con tareas reales.  
2. **`tarea_precedencias` + `transition` API** — reglas de negocio de **ejecución** (no solo dibujo).  
3. **`TaskCanvas` + `OrganizaSection`** — ya implementan **nodos, aristas, zoom, CPM en UI y persistencia**; es la base natural del “editor n8n” de Grows.  
4. **`ordenarTareasPorPrecedencias`** — orden de trabajo y validación de ciclos en listas.  
5. **`EtapasSection`** — patrón de “timeline” por las 3 etapas; encaja como **capa 1** de navegación.  
6. **Stitch** — sistema de **navegación en profundidad** (breadcrumbs, drill-down, controles de zoom, rail lateral Canvas / Task list / Packages) y de **checklist** como patrón de UI.

---

## 4. Qué no sirve o hay que reemplazar con cuidado

1. **Rutas `.../editor` en `app/cliente/tareas/.../editor` y `app/tareas/.../editor`:** hoy **no** conectan al stack TaskCanvas/Organiza; desinforman si se toman como “estado del producto”.  
2. **`TareasSection` sin ruta:** riesgo de **doble fuente de verdad**; o se expone bajo el layout cliente o se fusiona con la nueva ruta de editor.  
3. **`DetalleObra` CPM** vs **`lib/utils/cpm.ts`:** dos implementaciones; para el canvas unificar en **un solo módulo CPM** para no diverger.  
4. **`EditorVisualTareas` vs `TaskCanvas`:** duplicación conceptual; al implementar el editor, **elegir un motor de lienzo** (idealmente reforzar `TaskCanvas` ya acoplado a Organiza).  
5. **Profundidad jerárquica:** Stitch anida **Obra → Etapa → Rubro → Piso** (y más); en código la “etapa” es sobre todo **atributo de tarea** / taxonomía, sin entidades de “fase nodo” separadas.  

---

## 5. Cómo encaja con Stitch (mapeo)

### 5.1 `canvas_soporte` (incl. `plan_de_obra_canvas.html`, `canvas_desktop.html`, etc.)

- **Breadcrumb** Obra / Etapa / Rubro / Piso y **doble tap / drill down** en prototipo Stitch.  
- **Nodos en columna** y líneas de conexión; **controles flotantes** zoom.  
- **Código hoy:** `TaskCanvas` ya tiene **zoom y nodos**; **no** hay breadcrumb de 4 niveles ni “rubro/piso” como entidades. **Coincide** en: lienzo, zoom, conexión entre etapas de diagrama. **Falta:** jerarquía fina (rubro, piso) y navegación estructurada de primer nivel con la misma semántica que Stitch.

### 5.2 `builder_canvas_de_obra` (`code.html`)

- Grid de fondo (`canvas-bg`), top bar, **sidebar** con ítems Canvas, Task list, **Packages**; nodos y conectores.  
- **Código hoy:** Organiza/ TaskCanvas = canvas + tareas; **no** hay módulo “Packages” en el mismo layout que Stitch. **Falta:** shell completo (nav lateral, búsqueda global del proyecto) si se quiere paridad 1:1 con referencia.

### 5.3 `canvas_desktop` (`code.html`)

- Título de producto *Architectural Canvas*; estructura desktop con bloques/hero de obra.  
- **Uso:** guía de **layout y tokens**; integrar con `ClienteHeader` / shell actual en lugar de duplicar HTML estático.

### 5.4 `checklist tareas` (`code.html`)

- Listado de tareas con estados, iconografía y jerarquía de checklist.  
- **Código hoy:** subtareas/validación existen en otras partes del sistema; en el **canvas** el checklist no está unificado con este mock. **Falta:** componente de checklist alineado a Stitch **conectado** a `subtarea` / validación reales (según modelos de backend).

---

## 6. Modelo final del Canvas (definición para implementación)

**Nota:** “Nodo (fase)” en producto = agrupación de tareas. En la base hoy no aparece una tabla `fases` dedicada; se puede modelar **por tarea** (`etapa`, `fase`, `elemento_id`) o **nueva** entidad en el futuro. Abajo, modelo **lógico** que el editor debe soportar.

| Entidad | Rol | Mapeo actual aproximado |
|---------|-----|-------------------------|
| **Obra** | Contenedor de planificación y ejecución | `obras` |
| **Etapa** | Macrociclo: Estructura / Obra gris / Terminaciones | Campo de tarea + `EtapasSection` / `TaskCanvasEtapa` |
| **Nodo (fase / bloque)** | Agrupación bajo etapa: ej. estructura / obra gris / terminaciones o rubros | *Parcial en UI;* a definir si es **virtual** (filtro) o **tabla** `canvas_nodos` |
| **Tarea** | Unidad de ejecución, pagos, evidencia | `tareas` |
| **Dependencia (edge)** | Precedencia entre tareas | `tarea_precedencias` (`tarea_id` → `depende_de` / predecesora) |
| **Atributos por tarea (requisito de negocio)** | estado, responsable, duración, evidencia, validación, pago | `tareas` + estados + `socio_id` + tablas de evidencia/pago existentes; el canvas **lee** y **muestra**; las transiciones **siguen** las APIs actuales |

**Relaciones lógicas (objetivo):**  
`obra` → *etapas* → *nodos de fase* → *tareas* → *dependencias* (grafo de tareas dentro del nodo/etapa).

---

## 7. Arquitectura técnica (objetivo)

- **Capa 1 – Timeline de etapas:** componentes tipo `EtapasSection` (o ruta dedicada) + CTA “entrar a etapa / bloque”.  
- **Capa 2 – Lienzo de bloque/etapa:** contenedor con zoom; puede listar “nodos fase” o ir directo al grafo si el bloque = etapa.  
- **Capa 3 – Grafo CPM (n8n-like):** `TaskCanvas` (o su evolución) con nodos = `tarea`, edges = filas de `tarea_precedencias`.  
- **Cálculo CPM:** `calcularCPM` (cliente para interactividad) alineado con `GET /api/obras/:id/cpm` (servidor). Persistencia opcional vía `guardar-cpm`.  
- **Ejecución real:** `transition` y políticas de precedencia; el editor no debe desconectar el DAG de la FSM.  
- **Estado de UI del editor:** `useOrganizaStore` o equivalente, posible **normalización** por `obraId` + `etapaId` + `faseId` si se agregan niveles.  

---

## 8. Decisiones: CONSTRUIR / REUTILIZAR / REESCRIBIR / ELIMINAR

| Categoría | Qué | Decisión |
|------------|-----|----------|
| **REUTILIZAR** | `TaskCanvas` + `OrganizaSection` + `useOrganizaStore` + `tarea_precedencias` + `lib/utils/cpm.ts` + API CPM + `transition` | **Mantener como núcleo** del editor; conectar a la ruta pública deseada. |
| **REESCRIBIR (parcial)** | Páginas `.../editor` mock | Sustituir implementación en página por **composición** de timeline + `OrganizaSection` (o extraer contenedor). |
| **REESCRIBIR (parcial)** | `TareasSection` huérfano | **O bien** colgar bajo `app/cliente/...` **o** absorber en una sola ruta “Canvas de obra” para no duplicar. |
| **REESCRIBIR (mínimo)** | `DetalleObra` CPM | Sustituir cálculo interno por llamadas a **un solo** módulo `lib/utils/cpm` o a la API. |
| **CONSTRUIR** | Breadcrumb y niveles **Rubro / Piso** si el negocio los confirma | Nuevo modelo o metadatos en tarea/elemento; no está en el grafo actual. |
| **CONSTRUIR** | Checklist y “Packages” en el shell tipo Stitch | UI + enlaces a presupuestos/paquetes existentes. |
| **ELIMINAR (tras migración)** | Duplicado `app/tareas/[id]/editor` vs `app/cliente/tareas/.../editor` | Tras unificar, **una sola ruta** o redirect claro. |
| **ELIMINAR (valor que dependerá)** | `EditorVisualTareas` | Solo si toda su función pasa a `TaskCanvas` + props compartidos. |

**No** se recomienda “instalar React Flow” **hasta** evaluar: si `TaskCanvas` + mejoras (virtualización, minimap) cubren; si no, se puede **envolver** TaskCanvas o migrar a XYFlow con **misma** fuente de datos (tareas y precedencias).  

---

## 9. Próximo paso EXACTO (implementación)

1. **Añadir una ruta pública** (p. ej. `app/cliente/tareas/[obraId]/editor/page.tsx` **o** nueva `app/cliente/obras/[obraId]/editor/page.tsx`) que **importe y monte** un contenedor:  
   - `EtapasSection` o timeline compacta arriba, y debajo `OrganizaSection` con `obraId` y datos de tareas reales (mismo contrato que en `TareasSection`).  
2. **Eliminar o aislar** el bloque de datos mock del archivo de editor actual para no convivir dos mundos.  
3. **Unificar** la fuente CPM: `OrganizaSection` + API `GET /api/obras/:id/cpm` y una sola visualización de crítico.  
4. **Alinear nombres** de columnas de precedencias con `TareaPrecedencia` / Supabase (depende_de vs tarea_predecesora_id) en un solo mapeo.  
5. **Paridad Stitch (iteración 2):** añadir breadcrumb y slot “Packages/Checklist” en el layout sin tocar aún el modelo de fases hasta definição de “rubro/piso”.

---

## 10. Respuestas directas a las preguntas TAREA 1

1. **¿Existe ya un editor tipo n8n?** **Sí, en intención y parcialmente en producto:** `TaskCanvas` + `OrganizaSection` (nodos, conexiones, zoom, precedencias en DB). **No** es n8n ni React Flow.  
2. **¿React Flow?** **No** en dependencias ni uso detectado.  
3. **¿Lógica de dependencias entre tareas?** **Sí:** `tarea_precedencias` + `ordenarTareasPorPrecedencias` + `transition` con validación de precedencias.  
4. **¿Modelo CPM en backend?** **Sí:** `CPMService`, `GET /api/obras/[id]/cpm`, `POST .../guardar-cpm` (persistencia de métricas en tareas, según esquema).  
5. **¿UI de nodos o grafo?** **Sí:** `TaskCanvas` (y duplicado conceptual en `EditorVisualTareas`).  
6. **¿Algo armado y abandonado?** **Sí:** `TareasSection` con tab “organiza” **sin ruta**; páginas `.../editor` con **mocks** desconectados del stack real.  

---

**Fin del documento** — listo para implementar el editor encima del núcleo existente y con referencias Stitch como guía de layout y profundidad de navegación.
