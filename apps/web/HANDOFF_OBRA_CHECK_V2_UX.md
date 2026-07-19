# HANDOFF — Obra Check V2: usabilidad (3 pasos), canvas de la app y vinculación directa

**Fecha:** 2026-07-19
**Para:** agente implementador. Decisiones ya tomadas; ante ambigüedad elegir lo más simple que cumpla el criterio de aceptación. Complementa a `HANDOFF_OBRA_CHECK_MVP.md` (leer su sección ESTADO primero).

---

## 0. Estado actual (verificado en repo 2026-07-19)

El wizard hoy tiene **8 pasos**: `intro → carga → fases → orden → presupuesto → asignar → envio → upsell` (`components/obra-check/ObraCheckWizard.tsx`). Además existen (NO tocar, funcionan):
- Formulario del contratista `/obra-check/f/[token]` + respuesta `/r/[token]` + bandeja `/obra-check/inbox/[token]` y `/obra-check/bandeja`.
- Budget groups jerárquicos, fases canónicas (`lib/obra-check/phases.ts`: Preparacion/Estructura/Instalaciones/Terminaciones), planos, m²/unidad, leads.
- Email de finalización: `POST /api/obra-check/complete` → magic link Supabase (`completion-email.service.ts`). **Solo manda un link a login; NO transfiere datos.**
- Canvas actual: `ObraCheckCanvasView` + `buildObraCheckGraph.ts` + `obraCheckFlowNodes.tsx` — xyflow con lanes por fase, **look propio distinto al de la app**.

Canvas real de la app: `components/cliente/canvas-editor/` — xyflow con `MultinivelFlowNode.tsx` (cards con ícono por tipo, chips CPM, checklist, budget label), persiste vía `GET/PUT /api/obras/[id]/canvas` con `lib/canvas/canvasSupabaseMapper.ts` (`persistedToSupabaseRows`). Obras se crean con `POST /api/obras`.

**Los tres objetivos de V2:**
1. **8 pasos → 3 pantallas.**
2. **Canvas visualmente idéntico al de la app** (mismos nodos `MultinivelFlowNode`).
3. **Vinculación directa**: al entrar a Grows desde el email, el plan se convierte en una obra real con su canvas, en un clic.

---

## FASE A — De 8 pasos a 3 pantallas

### Principio de diseño
No borrar lógica: **reagrupar**. Cada paso actual se convierte en un panel dentro de 3 pantallas. Los defaults hacen el trabajo (fase auto-asignada, paquetes auto-sugeridos); el usuario **corrige**, no construye. Un paso separado solo se justifica si el usuario DEBE decidir algo; si hay default razonable, va inline.

### Pantalla 1 — «Cargá tu obra» (absorbe: intro + carga)
- Hero + los 3 modos de carga (archivo / biblioteca / chat / manual) visibles de entrada, SIN pedir email antes.
- Email + consentimientos: card compacta que aparece al presionar «Continuar» (o inline colapsada debajo). La sesión (`POST /session`) se crea recién ahí; las tareas parseadas viven en estado local hasta entonces. Motivo: pedir email antes de mostrar valor mata conversión.
- Al continuar: se ejecuta en cadena `session → saveTasks → ordenar` con **fase y paquetes auto-asignados** (ya existe `normalizePhase` por rubro y `sugerirBloques` + jerarquía de budget groups). Un solo spinner («Grows está ordenando tu obra…»), sin pantallas intermedias.

### Pantalla 2 — «Tu obra ordenada» (absorbe: fases + orden + presupuesto + asignar)
Workspace de canvas único, no secuencia:
- **Centro:** el canvas (Fase B, look app).
- **Panel lateral derecho (drawer en mobile):** tabs `Paquetes` | `Fases`.
  - Tab Paquetes: lista de grupos de presupuesto sugeridos; cada card muestra sus tareas y un select/typeahead «Contratista» inline (lo que hoy hace StepAsignar). Crear contacto inline (nombre + WhatsApp).
  - Tab Fases: lista de tareas con select de fase (lo que hoy hace StepFases) + botón «Encadenar en orden». Cambios → re-`ordenar` con debounce y refresh del canvas.
