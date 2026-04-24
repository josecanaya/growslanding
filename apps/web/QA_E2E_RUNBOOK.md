# QA_E2E_RUNBOOK — Orden de ejecución y verificación (core Grows)

**Entrada:** dataset preparado según `QA_SEED_PLAN.md` y credenciales listas en `QA_CREDENTIALS_REQUIRED.md`.  
**Base URL de ejemplo:** `http://localhost:3000` (reemplazar por staging).  
**Principio:** no modificar landing; no rediseño; anotar fallos en el informe de prueba, no "parches" de producto en caliente salvo bug bloqueante acordado.

---

## 0. Pre-carga de datos mínima (si aún no está)

1. Ejecutar `pnpm run seed:demo` en `apps/web` (con variables de entorno y `SUPABASE_SERVICE_ROLE_KEY` disponibles para el script).
2. Anotar `org_id`, `obra_id` y al menos un `socio_id` del output.
3. Opcional: `pnpm run seed:demo -- --approve <obraId> <socioId>` para presupuestos aprobados y bloques creados (ver `scripts/seed-demo.ts`).
4. **Vincular Auth:** asignar `organizations.user_id` y `socios.user_id` a los UUID de los usuarios QA creados en Supabase (Table Editor o SQL en staging).

**Invariantes de negocio a respetar:**

- Cada `tareas_subtareas` debe tener `monto_estimado` (NOT NULL en DB).
- Si `evidencia_obligatoria = true`, antes de `para_validar` / validación, la lógica de `SubtareaMvpService` exige evidencia (marcar `evidencia_cargada` o `evidencia_url` vía flujo real o, solo en QA, columna en DB según política del equipo).
- Tarea: estado final de **tarea** = `validada`; estado final de **bloque** = `validado` (nomenclatura distinta, esperada).

---

## 1. Orden exacto del test E2E (happy path)

| Paso | Acción | Resultado esperado | Verificación |
|------|--------|--------------------|--------------|
| 1 | **Login cliente** | Sesión activa, redirección a área cliente | Cookies / sesión en DevTools; sin error 429 sostenido en Auth |
| 2 | **Crear obra** (UI o `POST /api/obras` con cookies de sesión) | `201` o confirmación UI; obra con `org_id` correcto | Listado o `GET /api/obras` devuelve la obra en scope de la org del cliente |
| 3 | **Listar obras** | Lista solo obras de orgs permitidas | No aparece obra de otra org |
| 4 | **Editar obra** (UI o `PATCH /api/obras`) | Actualización correcta; sin acceso a `id` de otra org | `404` o negación si se fuerza ID ajeno (ver sección 9) |
| 5 | **Crear tarea** | Tarea creada con `obra_id` y `org_id` coherentes | `GET /api/tareas/[id]` con sesión cliente devuelve tarea |
| 6 | **Asignar socio / cuadrilla** | `POST /api/tareas/[id]/asignar-cuadrilla` con `cuadrilla_id` = UUID de fila `socios` de la misma org | Tarea con `responsable` o campo actualizado; logs sin error FK (si aplica) |
| 7 | **Logout / Login socio** | Socio entra a su módulo y ve trabajo asignado | Coincidencia de email/nombre con `responsable` si la transición lo exige |
| 8 | **Iniciar ejecución (tarea / bloque)** | Avance a `en_progreso` según FSM o pantalla | Estado coherente en `tareas` o `tareas_subtareas` (consulta Table Editor) |
| 9 | **Subir evidencia** | `evidencia_cargada` o URL persistida; cumple reglas de bloque | No puede pasar a `para_validar` sin evidencia si aplica lógica estricta |
| 10 | **Enviar a validar** (bloque) | `tareas_subtareas.estado` = `para_validar` | Fila visible para el cliente en flujo de validación |
| 11 | **Login cliente** de nuevo | Sesión cliente activa | — |
| 12 | **Validar bloque** | `POST /api/tareas-subtareas/[id]/validar` con `metodoPago` y `accion: validar` | `success: true`; bloque pasa a `validado` |
| 13 | **Cierre de tarea** | Cuando **todos** los bloques están `validado`, tarea puede pasar a `validada` vía FSM/ UI | `tareas.estado` = `validada`; comprobar que no queda bloque distinto de `validado` |
| 14 | **Wallet** | Tras validación, movimientos y saldos coherentes; **sin** segundo crédito por el mismo `subtarea_id` | Consultar `wallet_movimientos` (y/o endpoints `/api/wallet/movimientos`, `/api/wallet/saldo` con sesión) |

