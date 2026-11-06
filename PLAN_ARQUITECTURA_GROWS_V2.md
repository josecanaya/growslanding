# PLAN DE ARQUITECTURA GROWS V2
## Estados + Transformaciones sobre el sistema de Tareas existente

> **Estado del documento:** PROPUESTA — NO IMPLEMENTADA.
> Ninguna línea de código fue modificada para producirlo.
> Fecha de auditoría: 2026-11-06 · Rama: `claude/grows-technical-audit-plan-qjsdh9` · Commit base: `0b7d096`

### Convención de evidencia

| Marca | Significado |
|---|---|
| **[V]** | **Verificado**: leí el archivo y cito línea/símbolo concreto. |
| **[I]** | **Inferencia**: deducción razonada a partir del código, no comprobada contra la base real. |
| **[?]** | **Pendiente de verificar en el entorno desplegado** (requiere acceso a Supabase o a un deploy). |

**Limitación de esta auditoría:** el repositorio no tiene `node_modules` instalado, por lo que **no pude ejecutar `vitest`, `tsc` ni `next build`**. Todas las afirmaciones sobre comportamiento en runtime están marcadas **[I]** o **[?]**. Tampoco tengo acceso a la base Supabase real: el esquema que describo proviene de `apps/web/lib/types/supabase.gen.ts` y de las migraciones versionadas, y demuestro más abajo que **ese archivo está desactualizado respecto de la base real**.

---

## 1. Resumen ejecutivo

### Lo que encontré

Grows **ya tiene** las dos capas que pedís. No hay que construirlas desde cero. El problema no es ausencia de modelo: es que **las dos capas están colapsadas en la misma fila de la misma tabla, y conviven por bifurcación (`graph_mode`) en vez de por composición.**

Cinco hallazgos que determinan todo el plan:

**1. Transformación ES Tarea, literalmente, en el código.** `apps/web/lib/types/canvasMultinivel.ts:26-28` **[V]**:

```ts
export function isCanvasTransformacionNode(n: Pick<CanvasNode, 'type'>): boolean {
  return n.type === 'tarea';
}
```

Esto es exactamente la regla de arquitectura que pediste evitar. Un nodo de canvas con `type='tarea'` es, según el contexto, un ítem de planificación clásico o una transformación A→B.

**2. La relación 1→N transformación/tareas YA es posible en la base, y la mitad del código ya la asume.** La foreign key `tareas_canvas_node_id_fkey` tiene `isOneToOne: false` (`supabase.gen.ts:2602-2609`) **[V]**, y el agregador lee N tareas por transformación (`aggregateExecution.ts:19`, `tasks.filter((t) => t.canvas_node_id === node.id)`) **[V]**. **Lo único 1:1 es el publicador**: `publicar-tareas/route.ts` y `activarEjecucionTransformacion.ts` hacen un upsert de exactamente una tarea por nodo **[V]**. → **No hace falta crear `transformation_tasks`.** Detalle y contraargumentos en §6.3.

**3. Los dos modelos hoy son excluyentes, no paralelos.** `obras.graph_mode ∈ {'obra_plan','proyecto_vivo'}` **[V]** decide en qué mundo vive una obra. En `obra_plan` no hay estados; en `proyecto_vivo` sólo se publican transformaciones `transform_kind='ejecucion'` (`publicationContract.ts:13`) **[V]**. Pedís que convivan: eso es un cambio de semántica de `graph_mode`, no una tabla nueva.

**4. No existe forma humana de crear un Estado.** `grep "type: 'estado'"` da exactamente dos resultados, ambos en el orquestador LLM: `orquestador/proponerDesdeChat.ts:75` y `orquestador/proponerL0.ts:135` **[V]**. El editor de canvas (`CanvasObraEditor.tsx`, `CanvasLeftInspector.tsx`, 2.030 líneas entre ambos) **no ofrece crear ni editar estados** **[V]**. La capa de planificación sólo se puede poblar por chat.

**5. La cadena completa que querés ya funciona end-to-end — para un solo tipo de transformación.** `Estado A → Transformación → Tarea → Subtareas → Evidencia → Validación → Estado B` existe y está testeada (`productiveContract.test.ts`) **[V]**. Pero sólo para `transform_kind='ejecucion'`. Un estado como *"documentación de mampostería aprobada"* (que es `transform_kind='conocimiento'`) **nunca puede alcanzarse**, porque su transformación está bloqueada para publicación. Ése es el gap funcional real.

### La propuesta en una línea

**No crear tablas nuevas de dominio. Desdoblar `canvas_nodes.type` para que `transformacion` deje de llamarse `tarea`, levantar el 1:1 del publicador, y abrir un camino de certificación para transformaciones que no son de ejecución.** El costo total estimado son 2 columnas, 1 migración de datos sobre `canvas_nodes.type`, y ~18 archivos tocados — repartidos en 7 fases donde cada una deja el sistema funcionando.

### Lo que NO propongo

- No reescribir el Canvas. `canvasScope.ts` (225 líneas, puro, sin estado) es la mejor pieza del repo **[V]** y queda intacta.
- No tocar el sistema de tareas operativo. FSM, subtareas, evidencias, wallet, validación: cero cambios de comportamiento.
- No crear `project_states`, `transformations` ni `transformation_tasks`. Justificación en §6.
- No migrar a Prisma. Supabase queda canónico (§6.6). Prisma sale del `apps/web`.

### El riesgo que más me preocupa

**No es el modelo de datos. Es que no hay red de seguridad.** 27 archivos de test **[V]**, todos sobre canvas / proyecto-vivo / conocimiento / MCP. **Cero** sobre FSM de tareas, wallet, presupuestos, permisos o `publicar-tareas`. Tocar el publicador —que es exactamente lo que hay que tocar— sin tests sobre él es el escenario de mayor daño posible. Por eso la FASE 0 es tests, y no es negociable.

---

## 2. Arquitectura actual encontrada

### 2.0 Magnitudes

| Métrica | Valor | Fuente |
|---|---|---|
| Páginas Next (`page.tsx`) | 58 | `find apps/web/app -name page.tsx` **[V]** |
| Endpoints API (`route.ts`) | 120 | `find apps/web/app/api -name route.ts` **[V]** |
| Componentes `.tsx` | 311 | **[V]** |
| Módulos en `lib/` | 239 `.ts` | **[V]** |
| Tablas en Supabase (según types) | 49 + 1 vista + 5 RPC | `supabase.gen.ts` **[V]** |
| Archivos de test | 27 | **[V]** |
| Rutas API que usan `service_role` | 81 / 120 (68 %) | `grep -rl createServiceSupabaseClient apps/web/app/api` **[V]** |

### 2.1 Las tres fuentes de esquema

| Fuente | Qué es | Estado real |
|---|---|---|
| `prisma/schema.prisma` (raíz) | SQLite, 4 modelos: `Obra` + 3 de roadmap interno | **Herramienta de gestión interna, no producto.** `provider = "sqlite"`, `url = "file:./dev.db"` **[V]** |
| `apps/web/prisma/schema.prisma` | PostgreSQL, 8 modelos | **Espejo degradado y obsoleto de Supabase.** Ver 2.1.1 |
| **Supabase** | 49 tablas | **Canónico de hecho.** Todo el producto escribe acá **[V]** |

#### 2.1.1 La deuda Prisma, cuantificada

`apps/web/prisma/schema.prisma` modela `Tarea` con **10 campos** (`prisma/schema.prisma:39-55`) **[V]**. La tabla real `tareas` en Supabase tiene **35 columnas** (`supabase.gen.ts:2490-2527`) **[V]**. Faltan en Prisma, entre otras: `canvas_node_id`, `elemento_id`, `responsable_socio_id`, `cuadrilla_id`, `bloques_planificados`, `dias_presupuesto`, `es/ef/ls/lf/float`, `is_critical`, `source`, `published_from_canvas_at`, y el enum `tarea_estado_oficial` (Prisma declara `estado String @default("pendiente")`).

Consecuencia concreta y verificable: `lib/services/cpm.service.ts:37-50` hace

```ts
prisma.tarea.findMany({ where: { elemento: { obraId } }, include: { precedencias: ... } })
```

`Tarea` **no tiene** relación `elemento` ni `precedencias` en el schema **[V]**. Ese código no compila contra el cliente generado, o si compila por el cast `as any` de la línea 37, falla en runtime **[I]**.

Siete módulos importan `@prisma/client` **[V]**:

| Módulo | ¿Tiene consumidores? |
|---|---|
| `lib/services/cpm.service.ts` | **Ninguno** **[V]** |
| `lib/services/obra.service.ts` | **Ninguno** **[V]** |
| `lib/services/tarea.service.ts` | sólo `tareas.service.ts` **[V]** |
| `lib/services/tareas.service.ts` | **Ninguno** **[V]** |
| `lib/services/suscripcion.service.ts` | sólo `obra.service.ts` **[V]** |
| `lib/services/evento.service.ts` | **`/api/eventos`** ← vivo **[V]** |
| `lib/services/notificacion.service.ts` | **`/api/notificaciones/[id]/leer`** ← vivo **[V]** |

Es decir: de los 7, **5 forman un subgrafo muerto cerrado sobre sí mismo**, y sólo 2 tienen un consumidor real. `apps/web/package.json` ejecuta `prisma generate` en el `build` **[V]**.

#### 2.1.2 `supabase.gen.ts` está desactualizado — en ambas direcciones

Esto invalida el archivo como fuente de verdad y es importante para el plan:

- **Columnas en los types que nadie usa:** `canvas_nodes.t_value`, `t_components`, `t_formula_id` aparecen en `supabase.gen.ts:272-274` **[V]** y `grep` sobre todo `apps/web` (excluyendo el propio archivo generado) devuelve **cero** referencias **[V]**. Son columnas de una iteración anterior del modelo (energía/fórmula) que quedaron en la base.
- **Columnas que el código escribe y los types no conocen:** `canvasSupabaseMapper.ts:253-256` escribe `energy_unit_id`, `energy_quantity`, `capital_amount`, `capital_currency`, y la RPC `save_canvas_snapshot` las inserta explícitamente **[V]** — pero `grep energy_unit_id supabase.gen.ts` devuelve **0** **[V]**.
- **RPCs ausentes:** `read_canvas_snapshot` / `save_canvas_snapshot` (migración `20260909045717`) no figuran en la sección `Functions` de los types **[V]**.

→ `supabase.gen.ts` fue generado **antes** de las migraciones de 2026-09-09. Regenerarlo es precondición de cualquier trabajo de modelo.

### 2.2 El grafo productivo: `canvas_nodes` / `canvas_edges`

**`canvas_nodes`** (`supabase.gen.ts:247-345`) **[V]** — una sola tabla polimórfica. Columnas agrupadas por rol:

| Grupo | Columnas | Capa conceptual |
|---|---|---|
| Identidad / contención | `id`, `obra_id`, `org_id`, `parent_id`, `sort_order`, `type`, `title`, `description` | mixta |
| Contexto espacial | `type ∈ {etapa, planta, sector, ambiente}` + `metadata.level`, `metadata.tipoLabel` | **A — contexto** |
| Grafo productivo | `type ∈ {estado, tarea}`, `transform_kind`, `from_node_id`, `to_node_id`, `graph_status` | **B — proceso** |
| Ejecución (planificada) | `planned_duration_days`, `is_critical`, `progress`, `status`, `budget_group_id` | **C — ejecución** |
| Actor (intención) | `executor_kind`, `executor_ref` | **B/C** |
| Economía | `energy_*`, `capital_*` | B |
| Importación | `project_source`, `project_uid`, `project_outline_*` | auditoría |
| Huérfanas | `t_value`, `t_components`, `t_formula_id` | **muertas [V]** |

`type` es `string` libre, **sin enum en base** **[V]**. Los seis valores legales están sólo en TypeScript: `CanvasNivelTipo = 'etapa'|'planta'|'sector'|'ambiente'|'tarea'|'estado'` (`canvasMultinivel.ts:5-11`) **[V]**.

**`canvas_edges`** (`supabase.gen.ts:169-196`) **[V]**: `source_node_id`, `target_node_id`, `type`, `is_critical`, `lag_days`, `metadata`. Sin restricción de tipo de extremo.

El vocabulario de relaciones y su semántica están bien resueltos y son reutilizables tal cual — `lib/proyecto-vivo/relationSemantics.ts:5-12` **[V]**:

```ts
precede:              { temporal: true,  blocks: true,  reverse: false }
depende_de:           { temporal: true,  blocks: true,  reverse: true  }
habilita:             { temporal: false, blocks: true,  reverse: false }
requiere:             { temporal: false, blocks: true,  reverse: true  }
afecta:               { temporal: false, blocks: false, reverse: false }
se_ejecuta_mediante:  { temporal: false, blocks: false, reverse: false }
```

Nota: `se_ejecuta_mediante` **está declarado y no se usa en ninguna parte** **[V]**. Es, conceptualmente, exactamente la relación Transformación→Tarea que pedís — pero no puede usarse porque las tareas operativas **no son nodos del canvas**. Lo señalo porque es una señal de que alguien ya pensó este problema.

