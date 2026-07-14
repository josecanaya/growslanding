# HANDOFF — Grows Obra Check (herramienta gratuita de marketing)

**Fecha:** 2026-07-13
**Para:** agente implementador (económico). Este documento contiene TODAS las decisiones ya tomadas. No re-litigar arquitectura; ante ambigüedad, elegir la opción más simple que cumpla el criterio de aceptación.

---

## 1. Contexto y regla estratégica

Herramienta pública y gratuita en `apps/web` para arquitectos / jefes de obra:

1. Cargan tareas desde **Excel/CSV/Project XML** o las **crean con un chat limitado**.
2. Grows las convierte a su **XML nativo**, las **ordena** (CPM) y sugiere **bloques**.
3. El usuario ve el resultado en un **canvas de solo lectura** (se ve como Grows real).
4. Asigna **contratistas** (nombre + rubro + teléfono) a bloques/tareas.
5. Genera **PDF** (orden de trabajo o pedido de presupuesto) y lo manda **por WhatsApp desde su propio número** (`wa.me` / `navigator.share`).
6. Pantalla final de upsell suave hacia Grows pago.

**Regla del muro (NO romperla):**
> Mandar trabajo es GRATIS. Saber si se hizo (evidencia, validación, atrasos, pagos, respuestas del contratista) es Grows PAGO.

El free tool es **one-way**: manda y queda ciego. Ese dolor es el upsell. No construir NADA de retorno (respuestas, tracking de lectura, estados del contratista).

---

## ESTADO — Fase 1 COMPLETA ✅ (2026-07-14)

Motor + datos + API implementados y verificados (18/18 tests verdes, `tsc` sin errores en el módulo).

**Archivos creados:**
- Migración: `apps/web/supabase/migrations/20260714120000_obra_check_mvp.sql` (6 tablas + RLS deny-all + índices). **Falta aplicarla** contra la base (requiere acceso a Supabase).
- Motor `apps/web/lib/obra-check/`: `types.ts`, `rubros.ts`, `columns.ts`, `excelAdapter.ts`, `xmlAdapter.ts`, `ordenar.ts`, `sugerirBloques.ts`, `waMessage.ts`, `mappers.ts`, `db.ts`.
- API `apps/web/app/api/obra-check/`: `session`, `tasks`, `ordenar`, `contacts`, `asignar`, `wa`, `events`, `chat` (todas `route.ts`).
- Tests `apps/web/__tests__/lib/obra-check/`: `excelAdapter`, `xmlAdapter`, `ordenar`, `sugerirBloques`, `waMessage`.

**Desviaciones respecto al plan original (leer antes de Fase 2):**
1. **Excel adapter opera sobre matriz ya parseada** (`rows: unknown[][]`), no sobre el archivo. SheetJS/CSV se agrega en Fase 2 en el componente de upload (dep `xlsx`), llamando `XLSX.utils.sheet_to_json(sheet, { header: 1 })` y pasando el resultado a `excelToTasks`. Así el motor quedó puro y testeable sin deps.
2. **`growsCanvasBundle` / `buildObraCheckBundle` NO se implementó** (evita acoplar el motor a helpers de componentes del canvas). Se hace en **Fase 2** junto a `ObraCheckCanvasView`, construyendo el bundle desde la respuesta de `/ordenar` (`tasks` + `blocks`).
3. **`xmlAdapter` usa `DOMParser`** (vía `parseProjectXml`): correr **client-side** o en jsdom, NUNCA en una route Node. Por eso las routes reciben tareas ya normalizadas vía `PUT /tasks`.
4. **Modelo de ids:** `client_id` (string generado por el front) es la identidad estable; predecesoras y refs de bloque se guardan como `client_id` (`text[]` / `block_client_id text`). El uuid PK es interno. La migración refleja esto.
5. **Rutas públicas confirmadas:** el `matcher` de `middleware.ts` no incluye `/obra-check` ni `/api/obra-check` → no requiere cambios de middleware.
6. Se agregó `mappers.ts` (fila Supabase ↔ dominio) no listado en el plan original.

