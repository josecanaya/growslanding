# Memoria viva

No es documentación de producto ni manual. Es **lista de reglas y decisiones** que obligan en próximas ejecuciones.

---

## Cómo mantener este archivo

- **Agregar** nuevas reglas o decisiones al final de la sección correspondiente (o en “Decisiones” con fecha).
- **No reescribir** el archivo completo ni “limpiar” entradas por iniciativa del agente. **No sustituir** decisiones anteriores salvo que un humano indique explícitamente deprecar una entrada (entonces marcar `OBSOLETO` con fecha en esa entrada, sin borrarla).
- Si dos entradas contradicen: rigen la **más reciente**, salvo una entrada marcada **CANÓNICA** que siga vigente.

---

## Cuándo escribir en memoria

Solo escribir cuando:

- el usuario corrige algo explícitamente;
- se define una nueva convención;
- se detecta un bug estructural repetible.

**No** escribir cuando:

- es un cambio técnico simple;
- se arregla un bug puntual sin impacto general;
- es una mejora menor.

---

## Prohibido en memoria

- no explicar código;
- no documentar features;
- no agregar texto largo.

---

## Formato para nuevas decisiones

Copiar y completar:

```markdown
### [YYYY-MM-DD] Título corto
- **Qué se decidió:** (una frase)
- **Ámbito:** (qué parte del sistema toca)
- **Obligación:** (qué hay que hacer o no hacer en adelante)
```

Errores conocidos (añadir, no sustituir la tabla entera):

```markdown
### BUG-[ref] Título
- Síntoma:
- Workaround:
- Estado: abierto | cerrado YYYY-MM-DD
```

---

## Reglas base — datos

- Flujo principal: Postgres + Auth + Storage vía Supabase. Patrones de cliente ya usados en el proyecto; no nuevo cliente global sin entrada en memoria.
- Cambio de esquema: migraciones alineadas; tipos y consultas coherentes.
- Accesos legacy (p. ej. ORM alternativo): tratarlos como **legacy** hasta una entrada que diga lo contrario.
- Renombrar o unificar entidades duplicadas (nombres de org, etc.) solo con cambio coordinado y **una** entrada aquí.

---

## Reglas base — flujo de negocio

Cadena **no rompible** sin decisión registrada:

`obra → tarea → bloque (subtarea) → evidencia → validación → pago → wallet`

- Tarea (línea actual): estados oficiales incluyen `pendiente`, `en_progreso`, `para_validar`, `validada`, `rechazada`; existe mapeo desde texto legacy en datos viejos.
- Bloque/subtarea: validación de bloque con evidencia cuando aplica; límites de concurrencia (tareas/bloques en progreso por socio) son reglas de negocio — no debilitar sin decisión.
- Cliente valida desde estado de revisión; pasar a `validada` dispara pagos / escrow según servicios de wallet existentes.
- Planes y comisiones: cambios que alteren cálculo de comisión o límites requieren verificación y entrada aquí si fija una nueva convención.

---

## Reglas base — seguridad

- No autorizar solo con cabeceras de organización o usuario.
- Mutaciones sobre obra/tarea/pago/asignación: validación en servidor acorde a identidad y pertenencia.
- Evidencias en almacenamiento: políticas acorde a roles; sin URLs abiertas por defecto.

---

## Reglas base — frontend

- Rutas **socio** y **cliente** son distintas: la UI del socio no reemplaza la validación que hace el cliente.
- Mocks o datos de prueba: explícitos; nada que parezca producción sin etiquetar.

---

## Errores / vigilancia (semilla)

| ID    | Qué pasa                         | Estado   |
|-------|----------------------------------|----------|
| E-001 | Naming legacy vs estados oficiales | Vigilar |
| E-002 | Dos vías de escritura datos (Supabase vs legacy) | Abierto  |
| E-003 | Confianza indebida en headers    | Preventivo |

---

## Decisiones (append solo)