### 2.3 Persistencia del canvas: snapshot atómico con revisión

`supabase/migrations/20260909045717_safe_canvas_snapshot.sql` **[V]**. Es la pieza más sólida del repositorio y **condiciona todo el plan**:

- `read_canvas_snapshot(obra_id, org_id)` y `save_canvas_snapshot(obra_id, org_id, expected_revision, snapshot)`.
- **Control de concurrencia optimista**: `revision` en `obras.canvas_ui`; `40001` si hay conflicto.
- **Reemplazo total**: `delete from canvas_nodes where obra_id = p_obra_id and id not in (snapshot)` **[V]**.
- Valida referencias internas (`parent_id`, `from_node_id`, `to_node_id`, `budget_group_id`) **antes** de escribir.
- Protege de sobrescritura por el cliente los campos de ejecución: `status`, `progress` y `graph_status` **no se pisan si existe una `tarea` con ese `canvas_node_id`** **[V]**.
- `revoke all ... from public, anon, authenticated; grant execute ... to service_role` **[V]**.

**Dos consecuencias críticas para el plan:**

1. Cualquier entidad nueva que viva **dentro** de `canvas_nodes` queda cubierta por este reemplazo total gratis. Cualquier tabla nueva que **referencie** `canvas_nodes` tiene que entrar en el `DELETE` y en la validación de la RPC — es decir, **crear una tabla nueva significa reescribir esta función de 90 líneas**. Es el argumento técnico más fuerte contra `transformations` / `project_states` como tablas.
2. `tareas.canvas_node_id` tiene FK a `canvas_nodes` **[V]**. Si el snapshot borra un nodo que tiene tareas publicadas, el `DELETE` falla (o cascadea) según la cláusula `ON DELETE`, **que no puedo ver desde el repo**. **[?] Verificar en la base: `ON DELETE` de `tareas_canvas_node_id_fkey`.** Si es `RESTRICT`/`NO ACTION`, borrar una transformación publicada rompe todo el guardado del canvas con un error opaco.

### 2.4 El puente planificación → ejecución

`apps/web/app/api/obras/[id]/canvas/publicar-tareas/route.ts` (≈560 líneas) **[V]**. Dos caminos:

**Camino legacy (`obra_plan`)**, líneas ~455-520: por cada `canvas_nodes.type='tarea'` sin `transform_kind`, `TareaMetadataService.upsertDesdeCanvas` crea/actualiza **una** fila en `tareas`, usando un elemento sintético único por obra llamado `'Canvas operativo'` (`ensureElementoCanvasOperativo`, línea ~118) **[V]**.

**Camino moderno (`proyecto_vivo`)**, línea ~440: delega en `activarEjecucionTransformacion()`.

Después, traduce `canvas_edges` de tipo temporal a `tarea_precedencias` (`FINISH_TO_START`) entre las tareas recién publicadas **[V]**.

`activarEjecucionTransformacion.ts` (185 líneas) **[V]** hace, para **una** transformación: valida contrato (`publicationBlockReason`), resuelve `elemento_id`, upsert de **una** tarea, y crea precedencias.

**Acá está el 1:1.** Es una decisión del publicador, no del esquema.

**Hallazgo lateral — `elementos` ya se usa como proxy de Estado.** `resolveElementoEjecucion.ts:18-50` **[V]**: en modo `proyecto_vivo`, el `elemento_id` de la tarea se resuelve **a partir del estado destino** (`to_node_id`), creando un `elemento` con el título del estado. El sistema ya está buscando una entidad "estado" y está usando `elementos` como suplente. Esto confirma la necesidad del modelo que proponés, y también que `elementos` quedó con dos significados.

### 2.5 El sistema operativo de tareas (el que se preserva)

| Tabla | Rol | Columnas clave |
|---|---|---|
| `tareas` | Unidad operativa | `estado` (enum `tarea_estado_oficial`), `canvas_node_id`, `elemento_id`, `responsable_socio_id`, `cuadrilla_id`, `bloques_planificados`, `dias_presupuesto`, `costo_presupuestado`, CPM (`es/ef/ls/lf/float/is_critical`) |
| `tareas_subtareas` | Bloques / checklist ejecutable | `bloque_index`, `orden`, `estado`, `socio_id`, `presupuesto_id`, `evidencia_obligatoria`, `evidencia_cargada`, `evidencia_url`, `video_url`, `monto_estimado`, `monto_validado`, `validado_por`, `validado_en_obra_*` |
| `tarea_precedencias` | Dependencias de ejecución | `tarea_id`, `depende_de`, `lag_dias`, `tipo_dependencia` |
| `tareas_presupuestos` | Oferta del socio por tarea | `socio_id`, `monto`, `cantidad`, `unidad`, `estado` |
| `tareas_eventos` | Historial FSM | `estado_anterior`, `estado_nuevo`, `actor_tipo`, `metadata` |
| `tareas_estados` | **Duplicado legacy** del anterior | mismas columnas menos `metadata` **[V]** |
| `eventos` + `media` | Evidencia canónica + auditoría | `tipo`, `checklist`, `gps_lat/lon`, `has_nc`, `snapshot_json` / `path`, `kind` |
| `canvas_task_checklist_items` | Checklist **de planificación** | `task_node_id`, `title`, `done` |

**FSM** — `lib/services/tarea-fsm.service.ts` (≈330 líneas) **[V]**. Matriz por rol, líneas 15-29:

```
SOCIO:   pendiente→en_progreso | en_progreso→para_validar | rechazada→en_progreso
CLIENTE: para_validar→{validada, rechazada} | rechazada→en_progreso
```

Guardas verificadas **[V]**: `validada` exige todas las subtareas en `validado`; `en_progreso` exige socio no suspendido y máximo 2 tareas activas; sólo CLIENTE rechaza. Cada transición escribe en **tres** lugares (`tareas_eventos`, `tareas_estados` legacy, `eventos`) y después llama a `syncProyectoVivoGraphFromTareaEstado` **[V]**.

Ese último paso es la conexión ejecución → grafo, y **ya está escrita para N tareas** (`aggregateExecution.ts`) **[V]**.

**Normalización de estados legacy** — `tarea-fsm.service.ts:31-56` mapea **21 etiquetas históricas** a los 5 oficiales (`propuesta`, `presupuestada`, `asignada`, `activa`, `en_ejecucion`, `finalizado`, `terminada`, `aprobado`, …) **[V]**. Más `estados-core.ts` con un segundo normalizador para bloques **[V]**. Es deuda real pero **funcional y defensiva**: no tocar en este plan.

### 2.6 Presupuestos, pliegos y bolsa

`canvas_budget_groups` **[V]**: `status` (borrador / listo_para_enviar / aprobado / aprobado_parcial / enviado), `pliego_publicado_at`, `bolsa_publicada`, `publicado_a_agenda`, `change_window_status`, `scheduled_socio_id`.

**`canvas_budget_group_tasks`** **[V]** — tabla de unión `(obra_id, org_id, budget_group_id, task_node_id)`. **Este es el precedente exacto del patrón que pedís para `transformation_tasks`**, y por eso es importante: existe, funciona, está en la RPC de snapshot, y `resolveTaskNodeIdsForBudgetGroup` (`lib/canvas/budgetGroupTasks.ts:3-41`) **[V]** tiene que leer **dos** fuentes y unirlas porque el mismo vínculo está duplicado en `canvas_nodes.budget_group_id`. Es la demostración empírica, dentro de este mismo repo, de lo que cuesta mantener un vínculo en dos lugares.

`evaluarBloqueoPublicacionPliego` (`lib/canvas/budgetGroupPublish.ts`) **[V]** es lógica de negocio pura, bien aislada, sin tests. Candidata natural a servicio para agentes.

### 2.7 Wallet y economía

`wallet_saldos` / `wallet_movimientos` (socio y org), `cliente_wallets` / `cliente_wallet_movimientos` (reserva→liberación por tarea), `escrow_transacciones`, `socio_retiros`, `socio_metodos_retiro`, `socio_suspensiones` **[V]**. Cinco RPC de wallet cliente con nombre explícito (`cliente_wallet_reservar_tarea`, `cliente_wallet_liberar_tarea`, …) **[V]**.

**Toda la economía cuelga de `tarea_id`** (`cliente_wallet_movimientos.tarea_id`, `wallet_movimientos.tarea_id`, `escrow_transacciones`) **[V]**. Esto es correcto y **no debe moverse a transformación**: el dinero se mueve contra trabajo ejecutado y validado, no contra planificación. Lo registro explícitamente porque es una tentación obvia al agregar la capa superior.

### 2.8 Actores

| Entidad | Qué es | Observación |
|---|---|---|
| `socios` | persona **o** empresa | **No hay campo que distinga cuál** **[V]**: `nombre`, `email`, `telefono`, `especialidad`, `estado`, `user_id`, `public_codigo` |
| `cuadrillas` + `cuadrilla_socios` | Cuadrilla por org, `obra_id` opcional, con `rol_en_cuadrilla` | **[V]** |
| `tareas.responsable_socio_id` / `cuadrilla_id` | Asignación de ejecución | **[V]** |
| `canvas_nodes.executor_kind` / `executor_ref` | Intención de planificación: `humano\|empresa\|agente\|sin_asignar` | `executor_ref` es `string` sin FK ni formato definido **[V]** |
| `leader_invites` | Coordinador invitado por email | **[V]** |

**Contradicción en el código:** `api/socios/[id]/tareas/route.ts:40-43` dice literalmente *"Las cuadrillas quedan obsoletas, las tareas se asignan directamente al socio"* **[V]** — mientras `api/tareas/[id]/asignar-cuadrilla/route.ts` existe y `tareas.cuadrilla_id` se sigue poblando **[V]**. Hay dos caminos vivos y contradictorios para asignar trabajo.

### 2.9 El canvas en pantalla

- `CanvasObraEditor.tsx` (934 líneas) + `CanvasLeftInspector.tsx` (1.096) + `ScopeCanvasPanel.tsx` (498) + `CanvasEditorProChrome.tsx` (647) **[V]**. Ruta real: `/cliente/tareas/[obraId]/editor`; `/cliente/proyectos/[obraId]/grafo` sólo redirige ahí **[V]**.
- `ProyectoVivoCanvas.tsx` + `EstadoVivoNode.tsx` + `TransformacionVivoNode.tsx` **[V]**: el render A→T→B, alimentado por `proyectoVivoFlow.ts` (179 líneas) **[V]**.
- **`lib/canvas/canvasScope.ts`** (225 líneas) **[V]**: módulo puro, sin estado, con la regla fundacional documentada — `parentId` = contención y **nada más**; las relaciones productivas viven en `edges` y **pueden cruzar scopes**. Clasifica cada arista respecto del scope visible (`directa` / `agregada` / `externa` / `interna` / `fuera`). **Esta pieza ya separa correctamente contención de proceso.** Se conserva íntegra.

### 2.10 Agentes: MCP, bridge, worker

- `app/api/mcp/route.ts` — MCP sobre HTTP con `@modelcontextprotocol/sdk` **[V]**.
- `lib/mcp-grows/tools.ts` — 4 herramientas: `listar_obras_vivas`, `leer_horizonte`, `proponer_paso`, `anotar_hilo` **[V]**. **La separación lectura / borrador / aprobación ya está bien hecha**: `proponer_paso` escribe `metadata.orquestador = { origen:'agente', estado:'pendiente' }` y `publicationBlockReason` **bloquea la publicación hasta que un humano acepta** (`publicationContract.ts:11`) **[V]**. Además exige `base_revision` + `idempotency_key` **[V]**.
- **Pero la autenticación es monousuario:** `assertMcpBearer` compara contra un **único** `GROWS_MCP_TOKEN` de entorno, y `orgFilter()` devuelve un **único** `GROWS_MCP_ORG_ID` de entorno (`createServer.ts:31-43`, `tools.ts:96-100`) **[V]**. No hay OAuth, ni token por usuario, ni resolución de org por identidad. Quien tenga el token ve y escribe en **esa** organización.
- `bridge-tauri/` (instalador Rust/Tauri), `scripts/grows-bridge.mjs`, `deploy/cloud-agent-poc/` (worker EC2), `grows_bridge_devices` / `grows_bridge_jobs` **[V]**: toda la cadena "Grows manda trabajo a un Codex/Cursor en la PC del usuario".

### 2.11 Zonas muertas detectadas