**Nota:** si no hay rutas API dedicadas para cada micro-paso de bloque, parte del flujo se hará **por la UI** o con **verificación en DB** en staging; lo importante es que el runbook deje trazado qué vía se usó (UI vs SQL de solo QA).

---

## 2. Mapeo rápido a archivos / endpoints

| Tema | Referencia |
|------|------------|
| Obras (GET/PATCH/DELETE con sesión) | `app/api/obras/route.ts` |
| Tarea por id / PATCH | `app/api/tareas/[id]/route.ts` |
| Asignar cuadrilla | `app/api/tareas/[id]/asignar-cuadrilla/route.ts` |
| Transición tarea (FSM) | `app/api/tareas/[id]/transition/route.ts` |
| Validar subtarea | `app/api/tareas-subtareas/[id]/validar/route.ts` |
| Wallet (MVP) | `app/api/wallet/saldo`, `.../movimientos`, `.../creditos`, `.../debitos` |
| Pago por bloque (servicio) | `lib/services/wallet-mvp.service.ts` |
| Seed | `scripts/seed-demo.ts`, comando `pnpm run seed:demo` |

---

## 3. Webhook MercadoPago — cómo probar con `MP_WEBHOOK_SECRET` activo

**Ubicación del código:** `app/api/payments/webhook/route.ts`

### 3.1 Configuración en staging

1. Definir en el entorno (solo staging): `MP_WEBHOOK_SECRET=<secreto_largo_aleatorio>`.
2. Reiniciar el proceso del servidor Next.

### 3.2 Request de prueba (curl conceptual)

- **Método:** `POST`  
- **URL:** `https://<staging>/api/payments/webhook`  
- **Header obligatorio** (uno de los soportados):  
  - `x-webhook-secret: <mismo_valor_que_MP_WEBHOOK_SECRET>`  
  - o `x-mp-webhook-secret: <mismo_valor>`

**Payload mínimo para entrar a la rama de pago de tarea** (el handler delega en `handleTaskPaymentWebhook` si `type === "payment"`):

```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": { "id": "<PAYMENT_ID_MP_SANDBOX_O_PRUEBA>" }
}
```

**Comportamiento esperado:**

- Si el secreto **coincide** y el cuerpo es JSON válido: respuesta `200` con cuerpo `{"received":true}` (incluso si luego el procesamiento interno no aplica a una tarea).
- Si el secreto **no coincide** y `MP_WEBHOOK_SECRET` está definido: `401` con cuerpo `{"error":"Unauthorized webhook"}`.
- Si `MP_WEBHOOK_SECRET` **no** está definido, el handler **no** exige el header (comportamiento documentado como riesgo; no es ideal para GO de pagos en producción).

**Importante:** el procesamiento real llama a `getPaymentInfo(paymentId)`; el ID debe existir en **MercadoPago sandbox** o el flujo interno puede no marcar escrow. Eso se documenta como resultado parcial, no como fallo del return `received`.

**Payload esperado en producción (referencia):** dependerá de la configuración de MercadoPago (típicamente `type`, `action`, `data.id`); alinear con logs actuales del handler: `[payments.webhook] evento recibido`.

---

## 4. Seguridad (E2E) — matriz corta

| Prueba | Acción | Esperado |
|--------|--------|----------|
| Sin sesión | `GET /api/obras` | `401` |
| Otro org | `PATCH /api/obras` con `id` de obra de otra org (y sesión de cliente legítimo) | `404` o negación; **no** modificar terceros |
| Headers falsos | Llamar API con `x-organizacion-id` / `x-usuario-id` sin cookie válida | Sigue exigiendo autenticación real en rutas migradas; no “suplantar” |

---

## 5. Criterio de cierre: **READY WITH BLOCKERS → GO**

- **GO:** todas las filas de la tabla del apartado 1 (pasos 1–14) con evidencia, más prueba de webhook con `MP_WEBHOOK_SECRET` **o** decisión explícita de excepción firmada; sin duplicados de pago; aislamiento por org verificado.  
- **No-GO:** bloqueo crítico (auth, permisos, estados, pagos duplicados, fuga de datos entre orgs).  
- **READY WITH BLOCKERS:** E2E incompleto por falta de credenciales, datos o MP sandbox, pero lo ejecutado no muestra fallas críticas.

---

## 6. Dónde registrar resultados

Actualizar o anexar a:

- `apps/web/QA_MANUAL_E2E_CORE.md` (formato ID / paso / PASS-FAIL / evidencia)  
- `apps/web/GO_NO_GO.md` (decisión final y fecha)