### [2026-04-26] Carpeta `grows_context/`
- **Qué se decidió:** Reglas de ejecución solo en esta carpeta; no dispersar otros archivos de “contexto” sueltos en el repo.
- **Ámbito:** Entorno de trabajo del agente.
- **Obligación:** Antes de código: leer memoria y estado en esta carpeta. Decisiones repetibles: agregar aquí, no reemplazar el archivo.

### [2026-04-26] Memoria: solo sumar
- **Qué se decidió:** Este archivo no se reescribe de cero ni se “limpia” por el agente; solo nuevas entradas o marca OBSOLETO bajo instrucción.
- **Ámbito:** `01_MEMORY_REGLAS.md`.
- **Obligación:** Append de reglas; no borrado masivo de historial.

---

## Regla de escritura obligatoria

Debés escribir en memoria **siempre** que ocurra alguno de estos eventos:

- el usuario corrige una decisión o forma de hacer algo
- se detecta un bug que podría repetirse
- se define una nueva convención (naming, flujo, validación)
- se evita una mala práctica futura

Regla:

→ si hay duda entre escribir o no → **escribir**

---

## Detector de impacto

Un evento es **estructural** si afecta:

- flujo core
- estados
- pagos o wallet
- seguridad
- modelo de datos

Si toca alguno de estos:
→ **siempre** registrar en memoria

---

## Diferencia entre bug simple y estructural

**Bug simple:**

- error puntual
- no cambia forma de trabajar
→ **no** va a memoria

**Bug estructural:**

- puede volver a pasar
- revela problema de diseño o convención
→ **va** a memoria

---

## Regla de acumulación

La memoria no se limpia. Se acumula.

Regla:

- no resumir entradas anteriores
- no borrar historial
- no “ordenar” por iniciativa propia

---

## Regla de prioridad

Si una regla de memoria contradice código actual:

→ la memoria tiene prioridad para **futuras** ejecuciones

(el código se corrige después)

---

### [2026-04-27] Crear tarea desde obra + asignación en POST

- **Qué se decidió:** `POST /api/tareas` acepta cuerpo **simple** (`obra_id`, `nombre`, `descripcion`, `bloques`, `socio_id` opcional) resolviendo el **primer elemento** de la obra; insert incluye `org_id`, `dias_presupuesto` y `bloques_planificados` alineados. Líder con `leader_invites` aceptado puede crear como el owner. Asignación opcional en el mismo POST setea `responsable`, `responsable_socio_id` y `cuadrilla_id` (compat). Vista socio filtra también por `responsable_socio_id` / `cuadrilla_id`.
- **Ámbito:** API tareas, panel `/cliente/lider`, `TareasEnCurso` socio.
- **Obligación:** Sin elementos en la obra, no crear tarea (mensaje claro). No duplicar servicios; reutilizar columnas existentes.

### [2026-04-27] QR de asociación de socio
- **Qué se decidió:** Los QR personales de socio usan `qr_tokens.scope = 'socio_asociacion'` y `ref_id = socios.id`; la asociación cliente→socio se valida solo en backend y crea/reutiliza un socio en la organización del cliente.
- **Ámbito:** `api/socios/mi-qr`, `api/socios/asociar-qr`, UI socio cuenta y cliente cuadrillas.
- **Obligación:** No asociar socios confiando en `socio_id` desde frontend; siempre resolver token, verificar cliente autenticado con organización activa y evitar duplicados por email/teléfono.

### [2026-04-27] Perfil socio para QR
- **Qué se decidió:** Si un usuario autenticado con rol `SOCIO` no tiene fila en `socios`, `api/socios/mi-qr` debe resolver por `user_id`/email o crear un perfil socio mínimo validado en backend antes de emitir token QR.
- **Ámbito:** QR socio, tabla `socios`, metadata Auth.
- **Obligación:** No bloquear el QR por falta de fila si el rol Auth es `SOCIO`; evitar duplicados buscando primero por `user_id` y email.