| Qué | Evidencia |
|---|---|
| `components/obra-check/**` (18 componentes) | **Ninguna página los importa** **[V]**. Tablas `obra_check_*` (11) existen en la base. |
| `app/tareas/page.tsx` | `const obrasMock: Obra[] = [...]` — datos inventados **[V]** |
| `app/tareas/[id]/page.tsx`, `[id]/editor`, `app/obras/[id]/timeline` | contienen `mock` **[V]** |
| `lib/mockUser.ts`, `lib/mocks/*` (5 archivos) | **[V]** |
| `lib/fsm.ts` | Tercer vocabulario de estados (`pendiente/en_ejecucion/finalizado/validado`), sin relación con `tarea_estado_oficial` **[V]** |
| `canvas_nodes.t_value / t_components / t_formula_id` | 0 referencias en código **[V]** |
| `tareas_estados` | Duplicado exacto de `tareas_eventos`, escrito en paralelo **[V]** |
| `enum tarea_estado` (legacy, `en_ejecucion/finalizado`) | coexiste con `tarea_estado_oficial`; `tareas.estado` usa el oficial **[V]** |
| `lib/tareas/infrastructure/tareas.repository.ts` | **`agentDebugLog()` activo en producción**: `appendFileSync(join(process.cwd(), 'debug-41b243.log'))` en 5 puntos del camino caliente de creación de tareas, con `runId:'post-fix'`, `hypothesisId:'H2'` **[V]** |
| `lib/tareas/tareas-faltantes.json`, `tareas-generadas-nuevas.json` | datos sueltos en `lib/` **[V]** |
| `dev/seeds-legacy/`, `dev/migrations/*.py` (6 scripts Python de edición de archivos) | **[V]** |

---

## 3. Problemas detectados

Ordenados por impacto sobre el objetivo.

### P1 — Transformación y Tarea son el mismo tipo · CRÍTICO

`isCanvasTransformacionNode(n) => n.type === 'tarea'` **[V]**. Todo el código de proyecto-vivo (`computeFrontera`, `proyectoVivoFlow`, `aggregateExecution`, `loadGrafoSnapshot`) discrimina por `type === 'tarea'`. Un nodo `tarea` es transformación o ítem de planificación según `graph_mode` y según si `transform_kind` está seteado. La regla de arquitectura que pediste está violada en la definición misma del tipo.

### P2 — Los modelos son excluyentes, no paralelos · CRÍTICO

`obras.graph_mode` bifurca. `publicationBlockReason(node, nodes, projectVivo)` **[V]** aplica reglas distintas según el modo. Una obra `obra_plan` no puede tener estados; una `proyecto_vivo` publica sólo `transform_kind='ejecucion'`. **Pedís convivencia, el código tiene un interruptor.**

### P3 — Las transformaciones no-ejecución no pueden cerrar un estado · ALTO · gap funcional

`publicationContract.ts:13` **[V]**:

```ts
if (node.transform_kind !== 'ejecucion') return 'Solo se publican transformaciones de ejecución.';
```

Y `aggregateExecution.ts:12`: `if (!states.length ...) return 'propuesta'` — **cero tareas nunca certifica** **[V]**. Combinados: una transformación `conocimiento` o `coordinacion` no puede publicarse, por lo tanto no tiene tareas, por lo tanto **nunca pasa a `realizada`**, por lo tanto su estado destino **nunca pasa a `alcanzado`**.

De tus ejemplos de estados, los que esto bloquea hoy:
- *"documentación de mampostería aprobada"* → `conocimiento` → **inalcanzable**
- *"frente de trabajo liberado"* → `coordinacion` → **inalcanzable**
- *"materiales disponibles en obra"* → `coordinacion` → **inalcanzable**
- *"muro construido"* → `ejecucion` → ✅ funciona

**Éste es el problema funcional más grave del sistema actual**, y no es de modelado: es una regla de negocio demasiado estrecha.

### P4 — El publicador impone 1:1 contra un esquema que permite 1:N · ALTO

Ya detallado. La asimetría es llamativa: el **lector** (`aggregateExecution`) asume N, el **escritor** asume 1. Tu caso de uso (una transformación "Ejecutar mampostería PB" con 6 tareas) **no es expresable hoy** aunque la base lo soporte.

### P5 — No hay forma humana de crear un Estado · ALTO

Sólo el orquestador LLM crea nodos `estado` **[V]**. La capa de planificación es inaccesible sin pasar por chat. Esto choca de frente con "menos dependencias operativas" y con el inversor/proyectista que quiere armar el grafo a mano.

### P6 — Tres vocabularios de estado sin frontera declarada · ALTO

| Vocabulario | Dónde vive | Valores |
|---|---|---|
| Operativo tarea | `tareas.estado` (enum) | pendiente, en_progreso, para_validar, validada, rechazada |
| Operativo bloque | `tareas_subtareas.estado` (enum) | pendiente, en_progreso, para_validar, **validado**, **rechazado** |
| Productivo | `canvas_nodes.graph_status` (text) | alcanzado, fantasma / propuesta, en_curso, realizada, bloqueada |
| Contenedor | `canvas_nodes.status` (text) | pendiente, en_curso, completado, bloqueado |
| **+ 2 legacy** | `enum tarea_estado`, `lib/fsm.ts` | en_ejecucion, finalizado, validado |

Problemas concretos: (a) `canvas_nodes.status` guarda el estado operativo copiado para `type='tarea'` y el estado de contenedor para los demás — **una columna, dos significados** (`canvasSupabaseMapper.ts:218-221`) **[V]**; (b) tarea usa `validada` y bloque usa `validado`, diferencia de una letra con `.eq()` contra enums distintos, origen documentado de bugs en `estados-core.ts` **[V]**; (c) `'fantasma'` es jerga interna para "estado esperado pero no alcanzado" y aparece en la UI.

### P7 — Las relaciones no están tipadas por extremo · MEDIO

`canvas_edges` acepta cualquier par. No hay nada que impida `estado → estado` con `precede`, ni `ambiente → tarea` con `requiere`. `normalizeProductiveRelation` dice explícitamente *"Unknown relations never block"* **[V]** — falla abierto. En un grafo A→T→B eso permite construir grafos sin sentido que después el agregador interpreta de forma impredecible.

### P8 — Seguridad: tenencia por header del cliente · CRÍTICO

**8 rutas** toman la organización de un header que escribe el navegador, usando `service_role` (que ignora RLS) **[V]**:

`/api/eventos`, `/api/mensajes`, `/api/notificaciones`, `/api/notificaciones/[id]/leida`, `/api/cuadrillas/[id]/socios`, `/api/invitaciones/crear`, `/api/socios/[id]/tareas`, `/api/socios/invitar`.

`api/eventos/route.ts:7-15` **[V]** es el caso puro:

```ts
const organizacionId = request.headers.get('x-organizacion-id');
if (!organizacionId) return 400;
// ...no hay getUser() en todo el archivo
```

Cualquiera que cambie el header lee eventos de otra organización. `/api/socios/[id]/tareas` al menos valida que el socio pertenezca a la org **[V]** — pero no valida que **quien pregunta** pertenezca a esa org.

Relacionado: **81 de 120 rutas usan `service_role`** **[V]**, es decir, la autorización es enteramente de aplicación. Las migraciones versionadas sólo habilitan RLS en `grows_bridge_devices` y `grows_bridge_jobs` **[V]**. **[?] El estado real de RLS sobre las 47 tablas restantes no es verificable desde el repo.** Si RLS está apagada y 68 % de las rutas la bypasean, entonces cada omisión de chequeo es una fuga directa.

Caso menor pero real: `/api/socio/subtareas/[id]` autentica pero **no verifica que la subtarea pertenezca al socio ni a su org** — `SubtareasRepository.findById(id)` a secas **[V]**.

### P9 — MCP monousuario y monoorganización · ALTO (bloquea AaaS)

Un token compartido + una org fija por variable de entorno **[V]**. El diseño de herramientas es correcto; **el modelo de identidad no existe**. No es base para "cada arquitecto conecta su cuenta".

### P10 — Sin red de tests sobre el núcleo · CRÍTICO para ejecutar este plan

27 tests **[V]**, cobertura:

| Área | Tests |
|---|---|
| canvas / scope / mapper / templates / XML | 8 |
| proyecto-vivo (frontera, CPM, agregación, orquestador) | 11 |
| conocimiento / MCP | 5 |
| bridge | 2 |
| project XML | 1 |
| **FSM de tareas** | **0** |
| **Wallet / escrow** | **0** |
| **Presupuestos / pliegos** | **0** |
| **Permisos / tenencia** | **0** |
| **`publicar-tareas`** | **0** |

Las áreas con 0 tests son exactamente las que hay que tocar o proteger.

### P11 — Esquema desincronizado y Prisma fantasma · MEDIO

§2.1.1 y §2.1.2. Trabajar sobre el modelo sin resolver esto es trabajar a ciegas.

### P12 — Instrumentación de depuración en producción · BAJO pero inmediato

`agentDebugLog` escribiendo a `process.cwd()` en el camino de creación de tareas **[V]**. En Vercel el FS es de sólo lectura, así que el `try/catch` lo traga **[I]** — pero es ruido en el camino más caliente y una fuga de ids a disco en cualquier deploy con FS escribible.

### P13 — Caminos duplicados en la UI · MEDIO

| Función | Caminos vivos |
|---|---|
| Listar obras | `/obras`, `/cliente/obras` **[V]** |
| Crear obra | `/obras/nueva`, `/cliente/obras/nueva`, `/cliente/proyectos/nuevo` (desde idea) **[V]** |
| Ver tareas | `/tareas` (**mock**), `/cliente/tareas`, `/cliente/tareas/resumen` **[V]** |
| Timeline | `/obras/[id]/timeline`, `/cliente/obras/[obraId]/timeline` **[V]** |
| Wallet | `/api/wallet/*`, `/api/cliente/wallet/*`, `/api/socio/wallet/*` **[V]** |
| Aprobar presupuesto | `/api/presupuestos/[id]/aprobar`, `/api/cliente/presupuestos/[id]/aprobar`, `/api/socios/[id]/aprobar-presupuesto`, `/api/presupuestos/aprobar-socio` **[V]** |
| Historial FSM | `tareas_eventos` **y** `tareas_estados` **[V]** |

---

## 4. Arquitectura objetivo

### 4.1 Principio rector

> **Una obra tiene un solo grafo. Ese grafo tiene tres capas de nodos con semántica distinta y reglas de relación distintas. La ejecución no vive en el grafo: vive en `tareas`, y se engancha al grafo por una referencia explícita.**

### 4.2 Las tres capas y dónde viven

| Capa | Conceptos | Dónde vive | Cambio |
|---|---|---|---|
| **A — Contexto** | etapa, planta, sector, ambiente | `canvas_nodes.type ∈ {etapa, planta, sector, ambiente}` + `parent_id` | **Ninguno** |
| **B — Grafo productivo** | Estado, Transformación | `canvas_nodes.type ∈ {estado, transformacion}` + `canvas_edges` | **`type='transformacion'` nuevo** |
| **C — Ejecución** | Tarea, Subtarea, Evidencia, Validación, Pago | `tareas`, `tareas_subtareas`, `eventos`/`media`, wallet | **Ninguno de comportamiento** |

**El puente B↔C es una sola referencia:** `tareas.transformacion_node_id → canvas_nodes.id`, con cardinalidad **N tareas → 1 transformación**.

**El puente A↔B es la contención que ya existe:** una transformación o un estado puede colgar de un `ambiente` vía `parent_id`, y `canvasScope.ts` ya proyecta sus relaciones al nivel visible sin cambios.

### 4.3 Las cuatro reglas que el sistema debe empezar a garantizar

1. **Un Estado no se declara: se deriva.** `graph_status` de un estado es función de sus transformaciones entrantes. Ya lo hace `aggregateGraphExecution` **[V]**; hay que extenderlo a transformaciones no-ejecución.
2. **Una Transformación sin tareas no está realizada, salvo que tenga una vía de certificación declarada.** Hoy la regla es "cero tareas → `propuesta`", lo cual es correcto para ejecución y **bloqueante** para conocimiento/coordinación. Ver §4.4.
3. **Un estado operativo nunca es un estado productivo.** `tareas.estado` jamás se copia a `canvas_nodes.graph_status`: se **agrega**.
4. **Las relaciones son legales sólo entre tipos compatibles.** Matriz en §4.5.

### 4.4 Cómo se certifica una transformación que no es de ejecución

Éste es el único agregado conceptual real del plan, y resuelve P3.

Propongo un campo **`modo_certificacion`** en la transformación, con tres valores:

| Modo | Quién cierra la transformación | Caso típico |
|---|---|---|
| `por_tareas` (default, = hoy) | Todas las tareas vinculadas en `validada` | "Ejecutar mampostería PB" |
| `por_aprobacion` | Un actor con permiso declara `realizada`, con evidencia obligatoria | "Aprobar documentación de mampostería" |
| `por_evidencia` | Se registra evidencia del tipo requerido y alguien la valida | "Materiales disponibles en obra" (remito + foto) |

En los tres casos el cierre produce un `evento` con `tipo='certificacion_transformacion'`, `snapshot_json` con las fuentes, y `media` asociada. **No hace falta una tabla nueva: `eventos` ya tiene `obra_id`, `tarea_id` (nullable), `tipo`, `checklist`, `snapshot_json`, `has_nc`, `pdf_path` y relación a `media`** **[V]**. Sólo le falta poder apuntar a un nodo del grafo (§6.4).

Con esto, *"documentación de mampostería aprobada"* pasa a ser alcanzable sin inventar tareas falsas para los albañiles — que es exactamente lo que pasaría si forzáramos `por_tareas` para todo.

