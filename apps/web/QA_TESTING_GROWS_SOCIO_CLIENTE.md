# QA / Testing Grows — Roles SOCIO y CLIENTE

**Tipo de auditoría:** revisión estática del código en `apps/web`, inventario de rutas/APIs/tablas, flags de mock, riesgos de permisos y **ejecución automatizada limitada** (`pnpm test` / Vitest sobre utilidades de canvas/XML).  
**No ejecutado en este informe:** navegación real con login, llamadas HTTP medidas en red, ni pruebas en dispositivo móvil.

---

## Resumen ejecutivo


| Área                                                                                                       | Estado (inferido)                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente (panel)**                                                                                        | Rutas bajo `/cliente/*` con middleware de rol; dashboard actual (`ClienteDashboardContent`) consume **Supabase vía** `GET /api/tareas?org_id=`. **Varias pantallas legacy/home móvil usan datos MOCK fijos** — no confundir con producción.                                                                            |
| **Socio (panel)**                                                                                          | Rutas bajo `/socio/*`; datos reales salvo `NEXT_PUBLIC_SOCIO_USE_MOCK=true` o flags de presupuestos/ahora demo.                                                                                                                                                                                                        |
| **Flujo E2E principal** (obra → tarea → presupuesto → socio ejecuta → evidencia → cliente valida → wallet) | **No verificado end-to-end aquí.** El código muestra caminos API claros; puntos frágiles históricos: **doble esquema org** (`organizations` / `organizaciones`), **wallet cliente vs socio** (`/api/cliente/wallet/*` vs `/api/wallet/*`), **RLS** vs **service role** en rutas, y **MercadoPago** condicionado a env. |


### Top 10 riesgos críticos / a validar en QA manual

1. `**middleware` en desarrollo:** si `NODE_ENV=development` **o** `NEXT_PUBLIC_DEV_MODE=true`, **se omite autenticación y roles** → no representa producción.
2. `**ClienteDashboardContent`** usa `fetch('/api/tareas?org_id=…')`; si falla o `orgId` falta (onboarding), actividad queda vacía sin error visible al usuario.
3. **Componentes cliente con mocks estáticos:** `HomeDesktop`, `HomeMobile`, `MobileHome` (obras KPI), `CargaElementosPanel` (elementos fallback), `DetalleObra` (plantas demo), `LegajoSection` (categorías mock) pueden **dar sensación de “funciona” sin backend**.
4. `**NEXT_PUBLIC_DEMO_VIDEO` / `?demo=1`:** fuerza mocks de obras/tareas en `TareasSection` / flujos asociados (`demoVideoData.ts`).
5. **Socio mock:** `NEXT_PUBLIC_SOCIO_USE_MOCK=true` activa datos falsos en AhoraSection, HomeSolicitudes, Oportunidades, etc.
6. `**NotificacionService`** y otros servicios usan **Prisma + Supabase**; notificaciones “duales” pueden desalinearse si una vía falla.
7. **Wallet cliente:** pantalla usa `/api/cliente/wallet/*` (RPC/tablas cliente). Wallet socio usa `/api/wallet/saldo` etc. (**distinto modelo**) — errores de “no cobré” pueden ser esperar el endpoint equivocado al documentar bugs.
8. **MercadoPago:** `isMercadoPagoConfigured()` exige `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY`; sin ellos los flujos de pago pueden fallar o quedar incompletos (no es “mock” deliberado en UI — es gated por configuración).
9. **Storage evidencias:** subida típica vía `**POST /api/upload/photo`** (bucket `evidencias`, `publicUrl`); cliente muestra URLs absolutas o path + `getPublicUrl` → si el bucket **no es público**, las imgenes fallan en cliente aunque el estado FSM sea correcto.
10. `**GET /api/tareas` filtros `.eq('estado', estado)`:** sólo valores oficiales FSM en tipado; valores legacy en DB pueden excluir tareas si se filtran mal desde cliente.

### Próximo paso recomendado

Ejecutar **matriz QA manual** (staging con datos reales) con **dos usuarios** (CLIENTE_TECNICO + SOCIO) y **middleware de prod simulado** (`NODE_ENV=production`, sin `NEXT_PUBLIC_DEV_MODE`). Registrar status HTTP en DevTools contra la tabla de APIs más abajo. Opcional: añadir Playwright/Cypress después del diagnóstico.