**Contratos de API reales (para la UI de Fase 2):**
- `POST /session` → body `{ email?, empresa?, tipoObra?, consentProcesamiento: true, consentPatrones?, consentVersion? }` → setea cookie httpOnly `obra_check_token`, devuelve `{ success, data: { sessionId } }`.
- `PUT /tasks` → `{ tasks: ObraCheckTask[] }` (full-replace, máx 500) → `{ data: { count } }`.
- `POST /ordenar` → sin body → `{ data: OrdenarResult }` (`tasks`, `blocks`, `cpm`, `warnings`).
- `POST /contacts` → `{ nombre, rubro?, telefono? }` → `{ data: { id, nombre, rubro, telefono } }`; `GET` lista.
- `POST /asignar` → `{ contactId(uuid), blockId?(client_id), taskClientIds? }`.
- `POST /wa` → `{ contactId(uuid), blockId(client_id), tipo, fechaLimite? }` → `{ data: { texto, waLink } }`.
- `POST /events` → `{ tipo, payload? }`. `POST /chat` → `{ message, state? }` → n8n o `{ data: { fallback: true } }`.

**Pendiente operativo:** ~~aplicar la migración en Supabase~~ ✅ aplicada; flujo validado end-to-end con `curl`.

---

## ESTADO — Fase 2 COMPLETA ✅ (2026-07-14)

Front público `/obra-check` implementado y **verificado end-to-end contra Supabase real** (los 6 endpoints responden 200: session → tasks → ordenar → contacts → asignar → wa; CPM real OK; link `wa.me` generado). La página compila y renderiza (HTTP 200).

**Archivos creados:**
- Página: `apps/web/app/obra-check/page.tsx` (pública, sin auth — confirmado que renderiza).
- UI `apps/web/components/obra-check/`: `ObraCheckWizard.tsx` (orquestador de 6 pasos), `StepIntro.tsx`, `StepCarga.tsx`, `ChatPanel.tsx`, `ObraCheckCanvasView.tsx`, `StepAsignar.tsx`, `StepEnvio.tsx`, `StepUpsell.tsx`, `ui.tsx` (primitivos de marca).
- Cliente/parseo `apps/web/lib/obra-check/`: `client.ts` (fetch a la API), `fileParse.ts` (SheetJS + XML → tareas).
- Dependencia agregada: `xlsx@0.18.5` (parseo de Excel/CSV en el navegador).

**Decisiones de Fase 2:**
1. **Canvas read-only = grafo real con `@xyflow/react`** (ya instalado), NO `CanvasObraEditor` (que requiere obraId). Bloques como columnas, tareas como nodos, precedencias como aristas, camino crítico resaltado en dorado.
2. **Estilado con tokens planos** (`growsBlue/growsGold/...` en hex) via primitivos propios en `ui.tsx`. El `Button` de `ui/grows` referencia clases `grows-*` que NO resuelven en este proyecto, por eso no se reutilizó.
3. **Parseo client-side**: el archivo nunca sube crudo; se parsea en el navegador (`fileParse.ts`) y se envían tareas normalizadas por `PUT /tasks`.
4. **Chat con fallback**: si n8n devuelve `{ fallback: true }`, `ChatPanel` lo informa y el usuario usa la tabla manual. El flujo no depende del chat (verificado: sin n8n configurado, la carga manual/archivo cubre todo).
5. **Mapeo de columnas confirmable**: tras subir Excel, `StepCarga` muestra el mapeo detectado con selects editables (re-normaliza con `remapSpreadsheet`).

**Pendiente Fase 3:** PDF (orden de trabajo / pedido de presupuesto) client-side + `navigator.share` con archivo; hoy el botón "PDF" está deshabilitado ("pronto"). El envío por WhatsApp es solo texto (`wa.me`), que ya funciona.

---

## 2. Código existente a REUTILIZAR (no reescribir)