### 4.5 Matriz de relaciones legales (a implementar como validación, no como tabla)

| origen \ destino | estado | transformacion | contexto (etapa/planta/…) |
|---|---|---|---|
| **estado** | `precede` ⚠️ sólo entre hitos | `habilita`, `requiere` | — |
| **transformacion** | *(vía `to_node_id`, no vía edge)* | `precede`, `depende_de`, `afecta` | — |
| **contexto** | — | — | `precede` (macro) |

Reglas:
- La relación A→T→B **canónica** no es un edge: son `from_node_id` / `to_node_id` de la transformación **[V]**. Los edges son **relaciones extra** (precedencias entre transformaciones, habilitaciones cruzadas).
- `se_ejecuta_mediante` **se retira del vocabulario de `canvas_edges`**: la relación T→Tarea pasa a ser la columna `tareas.transformacion_node_id`, no un edge (las tareas no son nodos).
- Las relaciones ilegales **no se borran**: se marcan y se reportan. Falla visible, no falla silenciosa.

### 4.6 Lo que explícitamente NO cambia

- La FSM de tareas y sus guardas.
- Subtareas, bloques, evidencia, validación en obra.
- Wallet, escrow, reservas, liquidaciones. **Todo sigue colgando de `tarea_id`.**
- Presupuestos y pliegos (`canvas_budget_groups`). Siguen agrupando **task nodes**; en el modelo nuevo, siguen agrupando transformaciones. Compatible sin tocar nada.
- `canvasScope.ts`, la RPC de snapshot, el control de revisión.
- El contrato de propuesta del agente (`metadata.orquestador`, aceptación humana obligatoria).

---

## 5. Modelo conceptual

```
OBRA  (obras)
│
├── CONTEXTO  ─────────────────────────── canvas_nodes.type ∈ {etapa,planta,sector,ambiente}
│   ├── etapa          parent_id = null            «¿dónde / en qué fase?»
│   ├── planta         parent_id = etapa
│   ├── sector         parent_id = planta          contención pura (parent_id)
│   └── ambiente       parent_id = sector          NUNCA precedencia
│
├── GRAFO PRODUCTIVO  ─────────────────── canvas_nodes.type ∈ {estado,transformacion}
│   │                                     canvas_edges (relaciones extra)
│   │
│   │   «¿qué tiene que pasar y en qué orden?»
│   │
│   ├── Estado  [A]                       type='estado'
│   │     graph_status: esperado | alcanzado        ← DERIVADO, nunca declarado a mano
│   │     parent_id → ambiente/sector (opcional: dónde ocurre)
│   │     ej: «PB lista para mampostería»
│   │                 │
│   │                 │  from_node_id
│   │                 ▼
│   ├── Transformación                    type='transformacion'
│   │     transform_kind: conocimiento | coordinacion | ejecucion
│   │     modo_certificacion: por_tareas | por_aprobacion | por_evidencia
│   │     graph_status: propuesta | en_curso | realizada | bloqueada   ← DERIVADO
│   │     executor_kind / executor_ref     ← intención de actor
│   │     ej: «Ejecutar mampostería PB»
│   │                 │
│   │                 │  to_node_id
│   │                 ▼
│   └── Estado  [B]                       type='estado'
│         ej: «Mampostería PB ejecutada y validada»
│
│         ▲
│         │ tareas.transformacion_node_id   (N tareas → 1 transformación)
│         │ ── la ÚNICA costura entre planificación y ejecución ──
│         ▼
│
└── EJECUCIÓN  ───────────────────────── tareas, tareas_subtareas, eventos, media, wallet
    │
    │   «¿quién hace qué, hoy, en la obra?»
    │
    ├── Tarea                   tareas
    │     estado: pendiente|en_progreso|para_validar|validada|rechazada
    │     responsable_socio_id · cuadrilla_id · costo_presupuestado
    │     transformacion_node_id → canvas_nodes      ← NUEVO
    │     ej: «Levantar muros exteriores»
    │     │
    │     ├── Subtarea / bloque        tareas_subtareas
    │     │     estado · cantidad · unidad · monto_estimado
    │     │     evidencia_obligatoria · evidencia_url
    │     │
    │     ├── Presupuesto              tareas_presupuestos  (socio_id, monto)
    │     │
    │     ├── Evidencia                eventos + media  (foto/video/GPS/checklist)
    │     │
    │     ├── Validación               subtarea → tarea (FSM, rol CLIENTE)
    │     │
    │     └── Pago                     cliente_wallet_* / escrow / wallet_* (por tarea_id)
    │
    └── Actores                 socios · cuadrillas · cuadrilla_socios · leader_invites


FLUJO DE CERTIFICACIÓN (de abajo hacia arriba, nunca al revés)

  subtarea.validado ─┐
                     ├─► tarea.validada ─┐
  todas las subtareas┘                   │
                                         ├─► transformacion.realizada ─┐
  todas las tareas de la transformación ─┘   (o certificación directa) │
                                                                       ├─► estado B .alcanzado
  todas las transformaciones entrantes de B ───────────────────────────┘
  + todas las relaciones `blocks` entrantes cumplidas
```

**Lectura por rol:**

| Rol | Capa que usa | Pregunta que responde |
|---|---|---|
| Albañil / cuadrilla | **C** | ¿Qué hago hoy? ¿Dónde subo la foto? |
| Capataz / contratista | **C** (+ B de solo lectura) | ¿Qué está pendiente de validar? ¿Qué cobro? |
| Proyectista / promotor | **B** (+ A para ubicar) | ¿Qué tiene que pasar para liberar el frente? ¿Qué está bloqueando? |
| Inversor | **B** agregado | ¿En qué estado está la obra? ¿Qué se alcanzó? |
| Grows / agente | **A+B+C** | ¿Cuál es la frontera? ¿Qué debería ocurrir después? |

---

## 6. Modelo de datos propuesto

### 6.0 Resumen de cambios de esquema

**Total: 2 columnas nuevas, 1 ampliación de columna existente, 1 migración de datos. Cero tablas nuevas.**

### 6.1 `canvas_nodes` — desdoblar `type`

| Campo | Hoy | Propuesto | Cambio | Migración | Riesgo |
|---|---|---|---|---|---|
| `type` | `text` libre; `'tarea'` = transformación | agrega valor `'transformacion'` | Ampliar dominio | `UPDATE canvas_nodes SET type='transformacion' WHERE type='tarea' AND transform_kind IS NOT NULL` | **ALTO** |
| `modo_certificacion` | — | `text NOT NULL DEFAULT 'por_tareas'` | **Columna nueva** | Backfill por default | BAJO |
| `graph_status` | `text` | igual, valores documentados | Ninguno | — | — |
| `status` | dos significados | sólo contexto; se deja de escribir para transformaciones | Semántico | Ninguna (la RPC ya lo congela si hay tarea **[V]**) | MEDIO |
| `t_value`, `t_components`, `t_formula_id` | huérfanas | **DEPRECAR** | Marcar; borrar en fase posterior | — | BAJO |
| `executor_ref` | `text` sin formato | `text` con formato `{kind}:{uuid}` validado | Convención | Backfill si hay datos **[?]** | BAJO |

**Por qué `type='transformacion'` y no un campo derivado.** Pediste explícitamente que Transformación ≠ Tarea. Un helper `isTransformacion()` que siga mirando `type==='tarea'` deja la ambigüedad en la base, en las queries SQL, en el MCP y en cualquier consulta manual. Con un valor propio, `select * from canvas_nodes where type='transformacion'` dice la verdad.

**Por qué es ALTO riesgo.** `type='tarea'` aparece como literal en, al menos: `publicar-tareas/route.ts` (×4), `canvasSupabaseMapper.ts` (×5), `budgetGroupTasks.ts`, `aggregateExecution.ts`, `computeFrontera.ts`, `proyectoVivoFlow.ts`, `canvasMultinivel.ts`, más componentes **[V]**. **Mitigación obligatoria: un único predicado de dominio** (`esTransformacion(node)`) que durante toda la transición acepte **ambos** valores, introducido y desplegado **antes** de la migración de datos. La migración de datos se vuelve entonces no-disruptiva.

### 6.2 `tareas` — la costura explícita

| Campo | Hoy | Propuesto | Cambio | Migración | Riesgo |
|---|---|---|---|---|---|
| `canvas_node_id` | FK a `canvas_nodes`, **no única** **[V]**; significa "de qué nodo se publicó" | se mantiene como **procedencia** | Ninguno | — | — |
| `transformacion_node_id` | — | `uuid NULL REFERENCES canvas_nodes(id) ON DELETE SET NULL` + índice | **Columna nueva** | `UPDATE tareas SET transformacion_node_id = canvas_node_id WHERE canvas_node_id IS NOT NULL` | BAJO |
| `rol_en_transformacion` | — | *(opcional, fase 3+)* `text NULL`: `replanteo`/`ejecucion`/`correccion`/`limpieza` | Columna nueva | — | BAJO |

**Por qué dos columnas y no reutilizar `canvas_node_id` a secas.** Hoy `canvas_node_id` significa dos cosas a la vez: *"vengo de este nodo"* (procedencia, 1:1 por construcción) y *"pertenezco a esta transformación"* (pertenencia, 1:N deseado). Cuando una transformación tenga 6 tareas, 5 de ellas **no fueron publicadas desde un nodo**: fueron creadas a mano por el coordinador. Ponerles `canvas_node_id` sería mentir sobre su origen y romper `findByCanvasNodeIds`, que el publicador usa para decidir crear vs. actualizar **[V]** — con 6 filas devueltas en vez de 1, el upsert se vuelve no determinista.

Alternativa evaluada y descartada: renombrar `canvas_node_id → transformacion_node_id` y agregar `origen_canvas_node_id`. Mismo número de columnas, pero obliga a tocar las ~12 referencias a `canvas_node_id` de golpe. La propuesta permite dual-read durante la transición.

`ON DELETE SET NULL` resuelve además el problema de §2.3: borrar una transformación del snapshot deja la tarea huérfana pero viva, en vez de romper el guardado.

### 6.3 La relación Transformación → Tareas: por qué NO una tabla

Pediste comparar `transformation_id` en tareas vs. tabla `transformation_tasks`.

| Criterio | Columna `tareas.transformacion_node_id` | Tabla `transformation_tasks` |
|---|---|---|
| Cardinalidad soportada | 1 transformación → N tareas | N:M |
| ¿Es la cardinalidad que pediste? | **Sí** — *"una tarea vinculada a una transformación"*, singular | Más de lo pedido |
| Esfuerzo | 1 columna + índice + backfill | tabla + FKs + RLS + **reescribir `save_canvas_snapshot`** (§2.3) |
| Integridad | FK nativa, imposible duplicar el vínculo | Dos filas pueden contradecirse |
| Consulta "tareas de T" | `WHERE transformacion_node_id = $1` | JOIN |
| Consulta "transformación de una tarea" | columna directa | JOIN + riesgo de N resultados |
| Borrado de nodo | `ON DELETE SET NULL`, limpio | hay que limpiar la join explícitamente dentro de la RPC |
| **Precedente en este repo** | — | `canvas_budget_group_tasks` **duplica** el vínculo con `canvas_nodes.budget_group_id` y obliga a `resolveTaskNodeIdsForBudgetGroup` a leer y unir **dos** fuentes **[V]** |

**Recomendación: columna.** El precedente interno es decisivo: el repo ya tiene exactamente este patrón y ya está pagando el costo de mantenerlo en dos lugares.

**Cuándo reconsiderar.** Si aparece el requisito "una misma tarea materializa dos transformaciones" (p. ej. *"limpiar frente de trabajo"* cierra a la vez la mampostería y la instalación eléctrica), entonces la join table es correcta. **[?] Pregunta de producto, en §11.** Hoy no está en tus requisitos; y migrar de columna a join table después es trivial (`INSERT INTO ... SELECT` + dual-read).

### 6.4 `eventos` — habilitar evidencia a nivel grafo

| Campo | Hoy | Propuesto | Cambio | Migración | Riesgo |
|---|---|---|---|---|---|
| `tarea_id` | `uuid NULL` **[V]** | igual | — | — | — |
| `canvas_node_id` | — | `uuid NULL REFERENCES canvas_nodes(id) ON DELETE SET NULL` | **Columna nueva** | ninguna (sólo para eventos nuevos) | BAJO |
| `tipo` | `text` libre **[V]** | agrega `'certificacion_transformacion'` | Ampliar dominio | — | BAJO |

Con esto, `eventos` + `media` sirven tanto a la evidencia operativa (hoy) como a la certificación de transformaciones `por_aprobacion` / `por_evidencia` (§4.4). **Es la razón por la que no propongo `transformation_evidences`.**

### 6.5 `obras.graph_mode` — de interruptor a capacidad

| Hoy | Propuesto |
|---|---|
| `'obra_plan'` \| `'proyecto_vivo'` — excluyentes | `'obra_plan'` = sin capa B activa; `'hibrido'` = A+B+C conviven (**nuevo, objetivo**); `'proyecto_vivo'` = compat, se mapea a `'hibrido'` |