---

## 1. Preparación (`apps/web`)

### 1.1 Rutas CLIENTE (`app/cliente/`)


| Ruta                                                                                                                                                                                                  | Notas rápidas                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `/cliente`                                                                                                                                                                                            | Entry                                                                 |
| `/cliente/dashboard`                                                                                                                                                                                  | `ClienteDashboardContent` → `GET /api/tareas?org_id=`                 |
| `/cliente/obras`, `/cliente/obras/nueva`, `/cliente/obras/[obraId]`                                                                                                                                   | Flujo obras                                                           |
| `/cliente/tareas`, `/cliente/tareas/[obraId]`, `…/editor`, `…/resumen`                                                                                                                                | Tareas por obra                                                       |
| `/cliente/presupuesto`                                                                                                                                                                                | Presupuestos cliente                                                  |
| `/cliente/validar`                                                                                                                                                                                    | `ValidarSection` sin filtro obra (Supabase directo + subtareas merge) |
| `/cliente/billetera`                                                                                                                                                                                  | `useWalletCliente` → `/api/cliente/wallet/*`                          |
| `/cliente/asignar`, `/cliente/cuadrillas`, `/cliente/cuenta`, `/cliente/notificaciones`, `/cliente/onboarding`, `/cliente/agenda-socios`, `/cliente/organiza`, `/cliente/etapas`, `/cliente/lider`, … | Varias usan Supabase cliente o APIs listadas                          |


**Protección:** `middleware.ts` → prefijo `/cliente` permitido sólo `**ADMIN`** y `**CLIENTE_TECNICO**`. CLIENTE técnico **sin `org_id` en metadata** → redirect onboarding.

**Excepción DEV:** middleware retorna `next()` sin auth si desarrollo/`NEXT_PUBLIC_DEV_MODE`.

### 1.2 Rutas SOCIO (`app/socio/`)


| Ruta                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/socio`, `/socio/panel`, `/socio/ahora`, `/socio/ahora/demo`                                                                                                                           |
| `/socio/tareas`, `/socio/obras`, `/socio/presupuestos`, `/socio/presupuestos/ejemplo`                                                                                                   |
| `/socio/evidencias`, `/socio/billetera`, `/socio/cuenta`, `/socio/cuadrilla`, `/socio/notificaciones`, `/socio/mensajes`, `/socio/jornadas`, `/socio/ganancias`, `/socio/oportunidades` |


**Protección:** `/socio` → `ADMIN`, `SOCIO`.

### 1.3 Mocks / datos fake (activación)


| Mecanismo                                                             | Archivo / uso                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SOCIO_USE_MOCK=true`                                     | `lib/mocks/socioMockData.ts` — Ahora, home solicitudes, oportunidades, etc.          |
| `NEXT_PUBLIC_SOCIO_AHORA_MOCK`, `NEXT_PUBLIC_SOCIO_PRESUPUESTOS_MOCK` | variantes socio                                                                      |
| `NEXT_PUBLIC_DEMO_VIDEO=true` o `?demo=1`                             | `lib/mocks/demoVideoData.ts` — obras/tareas demo en cliente (p. ej. `TareasSection`) |
| UI estática sin flag                                                  | `HomeDesktop`, `HomeMobile`, `MobileHome`: **obras y KPI inventados por defecto**    |
| Stitch demo local                                                     | `/socio/ahora/demo` usa `AhoraJornadaActivaStitch` modo `demo`                       |


### 1.4 Tablas Supabase frecuentes (inferidas por APIs y componentes)

`obras`, `tareas`, `tareas_subtareas`, `tareas_presupuestos`, `tareas_estados`, `elementos`, `socios`, `cuadrillas`, `organizations`, `organizaciones` (legacy), `notificaciones`, `eventos`, `cliente_wallets`, `cliente_wallet_movimientos`, `wallet_saldos`, `wallet_movimientos`, `leader_invites`, canvas/presupuesto grupos (`obras/[id]/canvas/*`), bucket `**evidencias`**.

### 1.5 Prisma vs Supabase