### [2026-04-27] QR antes de asociación con organización
- **Qué se decidió:** Un socio puede generar su QR sin estar asociado a una organización. La asociación con organización ocurre después, cuando cliente/arquitecto escanea el QR.
- **Ámbito:** QR socio, tabla `socios`, asociación cliente→socio.
- **Obligación:** `api/socios/mi-qr` no debe exigir `org_id`; el `org_id` se define en el flujo de asociación posterior.

### [2026-04-24] Lenguaje: agenda de socios (UI)
- **Qué se decidió:** La relación cliente/profesional ↔ socio se entiende como agenda/contactos de obra. En UI se debe usar “Agendar socio”, “Agenda de socios” y “Socio agendado”, evitando “asociar” o “vincular” salvo nombres técnicos internos.
- **Ámbito:** Pantallas cliente (agenda, cuadrillas), cuenta socio, mensajes de producto.
- **Obligación:** Nuevo copy y CTAs alineados a agenda/contacto; rutas y tablas legacy pueden conservar nombres técnicos.

### [2026-04-24] QR/ID público sin organización previa
- **Qué se decidió:** Un socio puede generar QR/ID público para ser agendado sin pertenecer previamente a una organización cliente.
- **Ámbito:** `api/socios/mi-qr`, perfil `socios`, flujo cliente `agendar`.
- **Obligación:** No bloquear emisión de QR/ID por falta de `org_id` en el perfil del socio; la organización del cliente se valida solo al agendar.

### [2026-04-24] UI visible: agenda (sin “asociar/vincular”)
- **Qué se decidió:** En textos visibles al usuario, la relación cliente/profesional ↔ socio se dice Agenda de socios / Socio agendado / Contacto de obra; no usar “asociar” ni “vincular” en labels, modales ni CTA.
- **Ámbito:** Frontend cliente y socio.
- **Obligación:** Revisar copy en pantallas nuevas; nombres de rutas/API legacy pueden quedar en inglés o técnico.

### [2026-08-18] Corpus de conocimiento fuera del producto
- **Qué se decidió:** Construcción, concepto de Grows, patrones A→T→B y bitácora MCP viven en el repo hermano `grows-conocimiento` (Graphify). El canvas (`canvas_nodes`) sigue siendo la única fuente de verdad de la obra. No copiar obras ni PII a GitHub.
- **Ámbito:** orquestador L0, agentes, MCP.
- **Obligación:** No escribir dominio en growslanding salvo el puente anonimizado a `corpus/02_patrones` (al aceptar L0; env `GROWS_CONOCIMIENTO_ROOT`). No usar Graphify como store de un proyecto.

### [2026-08-18] Se opera chateando; canvas = horizonte
- **Qué se decidió:** El teclado es Cursor + MCP. El MCP de inteligencia apunta a `grows-conocimiento`, no al código. El front es libre; Grows da marco A→T→B, inteligencia de construcción y medición de tokens. Features pedidas se registran en `corpus/04_features/`.
- **Ámbito:** agente Cursor, MCP, UI del grafo.
- **Obligación:** No convertir el horizonte en un wizard. El agente consulta Graphify de esa carpeta y solo escribe `propuesta`.

### [2026-08-19] Dos capas: proyecto_vivo vs Uber de obra
- **Qué se decidió:** F(f)=(qT, C) vive solo en proyecto_vivo (`energy_unit_id`, `energy_quantity`, `capital_amount`, `capital_currency` USD). No es wallet ni comisión. `t_value` / gamma / sigma / criticidad / `t_formula_id` no definen energía. El FSM de tareas no se reinterpreta; al validar, el adaptador existente marca f realizada y B alcanzado.
- **Ámbito:** canvas_nodes de graph_mode=proyecto_vivo.
- **Obligación:** No llevar qT/C al wallet. No tocar presupuestos, socios ni comisiones. No sumar T de identidades distintas.