| Necesidad | Archivo existente | Uso |
|---|---|---|
| Parsear Project XML → preview | `apps/web/lib/project/importProjectXml.ts` (`parseProjectXml`) | Base del pipeline. OJO: usa `DOMParser` (browser). En server usar `@xmldom/xmldom` o parsear client-side |
| Preview → bundle canvas | `apps/web/lib/project/projectImportToCanvas.ts` (`buildCanvasImportBundle`, tipo `ProjectCanvasImportBundle`) | Alimenta el canvas read-only |
| XML nativo Grows (escritura) | `apps/web/lib/canvas/buildCanvasTemplateProjectXml.ts` (`buildSimpleLinearPlanTemplateXml`) | Generar el XML desde tareas del chat/Excel |
| XML template → bundle | `apps/web/lib/canvas/importCanvasTemplateFromXml.ts` (`canvasImportBundleFromTemplateXml`) | Cierra el round-trip |
| CPM / camino crítico | `apps/web/lib/utils/cpm.ts` (`calcularCPM`) | Motor puro, sin dependencias. Usar tal cual |
| PDF (patrón pdf-lib) | `apps/web/lib/pdf/generarPresupuestoPDF.ts` (`generarPresupuestoPDFBytes`) | Copiar el patrón para los 2 layouts nuevos |
| Compartir PDF por WhatsApp | `apps/web/lib/socio/presupuestoPdfShare.ts` (`sharePresupuestoPdf`, `openWhatsAppPresupuesto`) | Copiar patrón exacto: `navigator.share` con file en móvil, fallback descarga + `wa.me/?text=` |
| Chat vía n8n | `apps/web/app/api/chat/route.ts` → `apps/web/src/api/grows_webhook.ts` | Mismo patrón para el chat de Obra Check |
| Preview visual de import | `apps/web/components/cliente/canvas-editor/ProjectXmlImportPreviewModal.tsx` | Referencia de UI para el canvas read-only |
| Convención migraciones | `apps/web/supabase/migrations/*.sql` | Formato: `YYYYMMDDHHMMSS_nombre.sql`, `public.`, `gen_random_uuid()` |

## 3. Código existente que NO reutilizar

- `app/api/tareas/[id]/generar-bloques/route.ts` — acoplado a auth + presupuesto aprobado. Los bloques del free tool usan una heurística propia (ver §5.4).
- `CanvasObraEditor.tsx` — requiere `obraId` real de Supabase. El canvas read-only se alimenta del bundle, no de una obra.
- Tablas `public.obras / tareas / tareas_subtareas / socios` — **PROHIBIDO tocarlas o leerlas** desde Obra Check en este MVP.
- `DiagnosticTool.tsx` — es debug de red, nada que ver.

---

## 4. Arquitectura (decidida — no cambiar)

- **Módulo dentro de `apps/web`**, NO app nueva, NO package de workspace todavía.
  - Motor: `apps/web/lib/obra-check/`
  - UI: `apps/web/app/obra-check/` (pública, sin login)
  - API: `apps/web/app/api/obra-check/`
- **Datos: tablas en `public` con prefijo `obra_check_`** + RLS deny-all. El browser NUNCA habla con Supabase directo: todo pasa por API routes con `createServiceSupabaseClient()` (ya existe en `apps/web/lib/supabase-server.ts`). La sesión anónima se identifica con un `session_token` (uuid) guardado en cookie httpOnly.
- **Parsing de archivos: client-side** (el archivo nunca sube crudo al server en v1; se sube el resultado normalizado). Evita almacenar archivos y simplifica privacidad.
- **WhatsApp: solo `wa.me` / Web Share.** NO integrar WhatsApp Business API.
- **Chat: vía n8n** (mismo webhook pattern). Si `N8N_WEBHOOK_URL` no está configurado, la UI degrada a wizard por formularios (el flujo debe funcionar completo sin chat).

### Modelo normalizado (contrato central del motor)

```ts
// apps/web/lib/obra-check/types.ts
export type ObraCheckTask = {
  id: string;                  // estable dentro de la sesión (uuid o "t-<n>")
  nombre: string;
  rubro: string | null;        // ver diccionario §5.3
  duracionDias: number | null;
  inicio: string | null;       // ISO date
  fin: string | null;
  predecesoras: string[];      // ids
  responsableLabel: string | null;
  contactId: string | null;    // FK a contacto
  blockId: string | null;
  origen: 'excel' | 'csv' | 'project_xml' | 'chat';
  filaOrigen?: number;
};

export type ObraCheckBlock = { id: string; nombre: string; rubro: string | null; orden: number; taskIds: string[] };
export type ObraCheckContact = { id: string; nombre: string; rubro: string | null; telefono: string | null };
```

Todo converge acá: Excel, CSV, XML y chat producen `ObraCheckTask[]`. CPM, bloques, PDF y WhatsApp consumen SOLO esto.

---

## 5. FASE 1 — Datos + motor (sin UI)

### 5.1 Migración SQL

Crear `apps/web/supabase/migrations/<timestamp>_obra_check_mvp.sql`:

