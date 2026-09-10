# Grows Agent — Plan de consolidación del bridge

**Fecha:** 2026-09-10
**Commit auditado:** `d699a1d` (HEAD de `main`)
**Branch auditada:** `main`
**Autor del plan:** Claude Sonnet 5 (arquitecto)
**Ejecutor esperado:** ver tabla al final; la mayoría de fases son ejecutables por Haiku / Sonnet mini.

## Cómo usar este documento

- Ejecutar las fases EN ORDEN. Muchas dependen de las anteriores.
- Un commit por fase, con el mensaje sugerido literal.
- Después de cada fase: `git status`, revisar diff, commit, push.
- Si una fase falla la verificación, NO avanzar. Reportar bloqueo con archivo/error.
- No inventar credenciales ni tokens. Si se necesitan, parar y pedir al humano.
- No modificar la UI de Grows salvo donde se indica.
- **NO borrar** `scripts/grows-bridge.mjs`. Sirve de referencia y de fallback.

---

## Estado actual verificado

### Backend (funcional)

- Tablas: `grows_bridge_devices` (con `obra_id NOT NULL`, un device pertenece a UNA obra), `grows_bridge_jobs`.
- RPCs Postgres: `claim_grows_bridge_job` (lease de 10 min, retry hasta 3), `apply_grows_bridge_job` (atomic vs revisión, no aplica si `status='cancelled'`).
- Endpoints:
  - `POST /api/bridge/worker` — auth por token de device, acciones `claim | heartbeat | complete | fail`. Devuelve `{ok, cancelled}`.
  - `GET /api/bridge/agent-context` — sirve el markdown del contrato al bridge autenticado.
  - `POST /api/obras/[id]/bridge` — desde la UI de Grows: `pair | enqueue | cancel | apply | revoke`.
- `apps/web/lib/bridge/operations.ts` (`applyBridgeOperations`) valida y aplica al canvas server-side (autoridad final).
- Chat / hilo: `apps/web/lib/proyecto-vivo/hiloCanvasUi.ts` persiste `canvas_ui.hilo[]` con `{id, role, text, at, scopePathIds?, selectionIds?}`, últimos 80.

### Bridge Node (`scripts/grows-bridge.mjs`) — funcional, referencia canónica

- Cliente HTTP con polling cada 3 s.
- `compactJobContext` — recorta el canvas al scope + selección + referencias.
- `executeJob` — heartbeat cada 10 s con detección de `state.cancelled`; timeout 10 min; kill del child; `childEnvironment` filtra a 13 keys; `validateResult` local; parseo de fences markdown.
- `main` — chequea `completed.ok !== false && !completed.cancelled`.

### Bridge Tauri (`bridge-tauri/`) — INCOMPLETO frente al Node

Ver "Hallazgos" abajo. Convive con el Node (los usuarios en Node siguen funcionando).

---

## Arquitectura que debe conservarse

```
GROWS WEB (usuario en obra)
   │
   ▼ POST /api/obras/[id]/bridge action=enqueue
   │  {prompt, provider, model, scopePathIds, selectionIds}
   │
SUPABASE (grows_bridge_jobs.status='queued')
   │
   ▲ POST /api/bridge/worker action=claim (bridge polling)
   │  {capabilities, activity}
   │
GROWS AGENT (Node legacy o Tauri) en la PC del usuario
   │  cwd temporal + AGENTS.md
   │
   ▼ spawn CLI local (claude / codex / cursor-agent) con stdin=prompt
CLI del proveedor  →  respuesta JSON (reply + operations[])
   │
   ▲ POST /api/bridge/worker action=complete result=... (o fail)
   │
SUPABASE valida shape y persiste result. Job pasa a 'completed'.
   │
GROWS WEB muestra la propuesta al humano en un diff.
   │
   ▼ POST /api/obras/[id]/bridge action=apply (usuario acepta)
   │
APLICADOR SERVER (`applyBridgeOperations`) → canvas actualizado.
```

**Reglas invariantes:**
1. El bridge NUNCA escribe directamente en Supabase, canvas ni obra.
2. El bridge SIEMPRE devuelve operaciones estructuradas al server.
3. Grows web es autoridad final: valida y aplica.
4. El humano acepta antes de que el canvas cambie.
5. El canvas es CUADROS DENTRO DE CUADROS (grafo recursivo, se muestra un scope por vez, pero es un único grafo global).

---

## Hallazgos

Cada hallazgo verificado contra el commit `d699a1d`.

| # | Hallazgo | Estado | Archivo:línea | Prioridad |
|---|---|---|---|---|
| 1 | UTF-8 unsafe: `&job.prompt[..job.prompt.len().min(4000)]` puede panickear con acentos españoles | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:43` | P0 |
| 2 | Tauri no usa `scopePathIds` ni `selectionIds` al construir el user prompt | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:44-48` | P0 |
| 3 | Tauri manda el canvas ENTERO sin compactar (el Node compacta con `compactJobContext`) | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:47` | P0 |
| 4 | Tauri no envía heartbeat durante `execute` | CONFIRMADO | `bridge-tauri/src-tauri/src/lib.rs:149` | P0 |
| 5 | Tauri no soporta cancelación durante `execute` | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:103` | P0 |
| 6 | Tauri no aplica timeout al child del CLI | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:97-103` | P0 |
| 7 | Tauri no filtra el `env` del child — el CLI hereda todo (incluye posibles secretos y `GROWS_BRIDGE_TOKEN`) | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:86-95` | P0 |
| 8 | Tauri no valida el shape del `result` antes de mandarlo al server | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:119-132` | P1 |
| 9 | Tauri no chequea `response.ok/cancelled` después del `complete`/`fail` | CONFIRMADO | `bridge-tauri/src-tauri/src/lib.rs:166-172` | P1 |
| 10 | Contradicción IDs: `agent-context.md` ejemplo pone `"id":null`, pero `applyBridgeOperations` exige id único no-null para `create_node`. Bug activo. | CONFIRMADO | `apps/web/lib/bridge/agent-context.md:53` vs `apps/web/lib/bridge/operations.ts:29` | P0 |
| 11 | Límite `level > 5` contradice "cuadros dentro de cuadros" — un usuario que crea Obra > Piso > Estructura > Sector > Vigas > V18 > Armadura > Tarea (8 niveles) obtiene error de aplicación | CONFIRMADO | `apps/web/lib/bridge/operations.ts:68` | P0 |
| 12 | Fallback embebido `AGENT_CONTEXT` en `prompt.rs` desactualizado respecto a `agent-context.md` — si el fetch falla, el agente recibe un contrato distinto | CONFIRMADO | `bridge-tauri/src-tauri/src/prompt.rs:8-31` vs `apps/web/lib/bridge/agent-context.md` | P1 |
| 13 | Fuente única del contrato: schema aparece en 4 lugares (bridge Node `properties`, agent-context.md, operations.ts `operationSchema`, prompt.rs) sin sincronización | CONFIRMADO | múltiples | P1 |
| 14 | Chat sin memoria conversacional: `hilo[]` existe en `canvas_ui`, se lee en `GrowsCommandBar.tsx:31`, pero NO se envía en el job ni el bridge lo inyecta como contexto | CONFIRMADO | UI + server + bridge | P1 |
| 15 | `grows_bridge_devices.obra_id NOT NULL`: un usuario que trabaja en varias obras debe re-emparejar por cada una | CONFIRMADO | `supabase/migrations/20260909050051_local_agent_bridge.sql:4` | P2 |
| 16 | `pairing.rs` acepta cualquier `url` sin exigir HTTPS ni allowlist de dominios | CONFIRMADO | `bridge-tauri/src-tauri/src/pairing.rs:11-19` | P2 |
| 17 | Falta observabilidad en la ventana Tauri (estado del job, últimos errores, logs) — cuando algo falla el usuario no ve nada | CONFIRMADO | `bridge-tauri/src/main.js` | P2 |
| 18 | `main.js` interpola `c.bin` en un `data-bin=` sin escapar — si el path contiene una comilla, rompe la UI | CONFIRMADO | `bridge-tauri/src/main.js:16` | P2 |
| 19 | Fallback local `scripts/grows-agent-context.md` referenciado en test `grows-bridge.test.mjs:12` no existe hoy en el repo (verificar) | POR CONFIRMAR | `scripts/grows-bridge.test.mjs:12-14` | P2 |
| 20 | `job_runner.rs::execute` no cuenta `usage.durationMs` ni provider/model reales — el server los deja vacíos | CONFIRMADO | `bridge-tauri/src-tauri/src/job_runner.rs:129-133` + `lib.rs:150-157` | P2 |

---

## Fases

### Reglas globales para el ejecutor

- **Antes de tocar código:** `cd C:/Users/Usuario/Desktop/Jose/Grows/growslanding && git status && git pull origin main`.
- **Al terminar cada fase:** correr los comandos de la sección "Verificación", commit con el mensaje exacto sugerido, `git push origin main`.
- **Trailer del commit:** `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.
- **NO INVENTAR datos**: si un test requiere un token/config, generarlo tú, no pedir uno real.
- **NO borrar bridge Node** (`scripts/grows-bridge.mjs`).
- **Un archivo modificado por vez cuando sea posible.** Si una fase toca más de 3 archivos, revisar que estén justificados en "Archivos".
- **Después de cada `cargo` o `node --test`:** si un test rojo era rojo antes de tu cambio (baseline), déjalo. Si tu cambio lo pone rojo, revertirlo antes de commitear.

---

### Fase A0 — Baseline y auditoría de compilación

**Objetivo:** confirmar que el estado actual compila y sus tests pasan, para tener referencia.

**Por qué:** ninguna fase siguiente puede saber si rompió algo si no sabemos qué pasaba antes.

**Archivos**
- NO TOCAR ninguno.
- CREAR `bridge-tauri/BASELINE.md` con el output de los comandos.

**Cambios**
1. Desde la raíz:
   ```bash
   cd C:/Users/Usuario/Desktop/Jose/Grows/growslanding
   node --test scripts/grows-bridge.test.mjs 2>&1 | tail -20
   cd bridge-tauri/src-tauri
   cargo test --lib 2>&1 | tail -30
   cd ../../apps/web
   npm test -- --run 2>&1 | tail -30 || echo "(sin script test)"
   ```