- **API routes principales de producto** (obras/tareas/subtareas/presupuestos/wallet rutas MVP) están orientadas a **Supabase** + `createServiceSupabaseClient` donde aplica.
- **Prisma** aparece en `lib/services/*` (tareas, obra, evento, cpm, notificacion, suscripcion…) y `**NotificacionService`** escribe Prisma **y** Supabase.
- **Riesgo de inconsistencia:** lecturas sólo desde una vía en documentación/UI y escrituras desde otra → QA debe registrar “origen de verdad” por flujo.

### 1.6 Tests automatizados existentes

- **Vitest:** 3 archivos, 13 tests — **sólo** lógica de canvas/grupos e import XML (`pnpm test`). **No** hay E2E de auth ni flujo negocio.
- **Playwright/Cypress:** no hallados en este paquete.

### 1.7 Consola red / errores

No capturados en esta auditoría sin browser. Lista de chequeo manual: pestaña Network filtrando `4xx/5xx`, consola Next en servidor (`next dev`/logs hosting), errores Supabase `PGRST` / `42501`.

---

## 2. Testing rol CLIENTE (checklist — ejecución manual)

### A. Acceso


| Paso                   | Evidencia en código                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Login / sesión         | Supabase auth helpers                                                                 |
| Redirect               | `middleware.ts` por rol/onboarding                                                    |
| `/cliente/dashboard`   | Lista actividad vía `**/api/tareas?org_id=`**                                         |
| `/cliente/obras`       | Habitualesmente Supabase cliente + posibles calls `fetch` a `/api/obras` según página |
| `/cliente/presupuesto` | Página dedica presupuesto                                                             |
| `/cliente/validar`     | `ValidarSection`                                                                      |


Registrar en QA manual: tiempo de carga, errores, si `demo=1` o `DEMO_VIDEO` altera vistas.

### B. Obra

Flujos recomendados: listar desde UI; crear vía `**POST /api/obras**` (validar payload en `obraSchema`); `**GET /api/obras**` con orgs permitidas (`listAccessibleOrgIds`).  
Duplicidades GET/POST: comparar `**GET**` vs lo que muestra crear desde editor.

### C. Presupuestos cliente

Endpoints relevantes (no exhaustivo):  
`POST/GET …/api/obras/[id]/solicitar-presupuesto`, `…/canvas/*`, `**/api/cliente/presupuestos/[id]/aprobar**`, `**/api/presupuestos/rechazar**`, `**/api/presupuestos/aprobar-socio**`, `**/api/socios/[id]/aprobar-presupuesto**`, `**/api/socio/presupuestos**`, `**/api/socio/presupuestos/bulk**`.

Documentar tabla tocada (`tareas_presupuestos`, notificaciones, etc.) desde respuesta/logs Supabase manual.

### D. Validación

- UI: `**ValidarSection**` + (**paralelo código**) fetch bloques `**para_validar`** con join a `tareas`.
- APIs: `**POST /api/tareas-subtareas/[id]/enviar-validar**` (SOCIO/cookie), `**POST /api/tareas-subtareas/[id]/validar**` (CLIENTE).

Estados:** bloque `validado` vs **tarea** `validada` — revisar `**TareaFsmService`** / `**normalizeEstadoBloqueParaOperacion**` y validación servidor en `SubtareaMvpService.validarSubtarea`.

Registrar: eventos en `eventos`, movimientos `cliente_wallet_*` / `wallet_movimientos` si aplica después de merges recientes.

### E. Pagos / wallet cliente

|**Pantalla** `/cliente/billetera`|`useWalletCliente`|
|Endpoints|`GET /api/cliente/wallet/saldo`, `movimientos`, `POST …/carga-manual`, `POST …/reconciliar-validadas` (requiere rol cliente/org)|  
|**MercadoPago / escrow** | otros paths: `POST /api/tareas/[id]/pago/checkout`, `…/escrow`, webhooks `/api/payments/webhook`; dependiente de `**MP_*` env.** |

Botón **“Carga manual de prueba”** existe en MVP — no es MercadoPago real.

---

## 3. Testing rol SOCIO (checklist — ejecución manual)

### A. Acceso

Rutas listadas arriba. Panel: `SocioPanelDashboard`.

### B. Presupuestos socio

`/socio/presupuestos` puede usar mocks si `**USE_MOCK_DATA || FORCE_PRESUPUESTOS_MOCK`**.

APIs típicos: `**/api/socio/presupuestos**`, `**/api/socios/[id]/aprobar-presupuesto**`, `**/api/presupuestos/aprobar-socio**`.