**Cambio:** `publicationBlockReason` deja de decidir por modo y pasa a decidir **por nodo**: si el nodo es `transformacion` con A/B declarados → reglas modernas; si es `tarea` legacy → reglas legacy. Es el cambio que hace los dos modelos **paralelos** en vez de excluyentes (P2).

**Riesgo: MEDIO.** Es el único cambio que altera comportamiento visible de obras existentes. Mitigación: `'hibrido'` sólo se activa por opt-in explícito por obra; las obras existentes no cambian de modo solas.

### 6.6 Fuente de verdad: Supabase / PostgreSQL · CONFIRMADO

**Decisión: Supabase es canónico. Prisma sale de `apps/web`.**

Justificación, no preferencia:

1. **Las 49 tablas sólo existen en Supabase.** Prisma modela 8, mal (§2.1.1) **[V]**.
2. **La lógica transaccional crítica vive en PL/pgSQL**: `save_canvas_snapshot`, `claim_grows_bridge_job`, `apply_grows_bridge_job`, los 5 RPC de wallet **[V]**. Prisma no puede representarlos.
3. **RLS es una capacidad de Postgres/Supabase** que Prisma bypasea estructuralmente. Dada P8, moverse hacia Prisma empeoraría la seguridad.
4. **El costo de salida es bajo**: 5 de los 7 módulos Prisma no tienen consumidores **[V]**; sólo hay que migrar 2.

**Plan de salida (FASE 2):**
1. Reescribir `evento.service.ts` y `notificacion.service.ts` sobre Supabase.
2. Borrar `cpm.service.ts`, `obra.service.ts`, `tarea.service.ts`, `tareas.service.ts`, `suscripcion.service.ts` (**previa verificación de imports dinámicos** **[?]**).
3. Quitar `prisma generate` del `build`, quitar `@prisma/client` y `prisma` de `apps/web/package.json`.
4. **Conservar** `prisma/` raíz (SQLite): es la herramienta de roadmap interna, no producto. Documentarlo en el README para que no vuelva a confundir.
5. **Archivar `apps/web/prisma/migrations/`** sin ejecutar. **[?] Verificar que nunca se aplicaron contra la base real** — si se aplicaran hoy serían destructivas (modelan `tareas` con 10 columnas).
6. **Regenerar `supabase.gen.ts`** contra la base real (§2.1.2). **Precondición de todo el resto del plan.**

### 6.7 Tabla comparativa entidad por entidad

| Entidad | Tabla actual | Tabla futura | Cambios | Migración | Riesgo |
|---|---|---|---|---|---|
| Obra | `obras` | `obras` | `graph_mode` admite `'hibrido'` | enum/texto | MEDIO |
| Contexto espacial | `canvas_nodes` (etapa/planta/sector/ambiente) | igual | — | — | NULO |
| **Estado productivo** | `canvas_nodes` `type='estado'` | **igual** | documentar `graph_status`; renombrar `fantasma→esperado` (decisión D3) | `UPDATE` 1 valor | BAJO |
| **Transformación** | `canvas_nodes` `type='tarea'` + `transform_kind` | **`canvas_nodes` `type='transformacion'`** | nuevo valor + `modo_certificacion` | `UPDATE type` + columna | **ALTO** |
| Relación A→T→B | `from_node_id` / `to_node_id` | igual | validación de tipos de extremo | — | BAJO |
| Relación extra | `canvas_edges` | igual | matriz de legalidad; retirar `se_ejecuta_mediante` | — | BAJO |
| **T → Tareas** | `tareas.canvas_node_id` (1:1 por app) | **`tareas.transformacion_node_id`** (1:N) | columna + índice | backfill | BAJO |
| Tarea | `tareas` | `tareas` | +1 columna | — | BAJO |
| Subtarea | `tareas_subtareas` | igual | — | — | NULO |
| Precedencia ejecución | `tarea_precedencias` | igual | — | — | NULO |
| Presupuesto | `tareas_presupuestos` | igual | — | — | NULO |
| Paquete/pliego | `canvas_budget_groups` + `_tasks` | igual | agrupan transformaciones | — | BAJO |
| **Evidencia** | `eventos` + `media` | igual | +`canvas_node_id`, +tipo | — | BAJO |
| Historial FSM | `tareas_eventos` **+** `tareas_estados` | **sólo `tareas_eventos`** | dejar de escribir el duplicado | leer ambos 1 release | BAJO |
| Actor socio | `socios` | `socios` | +`tipo` (persona/empresa/profesional) — decisión D5 | backfill `'persona'` | BAJO |
| Actor cuadrilla | `cuadrillas` + `cuadrilla_socios` | igual | resolver contradicción (decisión D4) | — | MEDIO |
| Wallet / escrow | `wallet_*`, `cliente_wallet_*`, `escrow_*` | igual | **cero cambios** | — | NULO |
| Bridge | `grows_bridge_*` | igual | — | — | NULO |
| Obra-check | `obra_check_*` (11) | **sin consumidor** | decidir (D7) | — | BAJO |

---

## 7. Matriz: TENEMOS / SIRVE CON CAMBIOS / HAY QUE CREAR / DEPRECAR

### 7.1 TENEMOS — sirve tal cual

| Pieza | Archivo / tabla | Por qué se conserva |
|---|---|---|
| Snapshot atómico con revisión | `supabase/migrations/20260909045717_*.sql` | Concurrencia resuelta, validación de referencias, campos de ejecución protegidos **[V]** |
| Reglas de scope del canvas | `lib/canvas/canvasScope.ts` | Ya separa contención de proceso. Puro, 225 líneas **[V]** |
| Semántica de relaciones | `lib/proyecto-vivo/relationSemantics.ts` | `temporal/blocks/reverse` es el modelo correcto **[V]** |
| Agregación de ejecución | `lib/proyecto-vivo/aggregateExecution.ts` | **Ya soporta N tareas por transformación** **[V]** |
| Cálculo de frontera | `lib/proyecto-vivo/computeFrontera.ts` | Responde "qué puede ocurrir ahora" **[V]** |
| CPM puro | `lib/utils/cpm.ts` | Sin estado, sin DB, reutilizable desde panel y agente **[V]** |
| FSM de tareas | `lib/services/tarea-fsm.service.ts` | Guardas correctas, matriz por rol **[V]** |
| Normalización legacy | `lib/domain/estados-core.ts` | 21 etiquetas históricas mapeadas; defensivo **[V]** |
| Repositorio de tareas | `lib/tareas/infrastructure/tareas.repository.ts` | Única puerta de escritura (menos el debug log) **[V]** |
| Contrato de propuesta del agente | `lib/proyecto-vivo/publicationContract.ts` | Aceptación humana obligatoria **[V]** |
| Bloqueo de republicación de pliego | `lib/canvas/budgetGroupPublish.ts` | Lógica pura, bien aislada **[V]** |
| Wallet cliente / escrow / retiros | `cliente_wallet_*`, `escrow_*`, RPC | Fuera de alcance **[V]** |
| Evidencia canónica | `eventos` + `media` | Modelo correcto, sólo le falta apuntar al grafo **[V]** |
| Import Project XML | `lib/project/`, `importProjectXml.test.ts` | Testeado **[V]** |

### 7.2 SIRVE CON CAMBIOS

| Pieza | Archivo | Cambio | Esfuerzo |
|---|---|---|---|
| Tipo de nodo canvas | `lib/types/canvasMultinivel.ts` | `+'transformacion'`; `isCanvasTransformacionNode` acepta ambos durante transición | S |
| Mapper canvas↔Supabase | `lib/canvas/canvasSupabaseMapper.ts` | Rama por el nuevo tipo; `status` sólo para contexto | M |
| Publicador | `app/api/obras/[id]/canvas/publicar-tareas/route.ts` | **1:1 → 1:N**; decidir por nodo, no por `graph_mode` | **L** |
| Activación de transformación | `lib/proyecto-vivo/activarEjecucionTransformacion.ts` | Devolver `tareaIds[]`; soportar plantilla de N tareas | **L** |
| Contrato de publicación | `lib/proyecto-vivo/publicationContract.ts` | Permitir `conocimiento`/`coordinacion` con `modo_certificacion` declarado | M |
| Agregación | `lib/proyecto-vivo/aggregateExecution.ts` | Leer `transformacion_node_id`; contemplar certificación directa | M |
| Sync grafo | `lib/proyecto-vivo/syncGraphFromTareaEstado.ts` | Sin cambio funcional; seguir la nueva columna | S |
| Resolución de elemento | `lib/proyecto-vivo/resolveElementoEjecucion.ts` | N tareas comparten elemento del estado destino | M |
| Frontera / flow / CPM vivo | `computeFrontera.ts`, `proyectoVivoFlow.ts`, `computeProyectoVivoCpm.ts` | Usar el predicado de dominio | S×3 |
| Modo de obra | `obras.graph_mode` + consumidores | `'hibrido'` | M |
| Editor de canvas | `CanvasObraEditor.tsx`, `CanvasLeftInspector.tsx` | **Crear/editar Estados y Transformaciones a mano** (resuelve P5) | **L** |
| Herramientas MCP | `lib/mcp-grows/tools.ts` | Vocabulario nuevo; `crear_estado`; identidad por usuario | **L** |
| Evidencia | `eventos` + servicios | `canvas_node_id`, certificación de transformación | M |
| Rutas con `x-organizacion-id` | 8 rutas (§P8) | Resolver org desde la sesión | M |
| Actores | `socios`, `executor_ref` | `socios.tipo`; `executor_ref` con formato `{kind}:{uuid}` | M |

### 7.3 HAY QUE CREAR

| Qué | Dónde | Por qué | Prioridad |
|---|---|---|---|
| **Tests del núcleo** | `__tests__/lib/tareas/`, `/wallet/`, `/permisos/`, `/publicacion/` | §P10. Precondición de todo | **P0** |
| `lib/domain/grafo-productivo.ts` | nuevo | Predicados y tipos únicos: `esTransformacion`, `esEstado`, `esContexto`, `GraphStatusEstado`, `GraphStatusTransformacion`. **Punto único de verdad para toda la transición** | **P0** |
| `lib/domain/relaciones-legales.ts` | nuevo | Matriz §4.5 + validador | P1 |
| `tareas.transformacion_node_id` | migración SQL | §6.2 | P1 |
| `canvas_nodes.modo_certificacion` | migración SQL | §4.4 | P2 |
| `eventos.canvas_node_id` | migración SQL | §6.4 | P2 |
| `lib/services/certificar-transformacion.service.ts` | nuevo | Cierre de transformaciones no-ejecución | P2 |
| UI de Estado y Transformación | `components/cliente/canvas-editor/` | §P5 | P2 |
| `lib/services/cronograma.service.ts` | nuevo (envuelve `lib/utils/cpm.ts`) | Entregable reutilizable panel + agente | P3 |
| Regeneración de `supabase.gen.ts` | script | §2.1.2 | **P0** |
| Doc de esquema real | `docs/ESQUEMA_SUPABASE.md` | Hoy no existe fuente de verdad legible | P1 |

### 7.4 DEPRECAR

**No borrar nada en este plan. Marcar, medir, y borrar en una fase posterior con evidencia.**

| Qué | Clasificación | Evidencia | Acción |
|---|---|---|---|
| `lib/services/cpm.service.ts` | **ELIMINAR** | 0 consumidores; query imposible contra el schema **[V]** | Borrar en FASE 2 |
| `lib/services/obra.service.ts` | **ELIMINAR** | 0 consumidores **[V]** | FASE 2 |
| `lib/services/tareas.service.ts` + `tarea.service.ts` | **ELIMINAR** | subgrafo cerrado sin consumidor externo **[V]** | FASE 2 |
| `lib/services/suscripcion.service.ts` | **ELIMINAR** | sólo lo usa `obra.service` **[V]** | FASE 2 |
| `lib/services/evento.service.ts` | **MIGRAR** | vivo en `/api/eventos` **[V]** | FASE 2 → Supabase |
| `lib/services/notificacion.service.ts` | **MIGRAR** | vivo **[V]** | FASE 2 → Supabase |
| `apps/web/prisma/**` | **ELIMINAR** | tras migrar los 2 anteriores | FASE 2 |
| `agentDebugLog` en `tareas.repository.ts` | **ELIMINAR** | instrumentación de sesión de debug **[V]** | **FASE 0** (inmediato) |
| `canvas_nodes.t_value/t_components/t_formula_id` | **DEPRECAR** | 0 referencias **[V]** | Marcar FASE 1; borrar ≥ FASE 6 |
| `tareas_estados` | **DEPRECAR** | duplicado de `tareas_eventos` **[V]** | Dejar de escribir FASE 1; borrar ≥ FASE 6 |
| `enum tarea_estado` (legacy) | **DEPRECAR** | `tareas.estado` usa `tarea_estado_oficial` **[V]** | **[?]** verificar que ninguna columna lo use |
| `lib/fsm.ts` | **ELIMINAR** | tercer vocabulario, sin relación con el oficial **[V]**; **[?]** verificar consumidores | FASE 2 |
| `app/tareas/page.tsx` | **ELIMINAR** | `obrasMock` **[V]**; duplica `/cliente/tareas` | FASE 4 |
| `app/tareas/[id]/**`, `app/obras/[id]/timeline` | **MIGRAR o ELIMINAR** | contienen mocks **[V]** | FASE 4, con evidencia de tráfico **[?]** |
| `app/obras/*` (vs `/cliente/obras/*`) | **DEPRECAR** | duplicado **[V]** | FASE 4; redirects |
| `lib/mockUser.ts`, `lib/mocks/*` | **DEPRECAR** | **[?]** verificar que no se usen en prod | FASE 4 |
| `components/obra-check/**` (18) + `lib/obra-check/**` (17) | **DECISIÓN D7** | **Ninguna página los monta** **[V]**; 11 tablas en la base | Decidir antes de tocar |
| `se_ejecuta_mediante` en `CANVAS_EDGE_RELATIONS` | **DEPRECAR** | 0 usos **[V]**; reemplazado por la columna | FASE 3 |
| 4 rutas de aprobación de presupuesto | **CONSOLIDAR** | §P13 **[V]** | FASE 4, elegir una |
| `dev/seeds-legacy/`, `dev/migrations/*.py` | **ELIMINAR** | scripts de edición puntual **[V]** | FASE 6 |
| `lib/tareas/*.json` | **DEPRECAR** | datos sueltos en `lib/` **[V]** | FASE 6 |
| Bridge / Tauri / worker EC2 | **DECISIÓN D6** | funcionan; **[?]** uso real desconocido | Decidir; **separar de MCP** |