```sql
-- Obra Check: herramienta pública de diagnóstico/armado de plan (aislada de producción)
CREATE TABLE IF NOT EXISTS public.obra_check_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email text,
  empresa text,
  tipo_obra text,                -- 'casa' | 'edificio' | 'reforma' | 'trabajo_comun' | otro
  consent_procesamiento boolean NOT NULL DEFAULT false,  -- Consent A
  consent_patrones boolean NOT NULL DEFAULT false,       -- Consent B (bibliotecas)
  consent_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rubro text,
  telefono text,                 -- PII de tercero: solo se guarda para generar el wa.me
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rubro text,
  orden integer NOT NULL DEFAULT 0,
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  block_id uuid REFERENCES public.obra_check_blocks(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  rubro text,
  duracion_dias numeric,
  inicio date,
  fin date,
  predecesoras uuid[] NOT NULL DEFAULT '{}',
  responsable_label text,
  orden integer NOT NULL DEFAULT 0,
  es_critica boolean,
  origen text NOT NULL DEFAULT 'chat' CHECK (origen IN ('excel','csv','project_xml','chat')),
  fila_origen integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  block_id uuid REFERENCES public.obra_check_blocks(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('orden_trabajo','pedido_presupuesto')),
  texto text NOT NULL,
  generado_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  tipo text NOT NULL,            -- 'session_created','file_parsed','chat_message','xml_built','blocks_suggested','contact_added','wa_generated','pdf_downloaded','upsell_view','upsell_click'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: deny-all. Acceso EXCLUSIVO vía service role en API routes.
ALTER TABLE public.obra_check_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_contacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_events      ENABLE ROW LEVEL SECURITY;
-- (sin policies = nadie salvo service role)

CREATE INDEX IF NOT EXISTS idx_obra_check_tasks_session ON public.obra_check_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_events_session ON public.obra_check_events(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_sessions_token ON public.obra_check_sessions(session_token);
```

### 5.2 Motor en `apps/web/lib/obra-check/`

| Archivo | Contenido |
|---|---|
| `types.ts` | Tipos de §4 |
| `excelAdapter.ts` | XLSX/CSV → `ObraCheckTask[]`. Usar `xlsx` (SheetJS; agregar dep a `apps/web`). Detección de header + mapeo de columnas por diccionario (§5.3) con score de confianza. Devuelve `{ tasks, columnMapping, confidence, warnings }` para que la UI confirme |
| `xmlAdapter.ts` | Envuelve `parseProjectXml` + convierte `ProjectImportPreview` (nodos hoja) a `ObraCheckTask[]` (mapear `predecessors` por uid→id, `durationDays`, `semanticHint`→rubro) |
| `rubros.ts` | Diccionario de rubros (§5.3) + `detectarRubro(nombre: string): string \| null` |
| `ordenar.ts` | Adapta `ObraCheckTask[]` → `TareaCPM[]` de `lib/utils/cpm.ts`, corre `calcularCPM`, devuelve tareas con `orden` (ES asc), `es_critica`. Si no hay predecesoras: ordenar por `inicio` si existe, sino por secuencia de rubros canónica (§5.4), y marcar `warning: 'sin_dependencias'` |
| `sugerirBloques.ts` | Heurística §5.4 |
| `growsXml.ts` | `ObraCheckTask[]` → XML nativo con `buildSimpleLinearPlanTemplateXml` (o composición equivalente) y de vuelta a bundle con `canvasImportBundleFromTemplateXml`. Exportar `buildObraCheckBundle(tasks): ProjectCanvasImportBundle` |
| `waMessage.ts` | Plantillas de texto (§7.2) |

### 5.3 Diccionario de columnas y rubros

Mapeo de columnas (case/acentos-insensible, match parcial):

- `nombre`: tarea, actividad, item, ítem, descripción, concepto, trabajo
- `duracion`: duración, dias, días, plazo, dur
- `inicio`: inicio, comienzo, desde, fecha inicio, start
- `fin`: fin, término, hasta, entrega, fecha fin, finish
- `predecesoras`: predecesora, depende, precede, antecesora, pred
- `responsable`: responsable, asignado, encargado, a cargo, cuadrilla, gremio, contratista, owner
- `avance`: avance, %, progreso, completado