### C. Ejecución tareas (`AhoraSection`)

Límite bloques/tareas simultáneas: manejado en UI con contadores (**2 en progreso** — validar texto de error SOCIO_* en código).

APIs:** `POST /api/tareas-subtareas/[id]/iniciar`**, `**enviar-validar`**, `**/api/tareas/[id]/generar-bloques**`, `**/api/tareas/[id]/socio-puede-operar**`, `**transition**`.

### D. Evidencias

- `**POST /api/upload/photo**` (multipart JSON `dataUrl` + `subtareaId`): bucket `**evidencias**`, campo `**tareas_subtareas.evidencia_url**`.
- `GET supabase.storage` permisos: revisar políticas proyecto.

### E. Wallet socio

- `**GET /api/wallet/saldo**`, `**/api/wallet/movimientos**`, `**/api/wallet/pagar-bloque**`, `**debitos`/`creditos**`.

⚠️ **No mezclar** con modelo **cliente_wallets**.

---

## 4. APIs — tabla de inventario

**Nota:** columna **Estado HTTP** debe completarse **en QA manual** (aquí va **“Auditar manual”** salvo rutas triviales conocidas como 401 sin cookie).


| **Pantalla / flujo**       | **Acción**            | **Endpoint**                                | **Método** | **Estado HTTP (manual)** | **Resultado esperado (código)**       | **Error típico**                  | **Prioridad** |
| -------------------------- | --------------------- | ------------------------------------------- | ---------- | ------------------------ | ------------------------------------- | --------------------------------- | ------------- |
| Cliente dashboard          | listar últimas tareas | `/api/tareas?org_id=`                       | GET        | Auditar manual           | `{ success, data[] }` con `obra` join | 401, 403 org, vacío si sin org_id | Alta          |
| Obras cliente              | listar                | `/api/obras`                                | GET        | Auditar manual           | `{ success, data }`                   | 401, 503 falta SERVICE_ROLE       | Alta          |
| Obras cliente              | crear                 | `/api/obras`                                | POST       | Auditar manual           | 201/`success`                         | 400 schema                        | Alta          |
| Tareas cliente             | crear                 | `/api/tareas`                               | POST       | Auditar manual           | 201/`success`                         | 400 elemento, 403 org             | Alta          |
| Tareas cliente/s           | detalle PATCH         | `/api/tareas/[id]`                          | PATCH/GET  | Auditar manual           | Supabase por id                       | permisos                          | Media         |
| FSM                        | transición legacy     | `/api/tareas/[id]/transition`               | POST       | Auditar manual           | Histórico/compat                      | estado inválido                   | Media         |
| Presupuesto tarea          | listar crear          | `/api/tareas/[id]/presupuestos`             | GET/POST   | Auditar manual           | presupuesto filas                     | FK                                | Alta          |
| Presupuesto cliente        | análog                | `/api/cliente/presupuestos`                 | *          | Auditar manual           | Lista                                 | Rol                               | Alta          |
| Presupuesto socio          | lista                 | `/api/socio/presupuestos`                   | GET        | Auditar manual           | items                                 | MOCK flag                         | Alta          |
| Aprobación                 | socio                 | `/api/presupuestos/aprobar-socio`           | POST       | Auditar manual           | Estado APROBADO                       | 403/400                           | Alta          |
| Rechazo                    | cliente/sistema       | `/api/presupuestos/rechazar`                | POST       | Auditar manual           | Estado                                | mensaje DB                        | Alta          |
| Bloque                     | iniciar               | `/api/tareas-subtareas/[id]/iniciar`        | POST       | Auditar manual           | estado en_progreso                    | límite 2 bloques                  | Alta          |
| Bloque                     | enviar validar        | `/api/tareas-subtareas/[id]/enviar-validar` | POST       | Auditar manual           | para_validar                          | evidencia faltante 409            | Crítica       |
| Bloque                     | validar rechazar      | `/api/tareas-subtareas/[id]/validar`        | POST       | Auditar manual           | validado/rechazado + wallet reconcile | estado no para_validar            | Crítica       |
| Wallet cliente             | saldo                 | `/api/cliente/wallet/saldo`                 | GET        | Auditar manual           | saldo objeto                          | cliente sin org                   | Alta          |
| Wallet cliente             | movimientos           | `/api/cliente/wallet/movimientos`           | GET        | Auditar manual           | lista                                 | igual                             | Alta          |
| Wallet cliente             | carga MVP             | `/api/cliente/wallet/carga-manual`          | POST       | Auditar manual           | nuevo saldo                           | RPC DB                            | Media         |
| Wallet cliente             | reconcile             | `/api/cliente/wallet/reconciliar-validadas` | POST       | Auditar manual           | contadores                            | errores reconcile                 | Alta          |
| Wallet socio               | saldo                 | `/api/wallet/saldo`                         | GET        | Auditar manual           | JSON simple                           | owner no resuelto                 | Alta          |
| Wallet socio               | pagar bloque          | `/api/wallet/pagar-bloque`                  | POST       | Auditar manual           | movimiento insert                     | socio suspendido                  | Alta          |
| Fotos evidencia            | subir                 | `/api/upload/photo`                         | POST       | Auditar manual           | evidencia_url                         | storage 403/500                   | Crítica       |
| MP                         | webhook               | `/api/payments/webhook`                     | POST       | Auditar manual           | procesa pagos `MP_WEBHOOK_SECRET`     | firma inválida                    | Alta          |
| Solicitud presupuesto obra | obra                  | `/api/obras/[id]/solicitar-presupuesto`     | POST       | Auditar manual           | socio notif                           | datos                             | Alta          |
| Lista tareas socio         | servidor              | `/api/socios/[id]/tareas`                   | GET        | Auditar manual           | filtrado socio/org                    | políticas                         | Alta          |