---

## 8. Lista exacta de archivos afectados

### 8.1 Migraciones SQL (nuevas)

```
supabase/migrations/<ts>_grafo_productivo_predicado.sql        FASE 1  (sin DDL: sólo doc/constraints opcionales)
supabase/migrations/<ts>_tareas_transformacion_node_id.sql     FASE 2
supabase/migrations/<ts>_canvas_nodes_type_transformacion.sql  FASE 2  (UPDATE de datos)
supabase/migrations/<ts>_canvas_nodes_modo_certificacion.sql   FASE 5
supabase/migrations/<ts>_eventos_canvas_node_id.sql            FASE 5
supabase/migrations/<ts>_save_canvas_snapshot_v2.sql           FASE 2  (acepta 'transformacion' + modo_certificacion)
```

### 8.2 Dominio — núcleo del cambio

```
apps/web/lib/domain/grafo-productivo.ts        NUEVO · predicados y tipos únicos
apps/web/lib/domain/relaciones-legales.ts      NUEVO · matriz §4.5
apps/web/lib/domain/estados-core.ts            doc: frontera operativo/productivo
apps/web/lib/types/canvasMultinivel.ts         +'transformacion'; isCanvasTransformacionNode dual
apps/web/lib/types/supabase.gen.ts             REGENERAR (FASE 0)
```

### 8.3 Canvas — persistencia y mapeo

```
apps/web/lib/canvas/canvasSupabaseMapper.ts        rama por tipo; status sólo contexto
apps/web/lib/canvas/canvasPersistenceServer.ts     sin cambio funcional esperado
apps/web/lib/canvas/dbCanvasRowsToNodes.ts         predicado
apps/web/lib/canvas/canvasMultinivelStorage.ts     versión de snapshot v5
apps/web/lib/canvas/canvasScope.ts                 SIN CAMBIOS
apps/web/lib/canvas/budgetGroupTasks.ts            predicado
apps/web/lib/canvas/budgetGroupPublish.ts          SIN CAMBIOS
```

### 8.4 Proyecto vivo — grafo productivo

```
apps/web/lib/proyecto-vivo/publicationContract.ts            reglas por nodo, no por modo
apps/web/lib/proyecto-vivo/activarEjecucionTransformacion.ts 1:1 → 1:N  ★ núcleo
apps/web/lib/proyecto-vivo/aggregateExecution.ts             leer transformacion_node_id
apps/web/lib/proyecto-vivo/syncGraphFromTareaEstado.ts       seguir la nueva columna
apps/web/lib/proyecto-vivo/computeFrontera.ts                predicado
apps/web/lib/proyecto-vivo/proyectoVivoFlow.ts               predicado
apps/web/lib/proyecto-vivo/computeProyectoVivoCpm.ts         predicado
apps/web/lib/proyecto-vivo/buildGrafoSnapshot.ts             predicado
apps/web/lib/proyecto-vivo/loadGrafoSnapshot.ts              predicado
apps/web/lib/proyecto-vivo/resolveElementoEjecucion.ts       N tareas / 1 elemento
apps/web/lib/proyecto-vivo/relationSemantics.ts              retirar se_ejecuta_mediante
apps/web/lib/proyecto-vivo/orquestador/proponerDesdeChat.ts  emitir type='transformacion'
apps/web/lib/proyecto-vivo/orquestador/proponerL0.ts         idem
apps/web/lib/proyecto-vivo/orquestador/insertarNodosCanvasObra.ts  idem
apps/web/lib/proyecto-vivo/orquestador/proponerPasoEnCanvasObra.ts idem
```

### 8.5 API

```
apps/web/app/api/obras/[id]/canvas/publicar-tareas/route.ts        ★ núcleo · 1:N
apps/web/app/api/obras/[id]/canvas/route.ts                        validación de tipos
apps/web/app/api/obras/[id]/canvas/tareas-publicacion/route.ts     preview N
apps/web/app/api/tareas/route.ts                                   aceptar transformacion_node_id
apps/web/app/api/tareas/[id]/route.ts                              exponer la relación
apps/web/app/api/tareas/[id]/transition/route.ts                   sin cambio funcional
apps/web/app/api/obras/desde-idea/route.ts                         graph_mode 'hibrido'
apps/web/app/api/obras/route.ts                                    exponer graph_mode
apps/web/app/api/mcp/route.ts                                      identidad (FASE 7)
apps/web/app/api/mcp/actions/[tool]/route.ts                       idem
apps/web/app/api/mcp/openapi/route.ts                              idem

SEGURIDAD — FASE 0 (independientes del modelo):
apps/web/app/api/eventos/route.ts                      ← org desde sesión
apps/web/app/api/mensajes/route.ts
apps/web/app/api/notificaciones/route.ts
apps/web/app/api/notificaciones/[id]/leida/route.ts
apps/web/app/api/cuadrillas/[id]/socios/route.ts
apps/web/app/api/invitaciones/crear/route.ts
apps/web/app/api/socios/[id]/tareas/route.ts
apps/web/app/api/socios/invitar/route.ts
apps/web/app/api/socio/subtareas/[id]/route.ts         ← verificar pertenencia
```

### 8.6 Servicios

```
apps/web/lib/services/certificar-transformacion.service.ts  NUEVO (FASE 5)
apps/web/lib/services/cronograma.service.ts                 NUEVO (FASE 6)
apps/web/lib/services/tarea-fsm.service.ts                  sin cambio funcional
apps/web/lib/services/evento.service.ts                     Prisma → Supabase (FASE 2)
apps/web/lib/services/notificacion.service.ts               Prisma → Supabase (FASE 2)
apps/web/lib/services/cpm.service.ts                        BORRAR (FASE 2)
apps/web/lib/services/obra.service.ts                       BORRAR (FASE 2)
apps/web/lib/services/tarea.service.ts                      BORRAR (FASE 2)
apps/web/lib/services/tareas.service.ts                     BORRAR (FASE 2)
apps/web/lib/services/suscripcion.service.ts                BORRAR (FASE 2)
apps/web/lib/tareas/infrastructure/tareas.repository.ts     quitar agentDebugLog (FASE 0) + nueva columna
apps/web/lib/tareas/tarea-metadata.service.ts               upsert N
apps/web/lib/fsm.ts                                         BORRAR (FASE 2, verificar antes)
```

### 8.7 Componentes

```
apps/web/components/cliente/canvas-editor/CanvasObraEditor.tsx       crear estado/transformación
apps/web/components/cliente/canvas-editor/CanvasLeftInspector.tsx    inspector por tipo
apps/web/components/cliente/canvas-editor/MultinivelFlowNode.tsx     render transformación
apps/web/components/cliente/canvas-editor/ScopeCanvasPanel.tsx       capas A/B/C
apps/web/components/cliente/canvas-editor/workspace/LayersControl.tsx  toggle A/B/C
apps/web/components/cliente/canvas-editor/PublicarTareasCanvasModal.tsx  N tareas
apps/web/components/cliente/canvas-editor/useCanvasMultinivel.ts     estado local
apps/web/components/cliente/proyecto-vivo/TransformacionVivoNode.tsx tareas vinculadas
apps/web/components/cliente/proyecto-vivo/EstadoVivoNode.tsx         'esperado'
apps/web/components/cliente/proyecto-vivo/ProyectoVivoCanvas.tsx     modo híbrido
```

### 8.8 Tests nuevos (FASE 0 salvo indicación)

```
apps/web/__tests__/lib/tareas/tareaFsm.test.ts                  ★
apps/web/__tests__/lib/tareas/subtareaValidar.test.ts           ★
apps/web/__tests__/lib/tareas/estadosLegacy.test.ts             ★
apps/web/__tests__/lib/publicacion/publicarTareas.test.ts       ★ snapshot del 1:1 actual
apps/web/__tests__/lib/publicacion/transformacionNTareas.test.ts  FASE 3
apps/web/__tests__/lib/wallet/clienteWallet.test.ts             ★
apps/web/__tests__/lib/wallet/escrow.test.ts                    ★
apps/web/__tests__/lib/presupuestos/aprobarPaquete.test.ts      ★
apps/web/__tests__/lib/presupuestos/publicarPliego.test.ts      ★
apps/web/__tests__/lib/permisos/tenencia.test.ts                ★
apps/web/__tests__/lib/domain/grafoProductivo.test.ts           FASE 1
apps/web/__tests__/lib/domain/relacionesLegales.test.ts         FASE 1
apps/web/__tests__/lib/proyecto-vivo/certificacion.test.ts      FASE 5
```

### 8.9 Configuración y documentación

```
apps/web/package.json                 quitar prisma (FASE 2)
apps/web/prisma/**                    borrar (FASE 2)
prisma/**                             CONSERVAR (roadmap interno) + documentar
docs/ESQUEMA_SUPABASE.md              NUEVO
docs/MODELO_DOMINIO_GROWS.md          NUEVO
AGENTS.md                             nota sobre las tres capas
```

---

## 9. Plan de migración por fases

Siete fases. **Cada una deja el sistema desplegable y funcionando.** Ninguna rompe las tareas operativas.

| Fase | Nombre | Esquema | Puede desplegarse sola |
|---|---|---|---|
| **0** | Red de seguridad y verdad del esquema | no | Sí |
| **1** | Dominio: predicado único, sin tocar datos | no | Sí |
| **2** | Persistencia: columna, tipo, salida de Prisma | **sí** | Sí |
| **3** | Relación Transformación → N Tareas | no | Sí |
| **4** | Canvas: crear y ver las tres capas | no | Sí |
| **5** | Certificación: evidencia y validación a nivel grafo | **sí** | Sí |
| **6** | Consolidación: duplicados y código muerto | no | Sí |
| **7** | AaaS: identidad y servicios para agentes | no | Sí |

**Divergencia respecto del esquema que propusiste:** moví tests al frente (FASE 0) porque es la condición que hace seguro todo lo demás, y separé "relación T→N tareas" (FASE 3) de "persistencia" (FASE 2) para que el cambio de `type` y el cambio de cardinalidad no se desplieguen juntos. Son los dos puntos de mayor riesgo y no deberían compartir ventana de despliegue.

---

## 10. Detalle por fase

### FASE 0 — Red de seguridad y verdad del esquema

**Objetivo:** poder tocar el núcleo sin romperlo a ciegas, y cerrar las fugas de tenencia que son independientes de todo este plan.

**Archivos**
- `apps/web/lib/types/supabase.gen.ts` — regenerar contra la base real
- `apps/web/lib/tareas/infrastructure/tareas.repository.ts` — quitar `agentDebugLog` (6 puntos)
- 8 rutas con `x-organizacion-id` (§8.5) + `api/socio/subtareas/[id]/route.ts`
- 10 archivos de test nuevos (§8.8, marcados ★)
- `docs/ESQUEMA_SUPABASE.md`

**Tablas / migraciones:** ninguna.

**Tests:** FSM (matriz por rol + las 3 guardas), subtarea→validar, normalización legacy, snapshot del comportamiento **1:1 actual** de `publicar-tareas` (test de caracterización: congela lo que hace hoy para detectar regresiones), wallet cliente (reservar/liberar/devolver), escrow, aprobación de paquete, publicación de pliego, tenencia por org.

**Riesgo:** **BAJO**. Nada cambia de comportamiento salvo las 9 rutas de seguridad, que se vuelven más estrictas.

> ⚠️ Las 9 rutas pueden romper clientes que hoy mandan un `x-organizacion-id` distinto al de su sesión. 16 componentes envían ese header **[V]**. Mitigación: durante un release, si el header difiere de la org de la sesión → log de advertencia + usar la de la sesión; después, 403.