- CTA fija abajo: «Pedir presupuestos (N paquetes listos) →» habilitada cuando ≥1 paquete tiene contratista.
- Reusar los componentes internos actuales de StepFases/StepBudgetGroups/StepAsignar como sub-componentes de los tabs; borrar los steps como pantallas.

### Pantalla 3 — «Enviá y seguí» (absorbe: envio + upsell)
- Arriba: datos de obra (planos/m², `ObraDatosPedidoPanel`) + cantidades pendientes, colapsable si ya está completo.
- Centro: lista de paquetes con generar/compartir WhatsApp (lógica actual de StepEnvio intacta).
- Abajo, siempre visible (no pantalla aparte): card de cierre con stats + estado del email + CTA «Entrar a Grows» (contenido actual de StepUpsell). `complete` se dispara al primer envío efectivo, no al cambiar de pantalla.

### Cambios de archivos
- `ObraCheckWizard.tsx`: `type Step = 'carga' | 'armar' | 'enviar'`. StepBar de 3.
- Nuevos wrappers: `ScreenCarga.tsx`, `ScreenArmar.tsx`, `ScreenEnviar.tsx` que componen los componentes existentes; `StepIntro/StepFases/StepBudgetGroups/StepAsignar/StepEnvio/StepUpsell` se degradan a paneles (renombrar a `panels/` si ayuda, sin romper imports de tests).
- No hay cambios de API ni de migraciones en esta fase.

### Aceptación Fase A
- [ ] Flujo completo en 3 pantallas; ninguna ruta/panel del contratista rota.
- [ ] Sin email hasta el primer «Continuar»; sesión creada recién ahí.
- [ ] Editar una fase o mover una tarea de paquete re-ordena y refresca el canvas sin salir de la pantalla 2.
- [ ] Mobile 375px usable (panel lateral como drawer).
- [ ] Tests obra-check existentes siguen verdes.

---

## FASE B — Canvas idéntico al de la app

### Decisión
Reusar **los nodos reales**: `MultinivelFlowNode` (`components/cliente/canvas-editor/MultinivelFlowNode.tsx`) dentro del ReactFlow de Obra Check. No montar `CanvasObraEditor` (902 líneas, acoplado a obraId/auth/tabs). Paridad = mismas cards, mismos íconos por tipo, mismos chips CPM/crítico, mismo estilo de aristas.

### Implementación
1. Nuevo `components/obra-check/toCanvasNodes.ts`: `ObraCheckTask[] → { nodes: CanvasNode[], edges: CanvasPrecedenceEdge[] }`.
   - Cada **fase** presente → nodo tipo `etapa` (título = fase, `avancePct` 0).
   - Cada **tarea** → nodo tipo `tarea` bajo su etapa (`parentId`), con `duracionDias`, `esCritica`, `budgetGroupLabel` = nombre del paquete.
   - Posiciones: reutilizar el layout por capas que ya calcula `buildObraCheckGraph.ts` (mantener ese algoritmo, cambiar solo el render).
   - Edges: predecesoras intra-fase (igual que hoy), `critical` cuando ambos extremos son críticos.
2. `ObraCheckCanvasView` v2: `nodeTypes={{ multinivel: MultinivelFlowNode }}`, armando `MultinivelNodeData` con `handlesEnabled: false`, `selected: false`, `cpmSnap` desde el resultado de ordenar (tipo `TareaCPMResultado` — ya viene de `lib/utils/cpm`), `taskPublication: null`, `publicationReview: false`, `projectKind` según tipoObra.
   - Verificar imports de `MultinivelFlowNode`: usa `canvasMultinivelHelpers` y `cn` — todos importables sin auth. Si algún helper arrastra dependencia de contexto de usuario, envolver con un default (NO editar el archivo del editor real).
   - Conservar del canvas actual: bandas de fase de fondo (`phaseFrame`) y minimapa; los nodos y aristas pasan a look app.
3. El mismo `toCanvasNodes` es el insumo de la promoción de Fase C (un solo mapeo, dos usos). Exportar también `toCanvasPersisted(tasks, blocks, obraNombre): CanvasMultinivelPersisted` (v4, con `budgetGroups` desde los grupos de presupuesto).