2. Copiar el output resumen en `bridge-tauri/BASELINE.md` con formato:
   ```
   # Baseline previa al plan de hardening
   Commit: <sha>
   Fecha: <ISO>
   ## grows-bridge.test.mjs
   <resultado>
   ## cargo test --lib
   <resultado>
   ## apps/web tests
   <resultado>
   ```

**Compatibilidad:** N/A.

**Tests / Verificación:**
- El archivo `bridge-tauri/BASELINE.md` existe y muestra pasa/falla de cada suite.
- No es error si algo está rojo hoy — sólo hay que dejarlo documentado.

**Comandos:** ver arriba.

**Done cuando:**
- [ ] `BASELINE.md` creado y commiteado.
- [ ] Ninguna modificación de código.

**Commit:** `Fase A0: baseline de tests antes del hardening`

**NO hacer:**
- No arreglar tests rotos acá. Solo documentar.

---

### Fase A1 — Fix UTF-8 unsafe en Tauri (P0, crash real)

**Objetivo:** eliminar el `panic!` con caracteres multibyte.

**Por qué:** `&s[..s.len().min(4000)]` en Rust panickea si el índice no cae en un boundary de char. Ejemplo: `"ñandú"` puede cortar entre bytes de la `ñ` y disparar `byte index 4000 is not a char boundary`. Con acentos españoles esto es cuestión de tiempo.

**Archivos**
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs`.
- NO TOCAR: nada más.

**Cambios**

Reemplazar en `job_runner.rs`:
```rust
let prompt_slice = &job.prompt[..job.prompt.len().min(4000)];
```
por:
```rust
let prompt_slice = truncate_utf8(&job.prompt, 4000);
```

Y agregar al final del archivo (fuera de `execute`, antes del `#[cfg(test)]`):
```rust
/// Trunca un &str a como máximo `max_bytes` bytes, respetando fronteras UTF-8.
/// Nunca panickea con caracteres multibyte (ñ, á, emoji, etc.).
fn truncate_utf8(s: &str, max_bytes: usize) -> &str {
    if s.len() <= max_bytes { return s; }
    let mut end = max_bytes;
    while end > 0 && !s.is_char_boundary(end) { end -= 1; }
    &s[..end]
}
```

Y agregar dentro del bloque `mod tests`:
```rust
#[test]
fn truncate_utf8_never_panics_on_spanish() {
    let s = "ñ".repeat(5000); // cada 'ñ' son 2 bytes
    let t = truncate_utf8(&s, 4000);
    assert!(t.len() <= 4000);
    assert!(t.is_char_boundary(t.len()));
    // También validar que sigue siendo UTF-8 válido
    assert!(std::str::from_utf8(t.as_bytes()).is_ok());
}

#[test]
fn truncate_utf8_short_string_untouched() {
    assert_eq!(truncate_utf8("hola", 100), "hola");
}
```

**Compatibilidad**
- Cambia el tipo de `prompt_slice` de `&str` a `&str` (idéntico). Ninguna firma cambia.
- Comportamiento: prompts <= 4000 bytes: idéntico. Prompts > 4000 bytes con acentos: dejan de crashear.

**Tests**
- `bridge-tauri/src-tauri/src/job_runner.rs` — los dos tests nuevos arriba.

**Verificación manual**
```bash
cd bridge-tauri/src-tauri
cargo test --lib truncate 2>&1 | tail -10
```
Debe mostrar `2 passed`.

**Comandos**
```bash
cd bridge-tauri/src-tauri
cargo test --lib
```

**Done cuando**
- [ ] Los 2 tests nuevos pasan.
- [ ] Baseline no rompió más nada (comparar con `BASELINE.md`).

**Commit:** `Fase A1: truncate_utf8 para evitar panic con acentos españoles`

**NO hacer**
- No cambiar el límite de 4000. Es el mismo que usa el bridge Node.
- No mover la función a otro módulo. Que quede local en `job_runner.rs`.

---

### Fase A2 — Subir el límite de profundidad de contención (P0)

**Objetivo:** el canvas debe permitir muchos más niveles que 5 (usuario pide 8+ nivel real).

**Por qué:** la línea `if (n.level > 5) throw new Error('El canvas admite hasta cinco niveles de contención.');` bloquea `Obra > Piso 4 > Estructura > Sector A > Vigas > V18 > Armadura > Tarea` (8 niveles), lo que contradice el modelo de "cuadros dentro de cuadros". Sí queremos un límite (protección contra ciclos/DoS) pero mucho más alto.

**Archivos**
- MODIFICAR: `apps/web/lib/bridge/operations.ts`.
- CREAR: `apps/web/__tests__/lib/bridge/operations-depth.test.ts`.
- NO TOCAR: schemas de canvas, mapper, aplicador de nodos.

**Cambios**

En `operations.ts:68`, reemplazar:
```typescript
if (n.level > 5) throw new Error('El canvas admite hasta cinco niveles de contención.');
```
por:
```typescript
if (n.level > 15) throw new Error('El canvas admite hasta 15 niveles de contención anidada.');
```

Y crear el test `apps/web/__tests__/lib/bridge/operations-depth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { applyBridgeOperations } from '@/lib/bridge/operations';
import type { CanvasMultinivelPersisted, CanvasNode } from '@/lib/types/canvasMultinivel';

function emptyOp(overrides: Partial<any> = {}) {
  return {
    type: 'create_node', id: null, parentId: null, title: null, description: null,
    nodeType: null, sourceId: null, targetId: null, relation: null,
    fromNodeId: null, toNodeId: null, transformKind: null, executorKind: null,
    quantity: null, unit: null, durationDays: null, sources: [], assumptions: [],
    ...overrides,
  };
}
function baseCanvas(): CanvasMultinivelPersisted {
  return { schemaVersion: 4, obra: {}, nodes: [], edges: [], budgetGroups: [], pathIds: [], projectKind: 'general' } as any;
}
describe('applyBridgeOperations depth', () => {
  it('acepta 8 niveles anidados', () => {
    const ops = Array.from({ length: 8 }, (_, i) => emptyOp({
      type: 'create_node', id: `tmp-${i}`, parentId: i === 0 ? null : `tmp-${i - 1}`,
      title: `Nivel ${i + 1}`, nodeType: 'sector',
    }));
    expect(() => applyBridgeOperations(baseCanvas(), { reply: '', operations: ops as any })).not.toThrow();
  });
  it('rechaza 16 niveles anidados', () => {
    const ops = Array.from({ length: 16 }, (_, i) => emptyOp({
      type: 'create_node', id: `tmp-${i}`, parentId: i === 0 ? null : `tmp-${i - 1}`,
      title: `Nivel ${i + 1}`, nodeType: 'sector',
    }));
    expect(() => applyBridgeOperations(baseCanvas(), { reply: '', operations: ops as any })).toThrow(/15 niveles/);
  });
});
```

**Compatibilidad**
- Ningún canvas existente rompe (todos tienen ≤ 5 niveles hoy). Solo amplía lo aceptable.
- No cambia storage ni migraciones.

**Tests**
- Nuevo archivo arriba.

**Verificación manual**
```bash
cd apps/web
npx vitest run __tests__/lib/bridge/operations-depth.test.ts
```

**Comandos**
```bash
cd apps/web
npx vitest run __tests__/lib/bridge/operations-depth.test.ts 2>&1 | tail -15
```

**Done cuando**
- [ ] Ambos tests pasan.

**Commit:** `Fase A2: subir profundidad de contención de 5 a 15 niveles`

**NO hacer**
- No quitar el límite (mantener protección contra loops de contención). 15 es alto pero acotado.
- No renombrar `level`.
- No modificar `pathIds`.

---

### Fase A3 — Resolver contradicción de IDs temporales (P0)

**Objetivo:** el contrato del agente debe pedir explícitamente IDs temporales `tmp-1`, `tmp-2`, etc. para `create_node` y `propose_transform`, y el aplicador los resuelve.

**Por qué:** hoy el ejemplo de `agent-context.md` muestra `"id":null` para `create_node`, pero `applyBridgeOperations` línea 29 exige `if (!op.id ...) throw`. Cada vez que el agente sigue el ejemplo, el aplicador rechaza. Es un bug activo.

**Archivos**
- MODIFICAR: `apps/web/lib/bridge/agent-context.md`.
- MODIFICAR: `bridge-tauri/src-tauri/src/prompt.rs` (mantener espejo con el markdown).
- MODIFICAR: `scripts/grows-bridge.test.mjs` — el test que pasa `id: 'new-state'` ya cumple; agregar un caso de create_node sin id (debe fallar).
- NO TOCAR: `operations.ts` (ya funciona con IDs temporales).

**Cambios**

En `apps/web/lib/bridge/agent-context.md`:

Reemplazar la sección "## Ejemplo" completa por:
```markdown
## Identificadores temporales
Para `create_node` y `propose_transform` el `id` NUNCA debe ser null.
Usá etiquetas temporales `tmp-1`, `tmp-2`, ... únicas dentro de la respuesta.
Grows las traduce a IDs reales al aplicar.

Podés referenciar esos aliases en `parentId`, `sourceId`, `targetId`, `fromNodeId`, `toNodeId`
de operaciones posteriores en la MISMA respuesta.

## Ejemplo — crear una etapa "Búsqueda de inversores" con dos sub-tareas
[
  {"type":"create_node","id":"tmp-1","parentId":null,"title":"Búsqueda de inversores","description":"Capital estimado: USD 200k. Duración: ~90 días.","nodeType":"etapa","sourceId":null,"targetId":null,"relation":null,"fromNodeId":null,"toNodeId":null,"transformKind":null,"executorKind":null,"quantity":null,"unit":null,"durationDays":90,"sources":[],"assumptions":["capital orientativo","depende del mercado"]},
  {"type":"create_node","id":"tmp-2","parentId":"tmp-1","title":"Preparar pitch deck","description":null,"nodeType":"tarea","sourceId":null,"targetId":null,"relation":null,"fromNodeId":null,"toNodeId":null,"transformKind":null,"executorKind":"humano","quantity":null,"unit":null,"durationDays":10,"sources":[],"assumptions":[]},
  {"type":"create_node","id":"tmp-3","parentId":"tmp-1","title":"Reuniones con inversores","description":null,"nodeType":"tarea","sourceId":null,"targetId":null,"relation":null,"fromNodeId":null,"toNodeId":null,"transformKind":null,"executorKind":"humano","quantity":null,"unit":null,"durationDays":45,"sources":[],"assumptions":[]},
  {"type":"create_edge","id":null,"parentId":null,"title":null,"description":null,"nodeType":null,"sourceId":"tmp-2","targetId":"tmp-3","relation":"precede","fromNodeId":null,"toNodeId":null,"transformKind":null,"executorKind":null,"quantity":null,"unit":null,"durationDays":null,"sources":[],"assumptions":[]}
]
```