**Aceptación**
- [ ] `pnpm test` verde con ≥ 10 archivos nuevos
- [ ] `supabase.gen.ts` contiene `energy_unit_id` y `read_canvas_snapshot` **[?]**
- [ ] `grep -rn "x-organizacion-id" apps/web/app/api` → 0
- [ ] `grep -rn agentDebugLog apps/web` → 0
- [ ] `docs/ESQUEMA_SUPABASE.md` lista las 49 tablas y marca las huérfanas

---

### FASE 1 — Dominio: predicado único

**Objetivo:** que exista **un solo lugar** en el código que decida "esto es una transformación". Sin tocar datos ni esquema. Esta fase es la que vuelve barata y reversible la FASE 2.

**Archivos**
- `apps/web/lib/domain/grafo-productivo.ts` — **NUEVO**:
  ```ts
  export type CapaNodo = 'contexto' | 'estado' | 'transformacion';
  export function capaDeNodo(n): CapaNodo
  export function esTransformacion(n): boolean   // type==='transformacion' || (type==='tarea')
  export function esEstado(n): boolean
  export function esContexto(n): boolean
  export const TIPOS_CONTEXTO = ['etapa','planta','sector','ambiente'] as const;
  ```
- `apps/web/lib/domain/relaciones-legales.ts` — **NUEVO**: matriz §4.5 + `validarRelacion()` (sólo **reporta**, no bloquea)
- `lib/types/canvasMultinivel.ts` — `'transformacion'` en el tipo; `isCanvasTransformacionNode` delega en `esTransformacion`
- Reemplazar **todos** los `type === 'tarea'` / `type === 'estado'` por los predicados: `aggregateExecution.ts`, `computeFrontera.ts`, `proyectoVivoFlow.ts`, `computeProyectoVivoCpm.ts`, `buildGrafoSnapshot.ts`, `loadGrafoSnapshot.ts`, `canvasSupabaseMapper.ts`, `budgetGroupTasks.ts`, `publicar-tareas/route.ts`, `publicationContract.ts`
- `docs/MODELO_DOMINIO_GROWS.md` — **NUEVO**

**Tablas:** ninguna. **Migraciones:** ninguna.

**Tests:** `grafoProductivo.test.ts` (predicados aceptan ambos valores), `relacionesLegales.test.ts` (matriz), y **los de FASE 0 siguen verdes sin modificación** — eso es la prueba de que la fase es no-disruptiva.

**Riesgo:** **BAJO**. Refactor mecánico, cubierto por FASE 0.

**Aceptación**
- [ ] `grep -rn "type === 'tarea'" apps/web/lib apps/web/app` → sólo dentro de `grafo-productivo.ts`
- [ ] Tests de FASE 0 verdes **sin cambios**
- [ ] `tsc --noEmit` limpio

---

### FASE 2 — Persistencia: columna, tipo y salida de Prisma

**Objetivo:** que la base refleje el modelo. Es la fase con DDL.

**Archivos**
- 3 migraciones SQL (`tareas_transformacion_node_id`, `canvas_nodes_type_transformacion`, `save_canvas_snapshot_v2`)
- `canvasSupabaseMapper.ts`, `canvasMultinivelStorage.ts` (snapshot v5)
- `tareas.repository.ts`, `tarea-metadata.service.ts` (leer/escribir la nueva columna)
- `evento.service.ts`, `notificacion.service.ts` → Supabase
- **Borrar:** `cpm.service.ts`, `obra.service.ts`, `tarea.service.ts`, `tareas.service.ts`, `suscripcion.service.ts`, `lib/fsm.ts`, `apps/web/prisma/**`
- `apps/web/package.json`

**Tablas / migraciones**
```sql
-- 1. columna de pertenencia
ALTER TABLE tareas ADD COLUMN transformacion_node_id uuid NULL
  REFERENCES canvas_nodes(id) ON DELETE SET NULL;
CREATE INDEX idx_tareas_transformacion ON tareas(transformacion_node_id);
UPDATE tareas SET transformacion_node_id = canvas_node_id WHERE canvas_node_id IS NOT NULL;

-- 2. desdoblar el tipo (sólo las que YA son transformaciones)
UPDATE canvas_nodes SET type = 'transformacion'
  WHERE type = 'tarea' AND transform_kind IS NOT NULL;

-- 3. save_canvas_snapshot v2: aceptar 'transformacion'
```

**[?] Verificar antes de correr (2):** cuántas filas afecta, y si alguna obra `obra_plan` tiene `transform_kind` seteado por accidente.

**Tests:** los de FASE 0/1 verdes; + test de que el snapshot preserva `type='transformacion'` en round-trip; + test de que `transformacion_node_id` se puebla al publicar.

**Riesgo:** **ALTO** — es la única fase con `UPDATE` masivo sobre el grafo.

**Mitigaciones obligatorias**
1. FASE 1 desplegada y estable ≥ 1 semana (el predicado acepta ambos valores, así que la migración no rompe nada).
2. Backup de `canvas_nodes` y `tareas` antes.
3. Correr primero en staging con copia de producción.
4. Rollback: `UPDATE canvas_nodes SET type='tarea' WHERE type='transformacion'` — reversible porque `transform_kind` sigue intacto.
5. Desplegar la migración 1 (columna) **separada** de la 2 (tipo). Son dos ventanas.

**Aceptación**
- [ ] `select count(*) from canvas_nodes where type='tarea' and transform_kind is not null` → 0
- [ ] `select count(*) from tareas where canvas_node_id is not null and transformacion_node_id is null` → 0
- [ ] Round-trip del canvas en una obra real sin pérdida **[?]**
- [ ] `grep -rn "@prisma/client" apps/web/lib apps/web/app` → 0
- [ ] Build de producción OK

---

### FASE 3 — Relación Transformación → N Tareas

**Objetivo:** que *"Ejecutar mampostería PB"* pueda materializarse en 6 tareas. **Es el objetivo funcional central del plan.**

**Archivos**
- `activarEjecucionTransformacion.ts` — **★ reescritura del núcleo**: de `upsert(1)` a `upsert(N)`, devolviendo `tareaIds[]`. Clave de idempotencia: `(transformacion_node_id, rol_en_transformacion | orden)`
- `publicar-tareas/route.ts` — contar N; preview con N; precedencias entre transformaciones → precedencias entre la **última** tarea de T1 y la **primera** de T2 **[decisión D2]**
- `resolveElementoEjecucion.ts` — un elemento por estado destino, compartido por las N tareas
- `aggregateExecution.ts` — ya soporta N; cambiar la fuente a `transformacion_node_id`
- `syncGraphFromTareaEstado.ts` — idem
- `tarea-metadata.service.ts` — upsert por lote
- `api/tareas/route.ts` — aceptar `transformacion_node_id` al crear una tarea a mano
- `PublicarTareasCanvasModal.tsx` — mostrar "1 transformación → 6 tareas"

**Tablas:** ninguna nueva. **Migraciones:** ninguna.

**Tests**
- `transformacionNTareas.test.ts`: publicar T con 3 tareas → 3 filas; republicar → 3 (idempotente); validar 2 de 3 → `en_curso`; validar 3 → `realizada` → estado B `alcanzado`; rechazar 1 → B vuelve a `esperado`
- Agregar una tarea a mano a una T ya publicada → T vuelve a `en_curso`
- Caracterización de FASE 0: **una transformación con 1 tarea se comporta idéntico a hoy**

**Riesgo:** **ALTO** (lógica), **BAJO** (datos: no hay DDL ni UPDATE).

**Mitigaciones**
1. Flag por obra: `obras.canvas_ui.transformacionMultiTarea = true`. Sin el flag, camino 1:1 de siempre.
2. Idempotencia probada antes de habilitar.
3. **El cierre de la transformación exige TODAS las tareas validadas** — es la regla actual (`aggregateExecution.ts:12`, *"All linked tasks are mandatory"*) **[V]** y no se relaja.

**Aceptación**
- [ ] Transformación con 6 tareas publicables; republicar no duplica
- [ ] Validar 5/6 → `en_curso`; 6/6 → `realizada`; B `alcanzado`
- [ ] Rechazar 1 → B vuelve a `esperado` (ya cubierto por `productiveContract.test.ts` **[V]**)
- [ ] Obras existentes sin flag: comportamiento byte a byte igual

---

### FASE 4 — Canvas: crear y ver las tres capas

**Objetivo:** que una persona pueda construir el grafo productivo sin pasar por el chat (resuelve P5), y que las tres capas se distingan en pantalla sin reescribir el editor.

**Archivos**
- `CanvasObraEditor.tsx` — acciones "Nuevo estado" / "Nueva transformación"
- `CanvasLeftInspector.tsx` — inspector por capa: contexto (título, superficie) / estado (título, `graph_status` **solo lectura, derivado**) / transformación (A, B, `transform_kind`, `modo_certificacion`, ejecutor, duración)
- `MultinivelFlowNode.tsx`, `workspace/LayersControl.tsx` — toggle de visibilidad A / B / C
- `TransformacionVivoNode.tsx` — "3 de 6 tareas validadas"
- `EstadoVivoNode.tsx` — `fantasma` → `esperado` [decisión D3]
- `ScopeCanvasPanel.tsx` — `canvasScope.ts` ya proyecta relaciones entre scopes; **sólo cambia el estilo por capa** **[V]**
- Limpieza de duplicados UI: `/tareas` (mock) → redirect; `/obras/*` → redirect a `/cliente/obras/*`

**Tablas:** ninguna.

**Tests:** unitarios del inspector por capa; `canvasScope.test.ts` existente debe seguir verde sin cambios **[V]**.

**Riesgo:** **MEDIO** — es UI sobre el componente más grande del repo (934 + 1.096 líneas).

**Mitigación:** no refactorizar `CanvasObraEditor`. Sólo **agregar** acciones y ramas de render. El refactor de ese componente es un trabajo aparte que no debe mezclarse con el cambio de modelo.

**Aceptación**
- [ ] Crear estado A, transformación y estado B desde la UI, sin chat
- [ ] Publicar y ver las tareas vinculadas en el nodo
- [ ] Toggle de capas funcionando
- [ ] `/tareas` y `/obras` redirigen; **[?]** verificar que no haya enlaces externos a esas rutas

---

### FASE 5 — Certificación: evidencia y validación a nivel grafo

**Objetivo:** cerrar P3. Que *"documentación de mampostería aprobada"* sea alcanzable.

**Archivos**
- 2 migraciones (`canvas_nodes.modo_certificacion`, `eventos.canvas_node_id`)
- `publicationContract.ts` — permitir `conocimiento`/`coordinacion` si declaran `modo_certificacion ≠ 'por_tareas'`
- `lib/services/certificar-transformacion.service.ts` — **NUEVO**: valida permiso, exige evidencia, escribe `eventos` + `media`, pone `graph_status='realizada'`, dispara la reagregación
- `aggregateExecution.ts` — una transformación certificada cuenta como `realizada` aunque tenga 0 tareas
- `api/obras/[id]/canvas/certificar/route.ts` — **NUEVO**
- UI: panel de certificación en el inspector de transformación

**Tablas / migraciones**
```sql
ALTER TABLE canvas_nodes ADD COLUMN modo_certificacion text NOT NULL DEFAULT 'por_tareas';
ALTER TABLE eventos ADD COLUMN canvas_node_id uuid NULL
  REFERENCES canvas_nodes(id) ON DELETE SET NULL;
CREATE INDEX idx_eventos_canvas_node ON eventos(canvas_node_id);
```

**Tests:** `certificacion.test.ts` — `por_aprobacion` sin evidencia → rechazo; con evidencia + permiso → `realizada`; actor sin permiso → 403; `por_tareas` **no** admite certificación directa (no se puede saltear la validación de los albañiles); certificar una T de conocimiento alcanza su estado B.

**Riesgo:** **MEDIO**. Es la única fase que introduce una vía nueva para marcar trabajo como hecho → **es también la de mayor riesgo de abuso**.

**Mitigaciones**
1. `por_tareas` es el default y **no** admite certificación directa. Ninguna transformación de ejecución existente cambia.
2. Evidencia obligatoria (al menos un `media`) para `por_aprobacion` y `por_evidencia`.
3. Sólo CLIENTE o líder aceptado puede certificar — mismo criterio que validar una tarea (`PermisoService.puedeValidarBloquesComoCliente`) **[V]**.
4. Todo cierre deja `evento` con actor, fecha y fuentes. Reversible.

**Aceptación**
- [ ] Estado *"documentación aprobada"* alcanzable vía T de conocimiento certificada
- [ ] Sin evidencia → rechazo
- [ ] Transformación `ejecucion` con `por_tareas` **no** certificable directo
- [ ] Rechazo posterior revierte el estado B

---

### FASE 6 — Consolidación de duplicados y código muerto

**Objetivo:** bajar superficie. **Nada se borra sin evidencia de que no tiene consumidor.**

**Archivos:** los de §7.4 clasificados ELIMINAR/DEPRECAR y no tocados en fases anteriores.