Rubros canónicos (v1, en este orden = secuencia constructiva por defecto):
`demolicion, movimiento_suelos, fundaciones, estructura, mamposteria, techos, instalacion_electrica, instalacion_sanitaria, instalacion_gas, revoques, contrapisos_carpetas, colocaciones (pisos/revestimientos), carpinterias, pintura, limpieza_final`.
Reusar como referencia los regex de `semanticHintFromName` en `importProjectXml.ts` y los nombres de templates en `apps/web/public/canvas-templates/trabajo_comun/`.

### 5.4 Heurística de bloques (NO usar generar-bloques de producción)

1. Agrupar tareas hoja consecutivas (según `orden`) que compartan `rubro`.
2. Máximo 8 tareas por bloque; si excede, partir.
3. Tareas sin rubro: bloque "Varios" al final o adjuntar al bloque vecino si el nombre matchea parcialmente.
4. Nombre del bloque = rubro legible + ambiente si se detecta ("Instalación eléctrica — PB").

### 5.5 API routes (`apps/web/app/api/obra-check/`)

Todas usan service client + validan `session_token` de cookie contra `obra_check_sessions`. Validar input con `zod` (ya es dep).

| Ruta | Método | Contrato |
|---|---|---|
| `session/route.ts` | POST | body `{ email?, empresa?, tipoObra?, consentProcesamiento: true, consentPatrones: boolean }` → crea sesión, setea cookie httpOnly `obra_check_token`, devuelve `{ sessionId }`. Registra evento `session_created` |
| `tasks/route.ts` | PUT | body `{ tasks: ObraCheckTask[] }` (reemplaza el set completo de la sesión — más simple que diffs). Límite 500 tareas. → `{ ok, count }` |
| `ordenar/route.ts` | POST | sin body. Corre `ordenar.ts` + `sugerirBloques.ts` sobre las tareas de la sesión, persiste `orden/es_critica/block_id`, devuelve `{ tasks, blocks, cpm: { duracionTotal, criticas }, warnings }` |
| `contacts/route.ts` | POST/GET | alta y listado de contactos de la sesión |
| `asignar/route.ts` | POST | body `{ blockId \| taskIds, contactId }` |
| `wa/route.ts` | POST | body `{ contactId, blockId?, tipo: 'orden_trabajo' \| 'pedido_presupuesto' }` → genera texto (waMessage.ts), persiste en `obra_check_wa_messages`, devuelve `{ texto, waLink }` donde `waLink = https://wa.me/<telefono>?text=<encoded>` (tel opcional: sin tel → `https://wa.me/?text=`) |
| `events/route.ts` | POST | body `{ tipo, payload? }` → inserta evento. Fire-and-forget desde el front |
| `chat/route.ts` | POST | body `{ message, state }` → proxy a n8n con `enviarMensajeAGrowsN8n({ tool: 'obra_check', sessionToken, message, state })`. Si no hay `N8N_WEBHOOK_URL` → `{ fallback: true }` |

Rate limit simple en `session` y `chat` (por IP, en memoria o tabla events; 20 req/min basta v1).

### 5.6 Criterios de aceptación Fase 1

- [ ] Migración aplica limpia sobre la base actual y `DELETE FROM obra_check_sessions WHERE id=X` cascadea todo.
- [ ] Test unitario: Excel de ejemplo (crear fixture `__tests__/lib/obra-check/fixtures/plan_ejemplo.xlsx`) → 20 tareas normalizadas con mapping correcto.
- [ ] Test unitario: `casa_1p_2amb_chica.xml` (ya existe en `public/canvas-templates/`) pasa por `xmlAdapter` → tareas con predecesoras resueltas.
- [ ] Test unitario: `ordenar.ts` con dependencias → CPM correcto; sin dependencias → orden por rubros + warning.
- [ ] Test unitario: `sugerirBloques` agrupa por rubro y respeta máx 8.
- [ ] `curl` al flujo completo: session → tasks → ordenar → contacts → asignar → wa devuelve `waLink` válido.
- [ ] Ninguna tabla `public.*` preexistente fue tocada (verificar migración: solo `CREATE`, cero `ALTER` de tablas existentes).

---

## 6. FASE 2 — Front público `/obra-check`

### 6.1 Páginas y componentes (`apps/web/app/obra-check/` + `apps/web/components/obra-check/`)