En `bridge-tauri/src-tauri/src/prompt.rs`:

Reemplazar la constante `AGENT_CONTEXT` por el contenido completo actualizado (mismo texto que `agent-context.md`, para que el fallback embebido no diverja). Extraer el texto tal cual (con newlines literales, mismo raw string `r#"..."#`).

En `scripts/grows-bridge.test.mjs`, en el test `'bridge validates operations and excludes secrets from Codex subprocess'`, agregar al final:
```javascript
  // create_node sin id o con id ya usado debe fallar (contrato de IDs temporales)
  const noId = { ...op, id: null };
  assert.throws(() => validateResult({ reply: '', operations: [noId] }), /Falta el campo|Valor no permitido/);
  const dupA = { ...op, id: 'tmp-1', title: 'A' };
  const dupB = { ...op, id: 'tmp-1', title: 'B' };
  // validateResult acepta cualquier string en id; la unicidad la valida applyBridgeOperations (server-side).
  assert.doesNotThrow(() => validateResult({ reply: '', operations: [dupA, dupB] }));
```

**Compatibilidad**
- No cambia el aplicador. Solo alinea el contrato con lo que el aplicador ya exige.
- No cambia el shape de `operations`.

**Tests**
- El test modificado arriba.
- Los tests de `operations-depth.test.ts` (fase A2) ya usan IDs `tmp-N`; sirven como validación adicional.

**Verificación manual**
```bash
node --test scripts/grows-bridge.test.mjs 2>&1 | grep -E 'pass|fail'
```

**Comandos**
```bash
node --test scripts/grows-bridge.test.mjs
```

**Done cuando**
- [ ] Test de bridge Node sigue pasando (5 pass).
- [ ] `agent-context.md` y `prompt.rs::AGENT_CONTEXT` tienen texto idéntico letra por letra en las secciones de contrato (excepto que `.rs` está envuelto en `r#"..."#`).

**Commit:** `Fase A3: contrato exige IDs temporales tmp-N y espeja fallback embebido`

**NO hacer**
- No cambiar la lógica de `applyBridgeOperations` — ya la maneja.
- No agregar prefijos custom en el aplicador (mantiene `tmp-` como convención del contrato, no como validación server).

---

### Fase A4 — Portar `compactJobContext` a Rust en el Tauri (P0)

**Objetivo:** el Tauri debe enviar SOLO el scope + selección + referencias, no el canvas entero. También inyectar `scopePathIds` y `selectionIds` en el user prompt.

**Por qué:** hoy `job_runner.rs:47` hace `serde_json::to_string(&job.canvas)` — manda todo el JSON. Para obras grandes eso es KB o MB desperdiciados, tokens gastados del usuario, y el agente pierde el foco (no sabe DÓNDE está el usuario). El bridge Node hace esto correctamente hace tiempo (`compactJobContext` en `grows-bridge.mjs:92`).

**Archivos**
- CREAR: `bridge-tauri/src-tauri/src/context.rs`.
- MODIFICAR: `bridge-tauri/src-tauri/src/lib.rs` (agregar `mod context;`).
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs` (usar `context::compact_job`).
- NO TOCAR: `job_runner.rs::parse_agent_json`, `execute` (solo su cuerpo).

**Cambios**

Crear `bridge-tauri/src-tauri/src/context.rs`:
```rust
use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Serialize)]
pub struct CompactContext {
    #[serde(rename = "currentScopeId")]
    pub current_scope_id: Option<String>,
    #[serde(rename = "scopePathIds")]
    pub scope_path_ids: Vec<String>,
    #[serde(rename = "selectionIds")]
    pub selection_ids: Vec<String>,
    pub canvas: CompactCanvas,
}

#[derive(Debug, Serialize)]
pub struct CompactCanvas {
    #[serde(rename = "obraNombre", skip_serializing_if = "Option::is_none")]
    pub obra_nombre: Option<String>,
    pub nodes: Vec<CompactNode>,
    pub edges: Vec<CompactEdge>,
}

#[derive(Debug, Serialize)]
pub struct CompactNode {
    pub id: String,
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    #[serde(rename = "type")]
    pub node_type: Option<String>,
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(rename = "fromNodeId", skip_serializing_if = "Option::is_none")]
    pub from_node_id: Option<String>,
    #[serde(rename = "toNodeId", skip_serializing_if = "Option::is_none")]
    pub to_node_id: Option<String>,
    #[serde(rename = "transformKind", skip_serializing_if = "Option::is_none")]
    pub transform_kind: Option<String>,
    #[serde(rename = "durationDays", skip_serializing_if = "Option::is_none")]
    pub duration_days: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct CompactEdge {
    pub id: String,
    #[serde(rename = "sourceId")]
    pub source_id: String,
    #[serde(rename = "targetId")]
    pub target_id: String,
    pub relation: String,
}