**Tablas (sólo tras ≥ 1 release de no-escritura y verificación):**
- dejar de escribir `tareas_estados` (FASE 1) → `DROP TABLE` acá
- `ALTER TABLE canvas_nodes DROP COLUMN t_value, t_components, t_formula_id`
- **[?]** `DROP TYPE tarea_estado` sólo si ninguna columna lo usa
- `obra_check_*`: **no tocar hasta D7**

**Tests:** la suite completa verde tras cada borrado. Para cada ruta eliminada: redirect probado.

**Riesgo:** **MEDIO** — borrar siempre lo es.

**Protocolo por cada candidato (obligatorio):**
1. `grep -rn` del símbolo en todo el repo
2. Buscar imports dinámicos / por string
3. **[?]** Revisar logs de acceso del deploy ≥ 30 días
4. Dejarlo 1 release emitiendo una advertencia antes de borrar
5. Un commit por eliminación, reversible solo

**Aceptación**
- [ ] Cero rutas duplicadas para listar obras, crear obra y aprobar presupuesto
- [ ] Un solo historial FSM
- [ ] Suite verde; build de producción OK

---

### FASE 7 — AaaS: identidad y servicios para agentes

**Objetivo:** convertir el MCP monousuario en una superficie multiusuario, y exponer como servicios los entregables que hoy están enterrados.

**Archivos**
- `lib/mcp-grows/createServer.ts` — **reemplazar el token único** por tokens por usuario u OAuth; resolver org desde la identidad, no desde `GROWS_MCP_ORG_ID`
- `lib/mcp-grows/tools.ts` — vocabulario nuevo + herramientas separadas por nivel de efecto:
  | Herramienta | Efecto | Permiso |
  |---|---|---|
  | `listar_obras` / `leer_grafo` / `leer_tareas` | lectura | miembro de la org |
  | `calcular_cronograma` | lectura (cálculo puro) | miembro |
  | `proponer_estado` / `proponer_transformacion` | **borrador** (`orquestador.estado='pendiente'`) | miembro |
  | `preparar_pliego` | **borrador** | coordinador |
  | `publicar_pliego` / `adjudicar` / `certificar` | **efecto real** | cliente/líder + confirmación en Grows |
- `lib/services/cronograma.service.ts` — **NUEVO**, envuelve `lib/utils/cpm.ts` (ya es puro y desacoplado del canvas **[V]** — no hace falta extraerlo, sólo darle una fachada tipada)
- `api/mcp/openapi/route.ts` — regenerar

**Riesgo:** **ALTO** (seguridad), **BAJO** (modelo).

**Mitigación:** el contrato que ya existe — agente propone, humano acepta (`publicationContract.ts`) **[V]** — se mantiene **sin excepción** para toda operación con efecto económico o contractual.

**Aceptación**
- [ ] Dos usuarios de orgs distintas, con sus propias credenciales, ven sólo lo suyo
- [ ] Una propuesta de agente **nunca** llega a `tareas` sin aceptación humana
- [ ] Permisos verificados en el servidor, no en el cliente

---

## 11. Decisiones que requieren tu aprobación antes de programar

### D1 — `type='transformacion'` como valor propio · BLOQUEANTE

**Opciones:** (a) nuevo valor de `type` + migración de datos **[recomendado]**; (b) mantener `type='tarea'` y distinguir sólo por `transform_kind` en el dominio.

(b) es más barato y cero riesgo de datos, pero deja la ambigüedad en la base, en el SQL manual y en el MCP — es decir, **no cumple tu regla de arquitectura**. Recomiendo (a), mitigado por el predicado de FASE 1 que hace la migración no-disruptiva.

**Costo de cambiar después:** bajo si se hace con el predicado; alto si se posterga hasta tener 10× más datos.

---

### D2 — Qué significa una precedencia T1→T2 en el plano de ejecución · BLOQUEANTE para FASE 3

Si T1 tiene 3 tareas y T2 tiene 4, la arista T1→T2 puede traducirse a:
- **(a)** `última(T1) → primera(T2)` — 1 precedencia. Simple, permite solapamiento real. **[recomendado]**
- **(b)** producto cartesiano: 12 precedencias. Correcto en teoría, explosivo y hace el CPM ilegible.
- **(c)** `todas(T1) → todas(T2)` sólo para tareas marcadas como "hito" dentro de la transformación.

Recomiendo (a) para el piloto. En obra el solapamiento es la norma, no la excepción, y (b) la prohíbe de hecho.

**Reversible:** sí, es lógica de traducción. **Costo de cambiar después:** medio (hay que limpiar `tarea_precedencias` generadas).

---

### D3 — Renombrar `fantasma` → `esperado` · NO bloqueante

`'fantasma'` es jerga interna visible en la UI. `'esperado'` describe lo que es: un estado declarado que todavía no se alcanzó.

Costo: un `UPDATE` de un valor + dual-read un release. Si preferís no tocarlo, el plan funciona igual.

---

### D4 — Cuadrilla: ¿sigue viva? · BLOQUEANTE para el modelo de actores

El código se contradice (§2.8) **[V]**: un comentario dice que las cuadrillas quedaron obsoletas, y hay un endpoint activo para asignar cuadrilla y una columna `tareas.cuadrilla_id` poblada.

Opciones: (a) la cuadrilla es el actor de campo y el capataz reporta por ella **[alineado con lo que escribiste sobre no obligar a cada obrero a tener cuenta]**; (b) sólo socio individual, cuadrilla pasa a ser una etiqueta.

Esto define si `executor_ref` resuelve a `socios` solamente o también a `cuadrillas`. **Decidilo antes de FASE 3.**

---

### D5 — `socios.tipo` (persona / empresa / profesional) · NO bloqueante

Hoy `socios` no distingue persona de empresa **[V]**, y `executor_kind` ya tiene esa distinción del lado de la planificación. Sin el campo, el ejecutor planificado nunca puede validarse contra el ejecutor real.

Recomiendo agregarlo (una columna con default `'persona'`), no una tabla `actors`.

---

### D6 — Bridge local / Tauri / worker EC2 / chat propio · NO bloqueante para el modelo, SÍ para el alcance

Son piezas que funcionan y que no sé si alguien usa **[?]**. Mi lectura: **separar dos cosas que hoy se confunden**.
- La **arquitectura de propuesta revisable** (agente propone → humano acepta) es la pieza valiosa y va a FASE 7.
- El **transporte** (Grows manda trabajo a un Codex en la PC del usuario, vía Tauri + cola + worker EC2) es una infraestructura cara de mantener cuyo problema —"que el usuario trabaje desde su asistente"— resuelve mejor el MCP remoto con identidad propia.

Mi recomendación: **fuera del primer corte**, no retirado. Congelar bridge/Tauri/worker y poner el esfuerzo en FASE 7. Antes de retirar nada: **[?]** medir uso real de `grows_bridge_jobs` en los últimos 90 días.

---

### D7 — `obra_check` (11 tablas, 18 componentes, 17 módulos) · NO bloqueante

**Ninguna página lo monta** **[V]**. O es un producto que se desconectó, o es trabajo en curso.

Opciones: (a) archivar en una rama y borrar del main; (b) dejarlo congelado y documentado; (c) reconectarlo.
Necesito saber qué fue. **[?]** Verificar si `obra_check_sessions` tiene filas en producción.

---

### D8 — ¿N:M transformación↔tarea alguna vez? · NO bloqueante, define si D-recomendación de §6.3 se sostiene

Caso concreto: *"limpiar frente de trabajo"* podría cerrar a la vez la mampostería y la instalación eléctrica.

Si decís que sí, hay que ir a `transformation_tasks` desde FASE 3 (pagando la reescritura de `save_canvas_snapshot`). Si decís "una tarea pertenece a una sola transformación, y si hace falta se duplica", la columna alcanza.

Recomiendo la columna: migrar de columna a join table después es barato (`INSERT INTO ... SELECT`); al revés no.

---

### D9 — Orden de las fases de seguridad · recomiendo no negociar

Las 9 rutas de P8 se arreglan en FASE 0, **antes** que cualquier cosa de modelo. No dependen de este plan y la fuga existe hoy.

---

## ORDEN RECOMENDADO DE IMPLEMENTACIÓN

Lista numerada de cambios concretos. Los primeros cinco no tocan el modelo y pueden empezar hoy.

1. **Regenerar `apps/web/lib/types/supabase.gen.ts`** contra la base real y commitear el diff. Sin esto trabajamos a ciegas: hoy el archivo omite columnas que el código escribe e incluye columnas que nadie usa (§2.1.2). *(horas)*

2. **Quitar `agentDebugLog` de `lib/tareas/infrastructure/tareas.repository.ts`** (6 puntos). Instrumentación de una sesión de debug en el camino caliente de creación de tareas. *(minutos)*

3. **Cerrar la tenencia por header en 9 rutas.** Resolver la organización desde la sesión en lugar de `x-organizacion-id`, con un release de advertencia antes del 403. Es la fuga más grave que encontré y es independiente de todo lo demás. *(2-3 días, incluye adaptar los 16 componentes que mandan el header)*

4. **Escribir los 10 tests de caracterización del núcleo** (§8.8 ★): FSM, subtareas, wallet, presupuestos, pliegos, permisos, y **el comportamiento 1:1 actual de `publicar-tareas`**. No prueban el diseño nuevo: congelan el actual para que el cambio sea detectable. *(1 semana)*

5. **Documentar el esquema real** en `docs/ESQUEMA_SUPABASE.md`: 49 tablas, cuáles están vivas, cuáles huérfanas, qué significa cada columna de `canvas_nodes`. *(1-2 días, sale casi solo de este documento)*

   — *A partir de acá empieza el cambio de modelo* —

6. **Crear `lib/domain/grafo-productivo.ts`** con los predicados únicos y reemplazar las ~20 comparaciones literales `type === 'tarea'` / `'estado'` repartidas por el código. **Es el cambio más importante del plan**: sin él, todo lo demás es arriesgado; con él, casi todo lo demás es reversible. *(2-3 días)*

7. **Crear `lib/domain/relaciones-legales.ts`** con la matriz §4.5, reportando relaciones ilegales sin bloquearlas todavía. Empieza a medir cuánta basura hay en `canvas_edges` antes de decidir qué hacer con ella. *(1-2 días)*

8. **Migración: `tareas.transformacion_node_id`** + índice + backfill desde `canvas_node_id`. Columna nullable, nadie la lee todavía. Riesgo casi nulo. *(1 día)*

9. **Migración: `canvas_nodes.type='tarea' AND transform_kind IS NOT NULL` → `'transformacion'`**, con `save_canvas_snapshot` actualizado para aceptar el valor. **Ventana de despliegue separada del punto 8.** Sólo después de que el punto 6 lleve ≥ 1 semana estable en producción. *(1 día + ventana)*

10. **Sacar Prisma de `apps/web`:** migrar `evento.service` y `notificacion.service` a Supabase, borrar los 5 servicios muertos, borrar `apps/web/prisma/**`, quitar `prisma generate` del build. Conservar `prisma/` raíz (roadmap interno) y documentarlo. *(2-3 días)*

11. **Levantar el 1:1 en `activarEjecucionTransformacion`:** una transformación publica N tareas, con idempotencia por `(transformacion_node_id, orden)`. Detrás de un flag por obra. **Éste es el objetivo funcional central.** *(1 semana)*

12. **Adaptar `publicar-tareas`** para contar y previsualizar N tareas, y traducir precedencias T→T según D2. *(2-3 días)*

13. **Agregar la UI de Estado y Transformación al canvas** (crear, editar A/B, ver tareas vinculadas, toggle de capas). Resuelve el hecho de que hoy la capa de planificación sólo se puebla por chat. *(1-2 semanas)*

14. **Migración: `canvas_nodes.modo_certificacion` + `eventos.canvas_node_id`**, y `certificar-transformacion.service.ts`. Desbloquea los estados de conocimiento y coordinación: *"documentación aprobada"*, *"frente liberado"*, *"materiales en obra"*. *(1 semana)*

15. **Consolidar duplicados** siguiendo el protocolo de 5 pasos de FASE 6: rutas de obras/tareas, 4 rutas de aprobación de presupuesto, `tareas_estados`, columnas `t_*`, mocks. Un commit por eliminación. *(1 semana, repartible)*

16. **Rehacer la identidad del MCP** (token por usuario, org desde la identidad) y exponer `calcular_cronograma` / `preparar_pliego` / `publicar_pliego` como operaciones separadas por nivel de efecto. *(2 semanas)*

**Camino crítico real:** 1 → 4 → 6 → 8 → 9 → 11. Todo lo demás puede paralelizarse o postergarse sin bloquear el objetivo.

**El punto 6 es la bisagra.** Si se hace bien, los puntos 9 y 11 —los dos de mayor riesgo— se vuelven cambios localizados y reversibles. Si se saltea, son dos refactors simultáneos sobre 20 archivos con 0 tests de respaldo.

---

*Fin del documento. Ninguna implementación fue realizada. Esperando revisión y aprobación, en particular de D1, D2 y D4, que bloquean el inicio de las fases 2 y 3.*