Ruta pública: verificar `apps/web/middleware.ts` y excluir `/obra-check` y `/api/obra-check` de cualquier redirect de auth.

Flujo en una sola página con steps (state machine simple, Zustand o useState):

1. **Landing/step 0:** título ("Armá y mandá el plan de tu obra gratis"), email + empresa + tipo de obra + checkboxes de consentimiento (A obligatorio, B opcional con texto claro: "Acepto que Grows use patrones anónimos de mi planificación para mejorar sus sugerencias"). Submit → `POST session`.
2. **Step carga:** dos tabs — "Subir archivo" (dropzone .xlsx/.csv/.xml; parseo client-side con los adapters) y "Crear con el asistente" (chat UI, ver §6.2). Al parsear Excel: **modal de confirmación de mapeo** (columna detectada → campo, editable con selects). Confirmar → `PUT tasks`.
3. **Step orden (canvas read-only):** llama `POST ordenar`, construye el bundle con `buildObraCheckBundle` y renderiza vista de solo lectura: árbol de bloques/tareas + badges de camino crítico + duración total. Usar `ProjectXmlImportPreviewModal.tsx` como referencia visual; NO montar `CanvasObraEditor` (requiere obraId). Componente nuevo: `ObraCheckCanvasView.tsx`. Debe verse "Grows": mismos tokens de diseño (`lib/design-tokens.ts`, componentes `ui/grows`).
4. **Step asignación:** lista de bloques; por bloque, botón "Asignar contratista" → mini-form nombre/rubro/teléfono (o elegir existente). `POST contacts` + `POST asignar`.
5. **Step envío:** por bloque asignado, elegir "Orden de trabajo" o "Pedido de presupuesto" → `POST wa` → botones "Enviar por WhatsApp" (abre `waLink`) y "Descargar PDF" (Fase 3; en Fase 2 mostrar deshabilitado "PDF disponible pronto" si Fase 3 no llegó aún).
6. **Step final (upsell):** ver §7.3.

### 6.2 Chat limitado

- UI de chat propia (referencia: `apps/landing/src/components/chat/GrowsBot.tsx`, simplificar).
- Contrato con backend: `POST /api/obra-check/chat` con `{ message, state }`; respuesta esperada de n8n: `{ reply: string, actions?: [{ type: 'add_tasks', tasks: Partial<ObraCheckTask>[] } | { type: 'set_rubro', taskId, rubro } | { type: 'done' }] }`. El front aplica `actions` al estado local y persiste con `PUT tasks`.
- **Alcance del chat: SOLO** (a) dictar tareas en lenguaje natural, (b) desambiguar rubros/columnas, (c) responder sobre el flujo. No responde preguntas generales.
- **Fallback obligatorio:** si `{ fallback: true }`, ocultar tab de chat y dejar solo upload + edición manual de tareas (tabla editable simple: nombre/duración/rubro). El flujo completo debe funcionar sin n8n.

### 6.3 Criterios de aceptación Fase 2

- [ ] Usuario anónimo (ventana incógnito, sin login) completa: email → sube `plan_ejemplo.xlsx` → confirma mapeo → ve canvas ordenado con camino crítico → asigna contratista con teléfono → botón WhatsApp abre `wa.me` con el texto correcto.
- [ ] Mismo flujo creando 5 tareas por chat (con n8n configurado) o por tabla manual (sin n8n).
- [ ] `/obra-check` accesible sin sesión; ninguna llamada del browser va directa a Supabase (verificar en network tab).
- [ ] Mobile-first: el flujo funciona en 375px (los arquitectos lo van a usar desde el teléfono).
- [ ] Eventos registrados en cada paso (verificar filas en `obra_check_events`).

---

## 7. FASE 3 — PDF + WhatsApp share + upsell

### 7.1 PDF (`apps/web/lib/obra-check/pdf.ts`)

Dos layouts con `pdf-lib`, copiando el patrón de `generarPresupuestoPDFBytes`:

1. **Orden de trabajo** (`tipo: orden_trabajo`): encabezado "Orden de trabajo — <bloque>", contratista destinatario, lista numerada de tareas con duración y orden, fecha estimada de inicio/entrega si existe, pie: "Generado con Grows — grows.app" (logo si está en `public/`).
2. **Pedido de presupuesto** (`tipo: pedido_presupuesto`): encabezado "Pedido de presupuesto", mismas tareas, columna "Cotización" vacía, texto "Enviá tu presupuesto respondiendo este mensaje", mismo pie.