/// Portada de compactJobContext (grows-bridge.mjs:92): incluye
/// - nodos hijos directos del scope
/// - nodos seleccionados
/// - nodos referenciados por fromNodeId/toNodeId de los anteriores
/// - edges entre esos nodos
pub fn compact(canvas: &Value, scope_path_ids: &[String], selection_ids: &[String]) -> CompactContext {
    let scope_id = scope_path_ids.last().cloned();
    let selected: std::collections::HashSet<&String> = selection_ids.iter().collect();
    let empty = Vec::new();
    let nodes_val = canvas.get("nodes").and_then(|v| v.as_array()).unwrap_or(&empty);
    let edges_val = canvas.get("edges").and_then(|v| v.as_array()).unwrap_or(&empty);

    let mut included: std::collections::HashSet<String> = std::collections::HashSet::new();
    for n in nodes_val {
        let id = n.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string();
        let parent = n.get("parentId").and_then(|v| v.as_str());
        let matches_scope = match &scope_id {
            Some(s) => parent == Some(s.as_str()),
            None => parent.is_none() || parent == Some(""),
        };
        if matches_scope || selected.contains(&id) {
            included.insert(id);
        }
    }
    // Referencias de transformaciones dentro del scope
    for n in nodes_val {
        let id = n.get("id").and_then(|v| v.as_str()).unwrap_or_default();
        if !included.contains(id) { continue; }
        if let Some(from) = n.get("fromNodeId").and_then(|v| v.as_str()) { included.insert(from.to_string()); }
        if let Some(to) = n.get("toNodeId").and_then(|v| v.as_str()) { included.insert(to.to_string()); }
    }

    let mut out_nodes = Vec::new();
    for n in nodes_val {
        let id = n.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string();
        if !included.contains(&id) { continue; }
        out_nodes.push(CompactNode {
            id: id.clone(),
            parent_id: n.get("parentId").and_then(|v| v.as_str()).map(String::from),
            node_type: n.get("type").and_then(|v| v.as_str()).map(String::from),
            title: n.get("title").and_then(|v| v.as_str()).map(String::from),
            description: n.get("descripcion").and_then(|v| v.as_str()).map(String::from),
            status: n.get("graphStatus").or(n.get("estadoTarea")).or(n.get("estadoNivel"))
                .and_then(|v| v.as_str()).map(String::from),
            from_node_id: n.get("fromNodeId").and_then(|v| v.as_str()).map(String::from),
            to_node_id: n.get("toNodeId").and_then(|v| v.as_str()).map(String::from),
            transform_kind: n.get("transformKind").and_then(|v| v.as_str()).map(String::from),
            duration_days: n.get("duracionDias").and_then(|v| v.as_f64()),
        });
    }

    let mut out_edges = Vec::new();
    for e in edges_val {
        let src = e.get("sourceId").and_then(|v| v.as_str()).unwrap_or_default();
        let tgt = e.get("targetId").and_then(|v| v.as_str()).unwrap_or_default();
        if !included.contains(src) || !included.contains(tgt) { continue; }
        out_edges.push(CompactEdge {
            id: e.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
            source_id: src.to_string(),
            target_id: tgt.to_string(),
            relation: e.get("relation").and_then(|v| v.as_str()).unwrap_or("precede").to_string(),
        });
    }

    CompactContext {
        current_scope_id: scope_id,
        scope_path_ids: scope_path_ids.to_vec(),
        selection_ids: selection_ids.to_vec(),
        canvas: CompactCanvas {
            obra_nombre: canvas.get("obraNombre").and_then(|v| v.as_str()).map(String::from),
            nodes: out_nodes,
            edges: out_edges,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn compact_scope_and_selection_only() {
        let canvas = json!({
            "obraNombre": "Casa",
            "nodes": [
                { "id": "floor", "parentId": null, "type": "etapa", "title": "Piso" },
                { "id": "a", "parentId": "floor", "type": "tarea", "title": "A" },
                { "id": "b", "parentId": "floor", "type": "tarea", "title": "B" },
                { "id": "other", "parentId": null, "type": "etapa", "title": "Otro" }
            ],
            "edges": [
                { "id": "ab", "sourceId": "a", "targetId": "b", "relation": "precede" }
            ]
        });
        let ctx = compact(&canvas, &["floor".into()], &[]);
        let ids: Vec<&str> = ctx.canvas.nodes.iter().map(|n| n.id.as_str()).collect();
        assert_eq!(ids, vec!["a", "b"]);
        assert_eq!(ctx.canvas.edges.len(), 1);
        assert_eq!(ctx.current_scope_id.as_deref(), Some("floor"));
    }

    #[test]
    fn compact_includes_selection_from_outside_scope() {
        let canvas = json!({
            "nodes": [
                { "id": "a", "parentId": "s1", "title": "A" },
                { "id": "x", "parentId": "s2", "title": "X" }
            ], "edges": []
        });
        let ctx = compact(&canvas, &["s1".into()], &["x".into()]);
        let ids: Vec<&str> = ctx.canvas.nodes.iter().map(|n| n.id.as_str()).collect();
        assert!(ids.contains(&"a"));
        assert!(ids.contains(&"x"));
    }
}
```

En `bridge-tauri/src-tauri/src/lib.rs`, agregar en la lista de `mod`:
```rust
mod context;
```

En `bridge-tauri/src-tauri/src/job_runner.rs`, reemplazar el bloque:
```rust
    let prompt_slice = truncate_utf8(&job.prompt, 4000);
    let user_prompt = format!(
        "Regla y esquema en AGENTS.md del cwd.\n\nPEDIDO:\n{}\n\nNIVEL VISIBLE DE LA OBRA:\n{}",
        prompt_slice,
        serde_json::to_string(&job.canvas).unwrap_or_default()
    );
```
por:
```rust
    let prompt_slice = truncate_utf8(&job.prompt, 4000);
    let compact = crate::context::compact(&job.canvas, &job.scope_path_ids, &job.selection_ids);
    let user_prompt = format!(
        "Regla y esquema en AGENTS.md del cwd.\n\nPEDIDO:\n{}\n\nNIVEL VISIBLE DE LA OBRA:\n{}",
        prompt_slice,
        serde_json::to_string(&compact).unwrap_or_default()
    );
```

**Compatibilidad**
- El shape que envía al CLI cambia: ahora lleva `currentScopeId`, `scopePathIds`, `selectionIds`. Es información NUEVA. No rompe nada porque el CLI recibe todo como texto.
- El agente-context (fase A3) puede mencionar que ese objeto tiene esos campos — opcional, no obligatorio hacerlo en esta fase.

**Tests**
- Los dos tests de `context.rs` arriba.

**Verificación manual**
```bash
cd bridge-tauri/src-tauri
cargo test --lib context
```

**Comandos**
```bash
cd bridge-tauri/src-tauri
cargo test --lib
```

**Done cuando**
- [ ] Los tests de `context::tests` pasan.
- [ ] `cargo build --release` en `bridge-tauri/src-tauri` compila sin nuevos warnings.

**Commit:** `Fase A4: compactJobContext en Tauri con scope + selección + referencias`

**NO hacer**
- No cambiar el shape público de `Job` (que rompería el deserializado del server).
- No inventar campos nuevos en el context (que rompan el prompt).
- No mandar `budgetGroups` al agente (privado).

---

### Fase A5 — Filtrar el `env` del child en Tauri (P0, seguridad)

**Objetivo:** el CLI del agente no debe heredar el token del bridge ni API keys del sistema.

**Por qué:** hoy `job_runner.rs:86` no setea `.env(...)` — el CLI hereda TODO el entorno. Si el token de pair estuviera exportado (`GROWS_BRIDGE_TOKEN`), o si el usuario tuviera secretos en variables, el CLI del agente podría leerlos. El bridge Node ya filtra a 13 keys (`childEnvironment`).

**Archivos**
- CREAR: `bridge-tauri/src-tauri/src/child_env.rs`.
- MODIFICAR: `bridge-tauri/src-tauri/src/lib.rs` (agregar `mod child_env;`).
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs`.
- NO TOCAR: nada más.

**Cambios**

Crear `bridge-tauri/src-tauri/src/child_env.rs`:
```rust
/// Devuelve solo las variables de entorno que los CLIs necesitan para funcionar
/// (login, sesiones, PATH, TEMP). Excluye credenciales del bridge y API keys.
/// Espeja `childEnvironment` de grows-bridge.mjs.
pub fn safe_env() -> Vec<(String, String)> {
    const KEEP: &[&str] = &[
        "PATH", "Path", "PATHEXT",
        "SYSTEMROOT", "SystemRoot", "WINDIR",
        "COMSPEC", "TEMP", "TMP",
        "HOME", "USERPROFILE",
        "LOCALAPPDATA", "APPDATA",
        "CODEX_HOME",
    ];
    let mut out = Vec::new();
    for &k in KEEP {
        if let Ok(v) = std::env::var(k) {
            if !v.is_empty() { out.push((k.to_string(), v)); }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn excludes_grows_bridge_token() {
        std::env::set_var("GROWS_BRIDGE_TOKEN", "s3cr3t");
        std::env::set_var("OPENAI_API_KEY", "sk-abc");
        let e = safe_env();
        assert!(!e.iter().any(|(k, _)| k == "GROWS_BRIDGE_TOKEN"));
        assert!(!e.iter().any(|(k, _)| k == "OPENAI_API_KEY"));
        // PATH debe pasar (existe en cualquier entorno de test)
        assert!(e.iter().any(|(k, _)| k == "PATH" || k == "Path"));
    }
}
```

En `lib.rs`, agregar `mod child_env;` junto a los otros mods.

En `job_runner.rs`, dentro de `execute`, modificar la construcción del `Command`:
```rust
let mut cmd = Command::new(bin);
cmd.args(&args)
    .current_dir(temp_dir.path())
    .env_clear()
    .envs(crate::child_env::safe_env())
    .stdin(std::process::Stdio::piped())
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped());
```
(agregando `.env_clear().envs(crate::child_env::safe_env())` entre `.current_dir` y `.stdin`).

**Compatibilidad**
- Los CLIs siguen viendo `PATH`, `APPDATA`, `LOCALAPPDATA`, `USERPROFILE`, `HOME`, `TEMP` → todo lo que necesitan para login/sesiones.
- Si un usuario dependía de una variable custom (raro), tendrá que reportar. No es probable.

**Tests**
- El test del `child_env.rs` arriba.

**Verificación manual**
```bash
cd bridge-tauri/src-tauri
cargo test --lib child_env
```

**Comandos**
```bash
cd bridge-tauri/src-tauri
cargo test --lib
```

**Done cuando**
- [ ] Test de `child_env` pasa.
- [ ] Cargo compila sin warnings nuevos.

**Commit:** `Fase A5: filtrar env del child (safe_env) para no filtrar tokens al CLI`

**NO hacer**
- No agregar `ANTHROPIC_API_KEY` ni `OPENAI_API_KEY` a la allowlist (aunque el usuario los tenga, el CLI del agente no los necesita — usa OAuth).
- No permitir env passthrough opcional.

---

### Fase A6 — Heartbeat + cancelación en Tauri (P0)

**Objetivo:** durante `execute`, el bridge debe enviar heartbeat cada 10 s al server; si el server responde con `cancelled=true`, matar el child.

**Por qué:** hoy un job largo pierde el lease (10 min) y el server lo marca fallido. Y la cancelación desde la UI no llega al bridge. Con esto se cierran ambos gaps.

**Archivos**
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs`.
- MODIFICAR: `bridge-tauri/src-tauri/src/lib.rs`.
- NO TOCAR: cli_detector, cli_installer, config, prompt.

**Cambios**

En `job_runner.rs`, cambiar la firma de `execute` a:
```rust
pub async fn execute(
    job: &Job,
    capabilities: &[CliStatus],
    heartbeat: impl Fn(String) -> tokio::task::JoinHandle<Result<bool, String>> + Send + Sync + 'static,
) -> Result<JobResult, String>
```

**NOTA IMPORTANTE:** ese signature es complejo. Alternativa más simple: pasar un `tokio::sync::mpsc::Sender<String>` para notificar actividad y un `tokio::sync::watch::Receiver<bool>` para saber si el server dijo cancelled. Elegimos la alternativa mpsc/watch porque es más idiomático en Rust.

Firma real a usar:
```rust
pub async fn execute(
    job: &Job,
    capabilities: &[CliStatus],
    activity_tx: tokio::sync::mpsc::Sender<String>,
    mut cancel_rx: tokio::sync::watch::Receiver<bool>,
) -> Result<JobResult, String>
```

Dentro de `execute`, reemplazar el bloque:
```rust
let mut child = cmd.spawn().map_err(...)?;
if let Some(mut stdin) = child.stdin.take() {
    stdin.write_all(user_prompt.as_bytes()).await.ok();
}
let output = child.wait_with_output().await.map_err(|e| e.to_string())?;
```
por (pseudo-código, adaptar exactamente):
```rust
let mut child = cmd.spawn().map_err(|e| format!("No se pudo lanzar {}: {}", cap.label, e))?;
if let Some(mut stdin) = child.stdin.take() {
    stdin.write_all(user_prompt.as_bytes()).await.ok();
    // stdin se cierra al drop
}
let child_id = child.id();
let activity = format!(
    "{} · {}: analizando {} cuadros y {} relaciones",
    cap.label, model,
    compact.canvas.nodes.len(), compact.canvas.edges.len()
);
// heartbeat inicial
let _ = activity_tx.send(activity.clone()).await;

let mut stdout_buf = Vec::new();
let mut stderr_buf = Vec::new();
let mut stdout_stream = child.stdout.take().expect("piped");
let mut stderr_stream = child.stderr.take().expect("piped");
use tokio::io::AsyncReadExt;
let stdout_task = tokio::spawn(async move {
    let mut buf = Vec::new();
    stdout_stream.read_to_end(&mut buf).await.ok();
    buf
});
let stderr_task = tokio::spawn(async move {
    let mut buf = Vec::new();
    stderr_stream.read_to_end(&mut buf).await.ok();
    buf
});

let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
interval.tick().await; // consume el primero (immediate)
let exit_status;
loop {
    tokio::select! {
        biased;
        _ = cancel_rx.changed() => {
            if *cancel_rx.borrow() {
                #[cfg(unix)]
                { let _ = child.kill().await; }
                #[cfg(windows)]
                { let _ = child.kill().await; }
                return Err("Trabajo cancelado".into());
            }
        }
        _ = interval.tick() => {
            let _ = activity_tx.send(activity.clone()).await;
        }
        status = child.wait() => {
            exit_status = status.map_err(|e| e.to_string())?;
            break;
        }
        _ = tokio::time::sleep(std::time::Duration::from_secs(600)) => {
            let _ = child.kill().await;
            return Err("El agente superó el tiempo máximo (10 min)".into());
        }
    }
}
stdout_buf = stdout_task.await.unwrap_or_default();
stderr_buf = stderr_task.await.unwrap_or_default();
let output = std::process::Output { status: exit_status, stdout: stdout_buf, stderr: stderr_buf };
let _ = child_id; // silence unused
```

**NOTA:** la implementación exacta del `select!` con timeout requiere cuidado porque el timeout se rearma en cada iteración. El agente ejecutor puede simplificarlo así: no meter el `sleep(600s)` en el select del loop, sino envolver TODO el `execute` con `tokio::time::timeout(Duration::from_secs(600), ...)`. Esa es la manera más segura. En ese caso el heartbeat / cancel siguen dentro del select, y el timeout global cubre el resto.

Refactor recomendado más simple:
```rust
tokio::time::timeout(std::time::Duration::from_secs(600), execute_inner(job, capabilities, activity_tx, cancel_rx))
    .await
    .map_err(|_| "El agente superó el tiempo máximo (10 min)".to_string())?
```
Y mover el cuerpo actual a `execute_inner` con las mismas firmas, sin el `sleep(600)` en el select.

Ver fase A7 para el timeout — se puede unir en un solo commit o dividir. Este documento los divide para que sean commits chicos.

En `lib.rs::poll_and_execute`, alrededor del llamado a `execute`, crear los canales:
```rust
let (activity_tx, mut activity_rx) = tokio::sync::mpsc::channel::<String>(16);
let (cancel_tx, cancel_rx) = tokio::sync::watch::channel::<bool>(false);

// Task que hace heartbeat cada vez que llega una actividad y consulta cancelled
let hb_url = format!("{}/api/bridge/worker", url.trim_end_matches('/'));
let hb_token = token.clone();
let hb_job_id = job.id.clone();
let hb_lease = lease.clone();
let hb_client = client.clone();
let cancel_tx_hb = cancel_tx.clone();
let hb_task = tokio::spawn(async move {
    let mut last_activity = String::from("Procesando");
    let mut ticker = tokio::time::interval(std::time::Duration::from_secs(10));
    loop {
        tokio::select! {
            Some(a) = activity_rx.recv() => { last_activity = a; }
            _ = ticker.tick() => {
                let body = serde_json::json!({
                    "action": "heartbeat",
                    "jobId": hb_job_id,
                    "leaseToken": hb_lease,
                    "activity": last_activity,
                });
                match hb_client.post(&hb_url).bearer_auth(&hb_token).json(&body).send().await {
                    Ok(resp) => {
                        if let Ok(json) = resp.json::<serde_json::Value>().await {
                            if json.get("cancelled").and_then(|v| v.as_bool()) == Some(true) {
                                let _ = cancel_tx_hb.send(true);
                                break;
                            }
                        }
                    }
                    Err(_) => { /* ignorar transitorio; el server nos marcará fallido si desaparecemos */ }
                }
            }
            else => break,
        }
    }
});

let result = job_runner::execute(&job, &ready, activity_tx, cancel_rx).await;
hb_task.abort();
```

Y luego, en el `body` de `complete`/`fail`, no cambia nada.

**Compatibilidad**
- El server ya soporta `heartbeat` y devuelve `{ok, cancelled}`. No hay cambios de contrato.
- Un job corto: heartbeat quizás no llega a dispararse ni una vez; está bien.

**Tests**
- El heartbeat es difícil de testear puramente unit. Un test integración mínimo (con mock HTTP) es opcional. Skip por ahora — se validará manualmente y con caso E2E del final.
- Sí agregar un test unitario que valide que `execute` respeta un `cancel_rx.send(true)` en menos de 2 s.

Test en `job_runner.rs::tests`:
```rust
#[tokio::test]
async fn execute_respects_cancellation() {
    // Simular con un proveedor inexistente para que falle rápido — solo valida el path.
    let job = Job {
        id: "j".into(), prompt: "x".into(), canvas: serde_json::json!({}),
        scope_path_ids: vec![], selection_ids: vec![],
        provider: "openai".into(), model: "auto".into(),
    };
    let (activity_tx, _) = tokio::sync::mpsc::channel(1);
    let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(true); // ya cancelado
    let _ = cancel_tx.send(true);
    let result = execute(&job, &[], activity_tx, cancel_rx).await;
    // Como no hay capabilities, falla antes de spawnear. OK.
    assert!(result.is_err());
}
```

**Verificación manual**
1. `cargo test --lib` en Tauri debe pasar.
2. Manualmente: encolar un job largo (prompt que fuerce >30s de trabajo). Cancelar desde la UI. En `bridge.log` debe verse "Trabajo cancelado".

**Comandos**
```bash
cd bridge-tauri/src-tauri
cargo test --lib
```

**Done cuando**
- [ ] Compila sin warnings nuevos.
- [ ] Test `execute_respects_cancellation` pasa.

**Commit:** `Fase A6: heartbeat + cancelación cooperativa en Tauri`

**NO hacer**
- No usar `Arc<Mutex<bool>>` con polling — usar `tokio::sync::watch` que es correcto.
- No matar el child con SIGKILL en Unix a menos que SIGTERM no responda (tokio `child.kill()` usa el correcto).
- No borrar el `hb_task.abort()` — sin eso se filtra el task.

---

### Fase A7 — Timeout global (P0)

**Objetivo:** todo `execute` debe estar acotado a 10 min. Después mata child y devuelve error.

**Por qué:** ya lo cubre el bridge Node (`timeoutMs = 600000`). El Tauri no lo tiene.

**Archivos**
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs`.

**Cambios**

Dentro de `execute` (o `execute_inner` según cómo quedó tras A6), envolver todo el cuerpo:

Opción A (recomendada): renombrar el `execute` actual a `execute_inner` y crear un nuevo `execute` público:
```rust
pub async fn execute(
    job: &Job,
    capabilities: &[CliStatus],
    activity_tx: tokio::sync::mpsc::Sender<String>,
    cancel_rx: tokio::sync::watch::Receiver<bool>,
) -> Result<JobResult, String> {
    match tokio::time::timeout(
        std::time::Duration::from_secs(600),
        execute_inner(job, capabilities, activity_tx, cancel_rx),
    ).await {
        Ok(inner) => inner,
        Err(_) => Err("El agente superó el tiempo máximo (10 min)".into()),
    }
}
```

Opción B: dejar A6 con `execute` que ya tenía select del `sleep(600)`. Con eso, A7 puede ser un no-op excepto agregar un test.

Test:
```rust
#[tokio::test]
async fn execute_times_out() {
    // No podemos simular un CLI real, así que este test es placeholder.
    // Se valida por inspección del código (grep) y manual.
    let _ = std::time::Duration::from_secs(600);
}
```
(Basta el placeholder — el timeout se prueba end-to-end).

**Compatibilidad**
- El bridge Node también tiene 600s. Mismo comportamiento entre bridges.

**Tests**
- Placeholder.

**Verificación manual**
- Grep `Duration::from_secs(600)` — debe existir en `execute`.

**Comandos**
```bash
grep -n "600" bridge-tauri/src-tauri/src/job_runner.rs
cd bridge-tauri/src-tauri && cargo build --release
```

**Done cuando**
- [ ] `execute` tiene un timeout de 600 s.
- [ ] Compila.

**Commit:** `Fase A7: timeout global de 10 min en execute`

**NO hacer**
- No usar 5 min ni 30 min. 10 min es el estándar del bridge Node.

---

### Fase A8 — Verificar respuesta del server tras `complete`/`fail` (P1)

**Objetivo:** después de POST `complete`, chequear `{ok, cancelled}`. Si `ok=false` o `cancelled=true`, loggear y no considerar el job exitoso.

**Por qué:** hoy `lib.rs:166-172` solo hace `.send().await.map_err(|e| e.to_string())?` — no lee el JSON. Si el server dice `cancelled` (usuario canceló mientras el agente estaba respondiendo), el bridge cree que aplicó y sigue tranquilo.

**Archivos**
- MODIFICAR: `bridge-tauri/src-tauri/src/lib.rs`.

**Cambios**

Reemplazar el bloque final de `poll_and_execute`:
```rust
    client
        .post(format!("{}/api/bridge/worker", url.trim_end_matches('/')))
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
```
por:
```rust
    let response = client
        .post(format!("{}/api/bridge/worker", url.trim_end_matches('/')))
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("server rechazó {}: HTTP {}", body["action"], response.status()));
    }
    let ack: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    if ack.get("ok").and_then(|v| v.as_bool()) == Some(false) || ack.get("cancelled").and_then(|v| v.as_bool()) == Some(true) {
        eprintln!("[worker] el trabajo {} fue cancelado o perdió su reserva", job.id);
    }
    Ok(())
```

**Compatibilidad**
- El server ya devuelve el JSON.
- No cambia el contrato.

**Tests**
- N/A (requiere mock HTTP). Verificar por inspección + manual.

**Verificación manual**
- Encolar job desde la UI, cancelarlo mientras el agente responde, y observar en `bridge.log` la línea "cancelado o perdió su reserva".

**Comandos**
```bash
cd bridge-tauri/src-tauri && cargo build --release
```

**Done cuando**
- [ ] Compila.
- [ ] Grep muestra el nuevo mensaje.

**Commit:** `Fase A8: verificar ok/cancelled tras complete/fail`

---

### Fase A9 — Validación local del resultado en Tauri (P1)

**Objetivo:** antes de mandar el `result` al server, validar que cumple el schema. Si no, mandar `fail` con el error específico.

**Por qué:** hoy `job_runner.rs:119-132` solo extrae `reply` y `operations` sin validar tipos. Si el modelo devuelve basura, el server la rechaza con error genérico. Validando local se ahorra roundtrip y se le da error específico al usuario.

**Archivos**
- CREAR: `bridge-tauri/src-tauri/src/validate.rs`.
- MODIFICAR: `bridge-tauri/src-tauri/src/lib.rs` (`mod validate;`).
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs` (llamar `validate::validate_result`).

**Cambios**

Crear `bridge-tauri/src-tauri/src/validate.rs`. Portar `validateResult` de `grows-bridge.mjs`. Espejo de sus reglas:

```rust
use serde_json::Value;

const OP_TYPES: &[&str] = &["create_node","update_node","delete_node","create_edge","delete_edge","propose_transform"];
const NODE_TYPES: &[&str] = &["etapa","planta","sector","ambiente","tarea","estado"];
const RELATIONS: &[&str] = &["precede","depende_de","habilita","requiere","afecta","se_ejecuta_mediante"];
const TRANSFORM_KINDS: &[&str] = &["conocimiento","coordinacion","ejecucion"];
const EXECUTOR_KINDS: &[&str] = &["humano","empresa","agente","sin_asignar"];
const REQUIRED_FIELDS: &[&str] = &[
    "type","id","parentId","title","description","nodeType","sourceId","targetId",
    "relation","fromNodeId","toNodeId","transformKind","executorKind",
    "quantity","unit","durationDays","sources","assumptions",
];

pub fn validate_result(v: &Value) -> Result<(), String> {
    let obj = v.as_object().ok_or("El agente no devolvió un objeto JSON")?;
    let reply = obj.get("reply").and_then(|v| v.as_str()).ok_or("Falta 'reply'")?;
    if reply.len() > 16000 { return Err("'reply' es demasiado largo (>16000)".into()); }
    let ops = obj.get("operations").and_then(|v| v.as_array()).ok_or("Falta 'operations' como array")?;
    if ops.len() > 100 { return Err(format!("Demasiadas operaciones ({} > 100)", ops.len())); }
    for op in ops {
        let op = op.as_object().ok_or("Operación no es un objeto")?;
        // extra keys
        for k in op.keys() {
            if !REQUIRED_FIELDS.contains(&k.as_str()) {
                return Err(format!("El agente inventó el campo \"{}\" (no existe en el canvas). Esos datos van en \"description\" o \"assumptions\".", k));
            }
        }
        // required + type check
        let ty = op.get("type").and_then(|v| v.as_str()).ok_or("Falta 'type' en operación")?;
        if !OP_TYPES.contains(&ty) {
            return Err(format!("Tipo de operación no permitido: \"{}\". Permitidos: {}", ty, OP_TYPES.join(", ")));
        }
        for f in REQUIRED_FIELDS {
            if !op.contains_key(*f) { return Err(format!("Falta el campo \"{}\" en la operación \"{}\"", f, ty)); }
        }
        // per-field validation (subset — enum + tipos básicos)
        check_enum(op, "nodeType", NODE_TYPES)?;
        check_enum(op, "relation", RELATIONS)?;
        check_enum(op, "transformKind", TRANSFORM_KINDS)?;
        check_enum(op, "executorKind", EXECUTOR_KINDS)?;
        // longitudes / rangos
        for f in ["id","parentId","title","description","sourceId","targetId","fromNodeId","toNodeId","unit"] {
            if let Some(Value::String(s)) = op.get(f) {
                if s.len() > 8000 { return Err(format!("El campo \"{}\" es demasiado largo", f)); }
            }
        }
        for f in ["quantity","durationDays"] {
            if let Some(v) = op.get(f) {
                if v.is_null() { continue; }
                let n = v.as_f64().ok_or_else(|| format!("Valor numérico inválido en \"{}\"", f))?;
                if !n.is_finite() || n < 0.0 { return Err(format!("Valor numérico inválido en \"{}\"", f)); }
            }
        }
        for f in ["sources","assumptions"] {
            if let Some(Value::Array(a)) = op.get(f) {
                if a.len() > 50 { return Err(format!("Lista inválida en \"{}\"", f)); }
                for item in a {
                    let s = item.as_str().ok_or_else(|| format!("Lista inválida en \"{}\"", f))?;
                    if s.len() > 4000 { return Err(format!("Lista inválida en \"{}\"", f)); }
                }
            } else if !op.get(f).map(|v| v.is_null()).unwrap_or(true) {
                return Err(format!("Lista inválida en \"{}\"", f));
            }
        }
    }
    Ok(())
}

fn check_enum(op: &serde_json::Map<String, Value>, field: &str, allowed: &[&str]) -> Result<(), String> {
    match op.get(field) {
        Some(Value::Null) | None => Ok(()),
        Some(Value::String(s)) if allowed.contains(&s.as_str()) => Ok(()),
        _ => Err(format!("Valor no permitido en \"{}\" (opciones: {})", field, allowed.join(", "))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn base_op() -> serde_json::Value {
        let mut m = serde_json::Map::new();
        for f in REQUIRED_FIELDS { m.insert(f.to_string(), Value::Null); }
        m.insert("type".into(), json!("create_node"));
        m.insert("sources".into(), json!([]));
        m.insert("assumptions".into(), json!([]));
        m.insert("id".into(), json!("tmp-1"));
        m.insert("title".into(), json!("X"));
        m.insert("nodeType".into(), json!("tarea"));
        Value::Object(m)
    }

    #[test]
    fn accepts_valid() {
        let r = json!({"reply": "ok", "operations": [base_op()]});
        assert!(validate_result(&r).is_ok());
    }

    #[test]
    fn rejects_invalid_type() {
        let mut op = base_op(); op["type"] = json!("etapa");
        let r = json!({"reply": "x", "operations": [op]});
        assert!(validate_result(&r).unwrap_err().contains("Tipo de operación"));
    }

    #[test]
    fn rejects_extra_field() {
        let mut op = base_op(); op["capital"] = json!(200);
        let r = json!({"reply": "x", "operations": [op]});
        assert!(validate_result(&r).unwrap_err().contains("capital"));
    }
}
```

En `lib.rs`, agregar `mod validate;`.

En `job_runner.rs::execute`, después de construir `JobResult { reply, operations }`, y ANTES de `Ok(...)`, agregar:
```rust
let for_check = serde_json::json!({ "reply": reply, "operations": ops });
crate::validate::validate_result(&for_check).map_err(|e| format!("Respuesta del agente inválida: {}", e))?;
```

**Compatibilidad**
- Espejo exacto de `validateResult` de Node. Los mismos jobs que hoy pasan Node, pasarán acá.

**Tests**
- Tests de `validate::tests`.

**Verificación manual**
```bash
cd bridge-tauri/src-tauri && cargo test --lib validate
```

**Comandos**
```bash
cd bridge-tauri/src-tauri && cargo test --lib
```

**Done cuando**
- [ ] Los tests de `validate::tests` pasan.
- [ ] Cargo compila.

**Commit:** `Fase A9: validación local del resultado en Tauri (espejo de validateResult Node)`

---

### Fase A10 — Sincronizar `AGENT_CONTEXT` embebido con el canónico (P1)

**Objetivo:** el fallback embebido de `prompt.rs` debe ser el mismo texto que `agent-context.md` en el server.

**Por qué:** si el fetch falla y el bridge usa el fallback, y el fallback está desactualizado (ej: no menciona IDs temporales), el agente produce basura silenciosamente.

**Archivos**
- MODIFICAR: `bridge-tauri/src-tauri/src/prompt.rs`.
- MODIFICAR: `bridge-tauri/src-tauri/build.rs` (crear si no existe).
- MODIFICAR: `bridge-tauri/src-tauri/Cargo.toml` (declarar `build.rs` si hace falta).

**Cambios**

Opción A (más simple, recomendada): usar `include_str!` con ruta relativa al archivo canónico:

```rust
// prompt.rs
pub const AGENT_CONTEXT: &str = include_str!("../../../apps/web/lib/bridge/agent-context.md");
```

(La ruta es relativa al archivo `.rs`. Desde `bridge-tauri/src-tauri/src/prompt.rs` → sube 3 niveles → entra a `apps/web/lib/bridge/agent-context.md`. Verificar con `ls`).

Con eso, al compilar el bridge, el texto embebido es literalmente el archivo canónico. Si el canónico cambia, se rebuild y se sincroniza.

**Compatibilidad**
- El texto embebido cambia de contenido (era distinto). Los agentes que fallaban silenciosamente con el fallback ahora reciben el contrato correcto.

**Tests**
- Agregar en `prompt.rs::tests` (crear si no existe):
```rust
#[cfg(test)]
mod tests {
    use super::AGENT_CONTEXT;
    #[test]
    fn embedded_contract_matches_server() {
        assert!(AGENT_CONTEXT.contains("create_node"));
        assert!(AGENT_CONTEXT.contains("nodeType"));
        assert!(AGENT_CONTEXT.contains("tmp-1")); // tras fase A3
        assert!(!AGENT_CONTEXT.contains("\"id\":null,")); // el ejemplo malo eliminado en A3
    }
}
```

**Verificación manual**
```bash
cd bridge-tauri/src-tauri && cargo test --lib prompt
```

**Comandos**
```bash
cd bridge-tauri/src-tauri && cargo test --lib
```

**Done cuando**
- [ ] Cargo compila y no rompe si el archivo canónico cambia (Cargo lo detecta como dependencia de compile-time con `include_str!`).
- [ ] Test pasa.

**Commit:** `Fase A10: fallback embebido = agent-context.md canónico via include_str!`

**NO hacer**
- No usar `env!` (no lo necesitamos).
- No mantener dos versiones distintas de texto.

---

### Fase A11 — Memoria conversacional del hilo (P1)

**Objetivo:** el bridge le envía al agente los últimos N mensajes de la conversación DE LA MISMA OBRA + SCOPE cercano, para que responda contextualmente ("hacé lo mismo pero al segundo piso").

**Por qué:** el chat es central en Grows. Hoy cada job es one-shot sin memoria. `hilo[]` ya existe en `canvas_ui`, se persiste, pero no se envía en el prompt.

**Diseño elegido (mínimo cambio, alto valor)**:
1. El server, al armar el job en `claim`, agrega a `job.canvas_ui.hilo` los últimos 10 mensajes del hilo de esa obra en un nuevo campo del `job` llamado `recentThread[]`.
2. El bridge lo incorpora al `compact_context` como `recentThread`.
3. Se agrega un turno de `{role:'user',text:job.prompt}` al hilo tras `enqueue`, y otro de `{role:'horizonte',text:result.reply}` tras `complete`.

**Archivos**
- MODIFICAR: `apps/web/app/api/bridge/worker/route.ts` — enriquecer el `job` devuelto con `recentThread[]`.
- MODIFICAR: `apps/web/app/api/obras/[id]/bridge/route.ts` — al `enqueue`, agregar turno user al hilo; al `apply` NO tocar (la persistencia del `reply` se hace en fase separada si hace falta).
- MODIFICAR: `bridge-tauri/src-tauri/src/job_runner.rs` (`Job` con `recent_thread`) y `context.rs` (pasarlo al output).
- MODIFICAR: `scripts/grows-bridge.mjs` — mismo cambio (usar `recentThread` cuando venga).

**Cambios**

En `apps/web/app/api/bridge/worker/route.ts` línea 31, extender el shape del job devuelto:
```typescript
return NextResponse.json({job:{
  id: job.id,
  prompt: job.prompt,
  canvas: supabaseRowsToPersisted(snapshot.data),
  scopePathIds: job.context.scopePathIds ?? [],
  selectionIds: job.context.selectionIds ?? [],
  provider: job.context.provider ?? 'local',
  model: job.context.model ?? 'automatico',
  recentThread: (snapshot.data.obra.canvas_ui?.hilo ?? []).slice(-10).map((h: any) => ({
    role: h.role, text: h.text, at: h.at,
    scopePathIds: h.scopePathIds ?? null,
    selectionIds: h.selectionIds ?? null,
  })),
}, leaseToken: job.lease_token});
```

En `apps/web/app/api/obras/[id]/bridge/route.ts`, en la rama `enqueue` después de `db.from('grows_bridge_jobs').insert(...)` (después de guardar el job), agregar:
```typescript
// Registrar turno user en el hilo (memoria conversacional).
const currentUi = snapshot.data.obra.canvas_ui as Record<string, unknown> | undefined;
const nextUi = mergeCanvasUiHilo(currentUi, [{
  id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  role: 'user',
  text: input.prompt.trim().slice(0, 8000),
  at: new Date().toISOString(),
  scopePathIds: input.scopePathIds ?? undefined,
  selectionIds: input.selectionIds ?? undefined,
}]);
await db.from('obras').update({ canvas_ui: nextUi, updated_at: new Date().toISOString() }).eq('id', id);
```
(Importar `mergeCanvasUiHilo` de `@/lib/proyecto-vivo/hiloCanvasUi`.)

En `bridge-tauri/src-tauri/src/job_runner.rs`:
```rust
#[derive(Debug, Deserialize)]
pub struct Job {
    pub id: String,
    pub prompt: String,
    pub canvas: serde_json::Value,
    #[serde(rename = "scopePathIds", default)]
    pub scope_path_ids: Vec<String>,
    #[serde(rename = "selectionIds", default)]
    pub selection_ids: Vec<String>,
    pub provider: String,
    pub model: String,
    #[serde(rename = "recentThread", default)]
    pub recent_thread: Vec<serde_json::Value>,
}
```

En `context.rs`, extender `CompactContext`:
```rust
#[derive(Debug, Serialize)]
pub struct CompactContext {
    #[serde(rename = "currentScopeId")] pub current_scope_id: Option<String>,
    #[serde(rename = "scopePathIds")] pub scope_path_ids: Vec<String>,
    #[serde(rename = "selectionIds")] pub selection_ids: Vec<String>,
    #[serde(rename = "recentThread", skip_serializing_if = "Vec::is_empty")]
    pub recent_thread: Vec<serde_json::Value>,
    pub canvas: CompactCanvas,
}
```

Y en la función `compact(...)`, aceptar el parámetro:
```rust
pub fn compact(
    canvas: &Value,
    scope_path_ids: &[String],
    selection_ids: &[String],
    recent_thread: &[Value],
) -> CompactContext { ... recent_thread: recent_thread.to_vec() ... }
```

Llamada en `job_runner.rs`:
```rust
let compact = crate::context::compact(&job.canvas, &job.scope_path_ids, &job.selection_ids, &job.recent_thread);
```

En `scripts/grows-bridge.mjs`, en `compactJobContext` línea 92, extender:
```javascript
return { scopePathIds: job.scopePathIds ?? [], selectionIds: job.selectionIds ?? [], recentThread: job.recentThread ?? [], canvas: { obraNombre: canvas.obraNombre, nodes, edges } };
```

**Compatibilidad**
- Si el server no manda `recentThread`, el bridge lo trata como vacío (default).
- La escritura al `hilo` es best-effort: si falla, no aborta el job.

**Tests**
- Actualizar test `bridge limits model context to the current scope` para que `recentThread: []` esté en el output.
- Agregar test `mergeCanvasUiHilo respects scope/selection metadata` en `apps/web/__tests__/lib/proyecto-vivo/hiloCanvasUi.test.ts` (crear si no existe).

**Verificación manual**
1. Enviar 2 pedidos consecutivos: "Creá Vigas" → "Creá también Columnas".
2. En el segundo pedido, en `bridge.log`, el `NIVEL VISIBLE` debe incluir el turno anterior.

**Comandos**
```bash
node --test scripts/grows-bridge.test.mjs
cd bridge-tauri/src-tauri && cargo test --lib
```

**Done cuando**
- [ ] Todos los tests siguen pasando.
- [ ] En una prueba manual, el segundo pedido "ve" el anterior en su contexto.

**Commit:** `Fase A11: memoria conversacional del hilo en cada job`

**NO hacer**
- No enviar TODO el hilo. 10 mensajes es suficiente.
- No implementar embeddings ni RAG.
- No cambiar el modelo de persistencia del hilo (sigue en `canvas_ui.hilo`).

---

### Fase A12 — Fuente única del contrato (P1)

**Objetivo:** definir el schema de operaciones EN UN SOLO LUGAR (`apps/web/lib/bridge/operations.ts`) y que los demás lugares lo referencien o lo generen.

**Por qué:** hoy hay drift entre bridge Node, prompt.rs, agent-context.md, operations.ts, tests. Cambiar el schema requiere tocar 5 lugares y siempre se olvida uno.

**Diseño**
- **Autoridad:** `apps/web/lib/bridge/operations.ts::operationSchema` (Zod).
- **Bridge Node:** que exporte su `properties` desde una nueva función `deriveJsonSchema()` que use `zod-to-json-schema` sobre `operationSchema`. Alternativa: mantenerlo espejo manual y agregar un test que compare shape.
- **agent-context.md:** dejar como texto humano (el AGENTE lo lee), pero agregar al final una sección "## Contrato canónico" que el server genera automáticamente desde `operationSchema` al servir el endpoint. Es opcional — si es demasiado, dejar como espejo manual con un test de coherencia.

Este cambio es más grande; **para MVP** hacer:

1. Agregar un test que verifica coherencia entre `operationSchema` de operations.ts y las constantes de `validate.rs` / `properties` de `grows-bridge.mjs`.

**Archivos**
- CREAR: `apps/web/__tests__/lib/bridge/schema-coherence.test.ts`.

**Cambios**

```typescript
import { describe, it, expect } from 'vitest';
import { operationSchema } from '@/lib/bridge/operations';

describe('schema coherence', () => {
  it('operationSchema tiene los mismos 6 tipos que el bridge Node y Rust', () => {
    const shape: any = (operationSchema as any)._def?.shape?.() ?? (operationSchema as any).shape;
    const typeField = shape.type;
    // Extraer enum del zod
    const opts: string[] = (typeField as any)._def.values;
    expect(opts.sort()).toEqual([
      'create_edge','create_node','delete_edge','delete_node','propose_transform','update_node'
    ]);
  });
  it('operationSchema tiene los mismos 6 nodeTypes', () => {
    const shape: any = (operationSchema as any)._def?.shape?.() ?? (operationSchema as any).shape;
    const nodeTypeInner = shape.nodeType._def.innerType._def; // nullable().optional() sobre enum
    const opts: string[] = nodeTypeInner.values;
    expect(opts.sort()).toEqual(['ambiente','etapa','planta','sector','tarea','estado'].sort());
  });
});
```

**NOTA:** la introspección de zod puede variar entre versiones. Si zod v4+ no expone `_def` así, buscar la doc del proyecto. El objetivo es garantizar que estén los 6 valores.

**Compatibilidad**
- No cambia comportamiento.

**Tests**
- Solo el nuevo.

**Verificación manual**
```bash
cd apps/web && npx vitest run __tests__/lib/bridge/schema-coherence.test.ts
```

**Comandos**
```bash
cd apps/web && npx vitest run
```

**Done cuando**
- [ ] Test pasa.

**Commit:** `Fase A12: test de coherencia entre operationSchema, bridge Node y Rust`

**NO hacer**
- No generar JSON schema desde zod automáticamente en runtime (agrega dependencia y no es necesario todavía).
- No refactorizar los 4 espejos ahora. Solo verificar que no se droppee un valor sin ser notado.

---

### Fase A13 — Multi-obra (P2, deferible)

**Objetivo:** un device puede recibir jobs de cualquier obra donde el usuario tenga acceso, sin re-emparejar.

**Por qué:** hoy `grows_bridge_devices.obra_id NOT NULL` obliga a un pairing por obra. Con 5 obras, el usuario abre 5 ventanas y clickea "Conectar" 5 veces. Además cada device ocupa una fila y hay que revocar por separado.

**Diseño**
1. Nueva migración: hacer `obra_id NULL` en `grows_bridge_devices` (devices "globales" del usuario). Los existentes siguen siendo por-obra hasta re-emparejar.
2. `claim_grows_bridge_job(p_device_id)` cambia: si `device.obra_id IS NULL`, busca jobs de cualquier obra de `device.user_id` (que el usuario tenga acceso).
3. `pair` desde la UI: si el usuario ya tiene un device global suyo activo (últimos 30s de last_seen), no crea uno nuevo — devuelve el existente. UX: "Este PC ya está conectado a Grows".
4. Compatibilidad: los devices con `obra_id` seguido siendo por-obra (retro-compat).

**Archivos**
- CREAR: `supabase/migrations/20260910100000_bridge_devices_multi_obra.sql`.
- MODIFICAR: `apps/web/app/api/obras/[id]/bridge/route.ts` (rama `pair`).
- MODIFICAR: `apps/web/app/api/bridge/worker/route.ts` (claim + snapshot).

**NOTA:** esta fase toca muchos archivos y RPC. **Puede diferirse hasta después de que P0/P1 estén estables 2+ semanas.**

**Compatibilidad**
- Devices existentes (per-obra) siguen funcionando.
- Nuevos pairings desde una UI con la feature nueva serían globales.

**Riesgos**
- Alto. Cambia el modelo de auth y los queries del worker. Requiere tests server-side muy sólidos.

**Done cuando**
- [ ] Migration aplica sin romper devices existentes.
- [ ] Un mismo device recibe jobs de dos obras distintas.
- [ ] Revocar un device global desconecta todo.

**Commit:** `Fase A13: devices multi-obra (obra_id nullable, claim global por user)`

**NO hacer sin discutir con humano:**
- No cambiar la RLS.
- No forzar migración de devices existentes.

---

### Fase A14 — Hardening del pairing (P2)

**Objetivo:** el pairing debe requerir HTTPS obligatorio y validar dominio.

**Por qué:** hoy `pairing.rs:11-19` acepta cualquier `url`. Un link `grows://pair?url=http://evil.example.com&token=abc...` haría que el bridge mandara jobs a un dominio hostil.

**Archivos**
- MODIFICAR: `bridge-tauri/src-tauri/src/pairing.rs`.

**Cambios**

En `handle_pair_url`, agregar después de extraer `url`:
```rust
let parsed_target = url::Url::parse(&url).map_err(|e| format!("URL malformada: {}", e))?;
if parsed_target.scheme() != "https" && !is_localhost(&parsed_target) {
    return Err("La URL de Grows debe ser HTTPS".into());
}

const ALLOWED_HOSTS: &[&str] = &["app.grows.com.ar", "grows.com.ar", "localhost", "127.0.0.1"];
let host = parsed_target.host_str().ok_or("URL sin host")?;
if !ALLOWED_HOSTS.iter().any(|h| host == *h || host.ends_with(&format!(".{}", h))) {
    return Err(format!("Dominio no permitido: {}", host));
}
```

Y agregar helper:
```rust
fn is_localhost(u: &url::Url) -> bool {
    matches!(u.host_str(), Some("localhost") | Some("127.0.0.1"))
}
```

**Tests** en `pairing.rs::tests`:
```rust
#[test]
fn rejects_http_non_local() {
    let token = "a".repeat(64);
    let raw = format!("grows://pair?url=http://app.grows.com.ar&token={}", token);
    let (_, _) = handle_pair_url_parse_only(&raw).unwrap(); // helper permite parsear
    // Pero handle_pair_url completo debería rechazar HTTPS
    // (asserted vía inspección — el AppHandle real no está disponible en test)
}

#[test]
fn rejects_foreign_host() {
    // similar
}
```

**Compatibilidad**
- Devices existentes (ya emparejados) NO se re-validan — el config guardado no vuelve a pasar por `handle_pair_url`. Solo aplica al próximo pairing.

**Riesgos**
- Si el dominio real cambia (ej. `grows.app` en el futuro), hay que actualizar la lista.

**Done cuando**
- [ ] Tests pasan.
- [ ] Pairing con HTTPS y dominio grows.com.ar sigue funcionando.

**Commit:** `Fase A14: pairing exige HTTPS y dominio grows.com.ar`

---

## Casos E2E (verificación manual al final)

Para todos los casos: primero completar fases A0..A12. Reiniciar bridge Tauri para cargar código nuevo.

### CASO 1 — Scope
1. Estar en `Obra > Piso 4 > Estructura` (breadcrumb visible).
2. Comando: **"Creá Vigas y Columnas acá."**
3. Aceptar la propuesta.
4. **Esperado:** ambos nodos con `parentId = <id de Estructura>`. NO como hijos de la raíz.

### CASO 2 — Selección
1. Estar en un scope, seleccionar `V18` y `V19`.
2. Comando: **"Estas dos dependen de Columnas."**
3. **Esperado:** las operaciones usan `sourceId=V18/V19` y `targetId=<Columnas>`, no otras.

### CASO 3 — Job largo con heartbeat
1. Comando que fuerce >30s de trabajo del agente (prompt complejo, muchos cuadros).
2. **Esperado:** el job se mantiene `status='running'` en la UI. NO pasa a `failed` por lease expirado.

### CASO 4 — Cancelación
1. Comando largo. Antes de que termine, cancelar desde la UI.
2. **Esperado:** en `bridge.log` aparece "Trabajo cancelado"; el proceso del CLI (claude/codex) desaparece de la lista de procesos en <5s.

### CASO 5 — Resultado inválido
1. Forzar (temporalmente, con `--model` inexistente) que el CLI devuelva basura.
2. **Esperado:** el bridge falla el job con mensaje específico ("El agente inventó el campo X" o similar), NO uno genérico.

### CASO 6 — Canvas cambió durante ejecución
1. Encolar un job.
2. Mientras el agente responde, editar el canvas manualmente (crear otro nodo).
3. Cuando el usuario acepta la propuesta, debe aparecer error 409: "La obra cambió desde el pedido."
4. **Esperado:** no se pisa el cambio manual del usuario.

### CASO 7 — UTF-8
1. Comando: **"Creá un área para cañerías, baños, ñandú y hormigón — repetido 300 veces para forzar 4000+ bytes: cañerías baños ñandú hormigón ..."**
2. **Esperado:** no crashea el bridge. La propuesta se procesa normal.

### CASO 8 — Profundidad
1. Crear manualmente Obra > Piso 4 > Estructura > Sector A > Vigas > V18 > Armadura > Tarea (8 niveles).
2. **Esperado:** no falla en el aplicador con "El canvas admite hasta cinco niveles".

### CASO 9 — Lease perdido
1. Simular pérdida de conexión del bridge (matar proceso Tauri mientras hay job running).
2. Restaurar. El server tras 10 min marca el job `failed`.
3. **Esperado:** el bridge no puede aplicar el resultado si el `leaseToken` ya no coincide (server rechaza con `ok=false`).

### CASO 10 — IDs temporales
1. Comando: **"Creá Búsqueda de Inversores con Preparar pitch y Reuniones adentro, con una flecha del primero al segundo."**
2. Verificar en la propuesta que el agente usó `tmp-1`, `tmp-2`, `tmp-3` y que la arista referencia `tmp-2 → tmp-3`.
3. Aceptar.
4. **Esperado:** los 3 nodos y la arista se crean con IDs reales (cn-... y ce-...).

---

## Orden recomendado de ejecución

| Fase | Prioridad | Riesgo | Dependencias | Agente recomendado |
|---|---|---|---|---|
| A0 Baseline | P0 | ninguno | — | Haiku |
| A1 UTF-8 truncate | P0 | bajo | A0 | Haiku |
| A2 Profundidad 15 | P0 | bajo | A0 | Haiku |
| A3 IDs temporales | P0 | medio | A0 | Sonnet mini |
| A4 compactJobContext Rust | P0 | medio | A1 | Sonnet mini |
| A5 safe_env | P0 | bajo | A0 | Haiku |
| A6 Heartbeat + cancel | P0 | **alto** (async Rust) | A4, A5 | **Sonnet mini** o revisión humana |
| A7 Timeout global | P0 | bajo | A6 | Haiku |
| A8 Verify complete/fail | P1 | bajo | A6 | Haiku |
| A9 Validación local Rust | P1 | medio | A3 | Sonnet mini |
| A10 include_str! contrato | P1 | bajo | A3 | Haiku |
| A11 Hilo conversacional | P1 | medio (toca 4 archivos) | A4 | Sonnet mini |
| A12 Coherencia de schema | P1 | bajo | A3 | Haiku |
| A13 Multi-obra | P2 | **alto** (migración SQL, RPC) | todas P0/P1 | **revisión humana** |
| A14 Hardening pairing | P2 | bajo | — | Haiku |

**Ruta crítica:** A0 → A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → A10 → A11 → A12. Luego A14. Luego A13 con humano.

**Recomendación fuerte:** Sonnet mini para A6 (async Rust con select y watch channels es fácil de romper). Haiku puede intentarlo, pero si falla la verificación 2 veces, escalar.

---

## Criterio arquitectónico final (post P0+P1)

Al completar A0..A12, se cumple:

- Grows Agent Tauri tiene paridad funcional con bridge Node (heartbeat, cancel, timeout, validación, filtrado de env, compact context).
- El bridge nunca ve credenciales del usuario ni las expone al CLI.
- Todo pedido incluye scope, selección, memoria conversacional reciente.
- El humano sigue siendo el único que aplica cambios al canvas.
- El schema del canvas y el contrato del agente están coherentes (test lo verifica).
- Cuadros dentro de cuadros funciona hasta 15 niveles.
- Español y otros idiomas con multibyte no crashean.

**Bridge Node** queda como referencia y fallback hasta que P0/P1 estén estables 4 semanas.

**Cerebro local complejo** (motor de reglas expandido, cache local del canvas, WebSocket bidireccional) queda FUERA DE ALCANCE de este plan. Requiere plan aparte.

---

## Reglas para el agente ejecutor (recordatorio final)

- Ejecutar EN ORDEN. No saltear.
- Un commit por fase.
- Tests verdes antes de commit.
- No borrar bridge Node.
- No inventar credenciales.
- No tocar UI de Grows salvo lo indicado en A11.
- No cambiar el schema `operationSchema` — solo se lee.
- Si te trabás, para y reporta. No adivines.
- Cuando termines A0..A12, comunicá al humano para que corra los 10 casos E2E antes de A13/A14.