---

## A. Funciona

- **Lint de tipos compilación:** (`npx tsc --noEmit` fue usado por el equipo antes de entregas; no se re-corrió integramente contra este archivo).
- **Suite Vitest declarada**: pruebas de negocio de **canvas / XML import** pasan (`pnpm test`).

*(Completar con hallazgos reales tras QA manual)*

## B. Funciona con datos mock

- Stitch demo `/socio/ahora/demo`
- Todo flujo si `NEXT_PUBLIC_SOCIO_USE_MOCK=true`
- Flujos cliente con `NEXT_PUBLIC_DEMO_VIDEO` / `?demo=1`
- **Widgets home** cliente que inicializan con `OBRAS_MOCK` / `MOCK_OBRAS` en varios componentes (**riesgo alto de interpretación equivocada**)

## C. Falla bloqueante

*(Registrar tras reproducción: login imposible, 503 sin SERVICE_ROLE, storage bloqueando evidencias sin URL pública, validación OK pero sin persistencia visible, etc.)*

## D. Falla menor

*(Warnings TS en build, errores silenciados (`catch{}`), placeholders de imagen cuando URL relativa/private bucket)*

## E. Problemas de permisos / 403 / RLS

- `**requireClienteWalletAuth`** en rutas cliente wallet vs rol metadata
- Middleware rol mal seteado en `app_metadata.role`
- Queries cliente con **RLS** que ocultan subtareas donde **service role API** sí escribe (`enviar-validar`)

## F. Base de datos / esquema

- **Dual `organizations` / `organizaciones`** en código de permiso y wallets
- Inserción en tabla `**tareas_estados**` con cast `as any` — errores pueden ser “no críticos” en logs pero dejan sin historial
- Prisma opcional/desalineado con modelo Supabase en notificaciones

## G. Recomendación de orden de reparación

1. **Configuración** (SERVICE_ROLE, URL Supabase válida, middleware coherente con entorno QA).
2. **Creación obra/tarea y visibilidad** (GET tras POST mismo org).
3. **Presupuestos / asignación** (estados PDF y APROBADO).
4. **Socio ejecuta:** iniciar bloque, evidencia (`upload/photo` + campo DB).
5. **Cliente valida** (`validar` route + vista `ValidarSection` + consistencia estado).
6. **Wallet** (endpoint correcto por rol + RPC Supabase aplicadas).
7. **MercadoPago producción**: habilitación real vs simulacro.
8. **Mocks en home cliente** etiquetados o gated por ambiente para no contaminar QA.

---

## Anexo: comandos útiles QA local

```bash
cd apps/web
pnpm install
pnpm dev          # servidor; revisar NEXT_PUBLIC_* y modo prod vs dev middleware
pnpm test         # vitest unitario actual
pnpm lint         # ESLint Next
```

**Fin del informe generado por auditoría de código + vitest.**