Generación **client-side** (como hace `presupuestoPdfShare.ts`) para no almacenar PDFs en server.

### 7.2 Plantillas de mensaje (`waMessage.ts`)

```
ORDEN DE TRABAJO (con teléfono):
Hola {nombre} 👋 Te paso el detalle de {bloque} de la obra {tipoObra}.
📋 {n} tareas — arranque estimado {fecha}.
Te adjunto el PDF con el detalle y el orden.
Cualquier duda me escribís.

PEDIDO DE PRESUPUESTO:
Hola {nombre} 👋 Estoy armando {bloque} y quiero pedirte presupuesto.
📋 {n} tareas — te adjunto el PDF con el detalle.
¿Me pasás tu cotización cuando puedas?
```

Tono: profesional, corto, sin jerga. El PDF lleva la marca; el texto apenas ("Generado con Grows" solo en PDF, no en el texto del mensaje — el mensaje es del arquitecto, no nuestro).

### 7.3 Flujo de envío (copiar `presupuestoPdfShare.ts`)

1. Generar PDF client-side → `Blob`.
2. Móvil con `navigator.canShare({ files })`: `navigator.share({ files: [pdf], text: texto })` → el usuario elige WhatsApp.
3. Desktop / sin share: descargar PDF + abrir `wa.me/<tel>?text=<texto + "te mando el PDF a continuación">`.
4. Registrar evento `wa_generated` / `pdf_downloaded`.

### 7.4 Pantalla de upsell (step final)

Contenido (suave, sin agresión):
- Resumen: "Mandaste {n} paquetes a {m} contratistas. Tu plan tiene {d} días de duración y {c} tareas críticas."
- Los tres puntos ciegos, como hechos: "Desde acá no vas a poder saber: si lo recibieron y empezaron · cómo viene el avance real · si hay atrasos en el camino crítico."
- CTA único: "Activá el seguimiento con Grows — tus tareas ya están cargadas." → link a registro/landing existente (`apps/landing` o `/auth/login`), con `?utm_source=obra_check&session=<id>`.
- Secundario: "Descargar mi plan (PDF)" — PDF resumen del plan completo (reutiliza layout orden de trabajo, todas las tareas).
- Eventos: `upsell_view` al montar, `upsell_click` en CTA.

**NO implementar la promoción automática a `public.obras/tareas` en este MVP.** El CTA lleva al registro normal; la conversión de datos es V2.

### 7.5 Criterios de aceptación Fase 3

- [ ] PDF de orden de trabajo y de pedido de presupuesto se generan client-side y abren correctos (fixture de 12 tareas, 3 bloques).
- [ ] En móvil real (o emulación) `navigator.share` ofrece WhatsApp con PDF adjunto; en desktop descarga + abre `wa.me`.
- [ ] Upsell muestra números reales de la sesión y el CTA registra `upsell_click`.
- [ ] Recorrido completo end-to-end en incógnito: email → Excel → canvas → asignar → PDF por WhatsApp → upsell. Sin errores en consola.

---

## 8. Fuera de alcance (NO hacer, aunque parezca fácil)

- WhatsApp Business API / two-way / tracking de lectura.
- Tocar, leer o escribir `public.obras`, `public.tareas`, `public.socios`, etc.
- Promoción automática obra_check → obra real (V2).
- Bibliotecas `grows_lib_*` y agregación de patrones (V2; por eso ya guardamos `consent_patrones`).
- Adapter de Monday (V2; CSV lo cubre parcialmente).
- Login/registro dentro de Obra Check.
- Guardar el archivo original subido.
- Montos, precios o presupuestos numéricos (el RFQ va con columna vacía a propósito).

## 9. Env vars

- `N8N_WEBHOOK_URL` / `N8N_WEBHOOK_TOKEN` (ya usadas por `grows_webhook.ts`) — opcional; sin ellas el chat degrada a fallback.
- Supabase service role: ya configurado vía `createServiceSupabaseClient`.

## 10. Dependencias nuevas permitidas

- `xlsx` (SheetJS) en `apps/web` para el adapter de Excel/CSV.
- `@xmldom/xmldom` SOLO si se necesita parsear XML server-side (preferir client-side y evitarla).
- Nada más sin justificación escrita en el PR.