### Aceptación Fase B
- [ ] Captura lado a lado: card de tarea en `/obra-check` idéntica a la del editor real (ícono, tipografía, chips).
- [ ] Camino crítico resaltado igual que en la app.
- [ ] `MultinivelFlowNode` NO modificado (cero diffs en `components/cliente/canvas-editor/`).
- [ ] Render con 100+ tareas sin lag notable (memo ya presente en los nodos).

---

## FASE C — Vinculación directa Obra Check → app

### Decisión
Promoción **one-way, explícita, en un clic**, al entrar a la app. Nada de sync bidireccional. Piezas existentes que se reutilizan: `POST /api/obras` (crear obra), `PUT /api/obras/[id]/canvas` (persistir canvas con `persistedToSupabaseRows`), magic link ya enviado por `complete`.

### Implementación
1. **Migración** `obra_check_conversions`:
   ```sql
   CREATE TABLE IF NOT EXISTS public.obra_check_conversions (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
     user_id uuid NOT NULL,
     obra_id uuid NOT NULL,
     promoted_at timestamptz NOT NULL DEFAULT now(),
     UNIQUE (session_id)
   );
   ALTER TABLE public.obra_check_conversions ENABLE ROW LEVEL SECURITY;
   ```
2. **Endpoint autenticado** `POST /api/obra-check/promote` (body `{ sessionId }`):
   - Auth requerida (patrón `createRouteHandlerClient` como en `generar-bloques`).
   - Autorización de claim: `session.email === user.email` (case-insens) **o** cookie `obra_check_token` válida de esa sesión. Si no, 403.
   - Idempotente: si ya existe conversión → devolver `{ obraId }` existente.
   - Pasos server-side: leer tasks/blocks/budget groups de la sesión → `toCanvasPersisted` (Fase B) → crear obra (`POST /api/obras` internamente o insert directo service-role con los campos mínimos: nombre = `Obra Check — {empresa|tipo_obra}`, org del usuario) → persistir canvas (reusar la misma lógica del `PUT` canvas o llamar `persistedToSupabaseRows` + inserts service-role) → insertar conversión → `logEvent('promoted')`.
   - Contactos: NO auto-crear socios (PII de terceros). V2 lo deja fuera.
3. **Banner de import en la app**: componente `ObraCheckImportBanner` montado en el dashboard cliente (`app/cliente/dashboard` o layout cliente):
   - Detecta sesión promovible: cookie `obra_check_token` presente **o** `?session=` en la URL (el magic link ya la trae) → `GET /api/obra-check/promote?sessionId=` (nuevo GET liviano que devuelve `{ promovible: boolean, resumen: { tareas, paquetes } , yaPromovida?: obraId }`).
   - Card: «Tu plan de Obra Check ({n} tareas, {m} paquetes) está listo» + botón «Crear mi obra» → `POST promote` → redirect `/cliente/obras/{obraId}` (o la ruta del canvas de esa obra).
   - Si ya fue promovida: botón «Ver mi obra».
4. **Ajustar upsell (pantalla 3)**: el CTA y el email ya apuntan a `/auth/login?session=`; verificar que el `session` sobreviva el redirect post-login hasta el dashboard (pasarlo por query en el `redirect` del login, ya soportado por el middleware de login existente).

### Aceptación Fase C
- [ ] E2E: completar Obra Check → recibir magic link → login → banner visible → un clic → obra creada cuyo canvas en el editor real se ve igual que el paso 2 de Obra Check (mismas fases/tareas/paquetes).
- [ ] Re-clic o re-login: no duplica obra (idempotencia por `UNIQUE(session_id)`).
- [ ] Un usuario con email distinto al de la sesión y sin cookie: 403.
- [ ] Cero escrituras en tablas productivas fuera del flujo promote autenticado.

---

## Fuera de alcance V2
- Sync bidireccional obra ↔ obra-check tras la promoción.
- Auto-crear socios/invitaciones desde contactos (PII de terceros).
- Editar el canvas desde Obra Check (sigue read-only; la edición es de la app).
- Tocar archivos de `components/cliente/canvas-editor/` (solo importarlos).

## Orden recomendado
A (UX, sin backend) → B (canvas, habilita el mapeo) → C (vinculación, usa el mapeo de B). Cada fase deployable por separado.
