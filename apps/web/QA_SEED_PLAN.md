# QA_SEED_PLAN — Dataset mínimo para E2E core Grows

**Rol:** QA_CORE_SENIOR + SUPABASE_DATA_SENIOR  
**Objetivo:** Tener un conjunto mínimo de datos y usuarios para ejecutar el flujo `obra → tarea → bloque → evidencia → validación → wallet` sin tocar landing ni rediseñar UI.  
**Estado de partida documentado:** `READY WITH BLOCKERS` (E2E autenticado completo requiere credenciales y datos trazables).

---

## 1. Usuarios QA necesarios

| Actor | Uso en el producto | Requisito en Supabase Auth | Vinculación en datos |
|--------|--------------------|-----------------------------|----------------------|
| **Cliente (arquitecto / dueño de org)** | Crea obras, tareas, asigna socio, valida bloques | 1 usuario email/contraseña o OAuth (misma convención que producción) | `organizations.user_id` = `auth.users.id` del cliente (permite rol `CLIENTE` en `PermisoService`) |
| **Socio (cuadrilla/ejecutor)** | Ve tarea asignada, avanza bloque, carga evidencia, envía a validar | 1 usuario distinto | Fila en `socios` con `user_id` = su `auth.users.id` y `org_id` = la org del cliente |
| **Admin** | **Opcional** | Solo si el flujo a probar pasa por pantallas/roles de administración global o políticas RLS que exijan `ADMIN` en JWT | Habitualmente **no** es necesario para el core E2E cliente/socio; documentar en `QA_CREDENTIALS_REQUIRED.md` si aplica al proyecto |

**Nota de roles:** el código de permisos distingue `CLIENTE` (owner de `organizations`) y `SOCIO` (`socios.user_id`). Un mismo usuario no debe interpretarse como los dos a la vez en la misma org para el E2E (usar siempre **dos cuentas**).

---

## 2. Datos mínimos necesarios (por fila lógica)

| Entidad | Campos / condición mínima | Por qué |
|---------|---------------------------|--------|
| **Organización** | `organizations.id`, `name`; **`user_id` = UUID del usuario cliente** | Sin esto, el cliente no recibe `CLIENTE` en `PermisoService.obtenerRolEnOrganizacion` |
| **Obra** | `obras.org_id`, `obras.id`, `name`, `estado` coherente (p. ej. `ACTIVA`) | Punto de anclaje de tareas y listados |
| **Tarea** | `tareas.org_id`, `tareas.obra_id`, `title`, `estado` inicial (p. ej. `pendiente`); `bloques_planificados` / `dias_presupuesto` alineados con bloques reales | Necesario para transiciones y para límites de bloques (trigger de cantidad) |
| **Presupuesto** (si aplica al flujo de bloques) | `tareas_presupuestos` con `estado = 'APROBADO'`, `tarea_id`, `socio_id`, `monto`, `dias_reales` | `SubtareaMvpService.generarBloquesDesdePresupuesto` y el flujo de demo en `scripts/seed-demo.ts` asumen presupuesto aprobado |
| **Subtarea / bloque** | `tareas_subtareas`: `tarea_id`, `bloque_index`, `estado` en enum oficial, `socio_id`, **`monto_estimado` NOT NULL** (constraint DB), `evidencia_obligatoria` | La migración exige monto; para pasar a `validado` hace falta `evidencia_cargada` / `evidencia_url` según lógica de `SubtareaMvpService` |
| **Socio vinculado** | `socios.id`, `socios.org_id`, `socios.user_id` (auth), email único en org | Asignación y permisos de socio; `asignar-cuadrilla` mapea `cuadrilla_id` → fila `socios` |
| **Wallet inicial** | Filas en `wallet_saldos` para `(SOCIO, socio_id)` y `(ORG, org_id)` o dejar que el servicio `ensureSaldo` las cree al primer pago | `WalletMvpService` usa `wallet_saldos` + `wallet_movimientos` con esquema enriquecido; las rutas MVP `/api/wallet/*` simplificadas pueden diferir: **usar en QA el mismo contrato que el flujo de validación** (`registrarPagoPorBloque`) |

**Presupuesto “si aplica”:** en el flujo canónico actual, generar bloques desde presupuesto aprobado es el camino alineado con `scripts/seed-demo.ts` (`approveDemo`). Si se insertan bloques solo por SQL, igual debe existir un presupuesto `APROBADO` o justificar coherencia con `presupuesto_id` en `tareas_subtareas`.

---

## 3. Cómo crear esos datos (sin refactor)

### A) Vía script existente (recomendado como base)

- **Comando:** `pnpm run seed:demo` (definido en `apps/web/package.json` → apunta a `scripts/seed-demo.ts`).
- **Qué crea:** organización (o reutiliza la primera), socios con emails fijos `demo.socioN@grows.app`, obras demo, tareas, presupuestos `ENVIADO`.
- **Aprobación controlada:**  
  `pnpm run seed:demo -- --approve <obraId> <socioId>`  
  Esto: aprueba presupuesto del socio elegido, actualiza tareas, inserta `tareas_subtareas` si no existían.

**Gap QA:** el seed **no** crea usuarios en Supabase Auth. Hay que **crear 2 usuarios reales** y luego **vincular** `organizations.user_id` y `socios.user_id` (SQL o dashboard).

### B) Vía Supabase Dashboard

1. **Authentication → Users:** crear usuario Cliente y usuario Socio (email confirmado según política del proyecto).
2. **Table Editor:**
   - `organizations`: ajustar/crear fila; asignar `user_id` al UUID del Cliente.
   - `socios`: crear o editar fila; `org_id` + `user_id` del Socio; email coincidente con login del socio.
   - `obras`, `tareas`, `tareas_presupuestos`, `tareas_subtareas` según sección 2.
3. **Storage:** subir evidencia solo si el flujo UI la exige; alternativa QA es marcar `evidencia_cargada = true` y/o `evidencia_url` en `tareas_subtareas` **solo en entorno de pruebas** (documentar en runbook).

### C) Vía SQL (entorno de staging / proyecto dedicado)

- Ejecutar en **SQL Editor** (service role) scripts idempotentes que:
  1. Inserten org + obra + tarea + presupuesto + bloques, **o**
  2. Ajusten filas post-`seed:demo` con los UUIDs de `auth.users` reales.

**Seguridad:** nunca commitear `service_role` ni ejecutar en producción sin ventana aprobada.

### D) Vía UI de la app

- Crear/listar/editar obra: flujo cliente mientras el usuario tenga `CLIENTE` en la org.
- Crear tarea, asignar cuadrilla: depende de pantallas; puede ser más lento que seed + ajuste de vínculos Auth.

**Orden sugerido de creación:** ver `QA_E2E_RUNBOOK.md` (sección “Orden exacto”).

---

## 4. Coherencia con reglas de negocio (no negociar en seed)

- **Tarea final:** `validada` (tarea) vs `validado` (bloque) — ambos términos son esperados; el cierre de tarea comprueba bloques en estado final de bloque (`validado`) antes de forzar tarea a `validada` donde aplica.
- **Bloques:** límite por `bloques_planificados`; triggers en migración `20251210T122000_tareas_subtareas_blocks.sql`.
- **Wallet / duplicación:** `WalletMvpService` incluye control de no duplicar movimiento por subtarea; el E2E debe validar **una** fila de movimiento por bloque validado.

---

## 5. Webhook MercadoPago (solo preparación; detalle en `QA_E2E_RUNBOOK.md`)

- Variable `MP_WEBHOOK_SECRET` opcional en el handler: si está definida, exige header de secreto.
- Probar con payload `type: "payment"`, `action: "payment.updated"`, y `data.id` de un pago de prueba **en entorno que no afecte producción**.

---

## 6. Criterio: pasar de **READY WITH BLOCKERS** a **GO**

Se puede declarar **GO** solo si **simultáneamente**:

1. **E2E autenticado completo** ejecutado según `QA_E2E_RUNBOOK.md` con resultado **PASS** en todos los pasos críticos (1–4 y 6–7 del runbook, más aislamiento por org y wallet sin duplicados).
2. **Evidencia registrada** (tabla de resultados o capturas + IDs de org/tarea/subtarea en el entorno de prueba).
3. **Webhook** probado con `MP_WEBHOOK_SECRET` en el entorno de staging **o** explícitamente aceptado como `N/A` con riesgo firmado (no recomendado para GO de pagos reales).
4. **Sin bloqueo crítico** de producto (login, permisos, datos inconsistentes, duplicación de pagos, estados de tarea/bloque).

Si quedan **solo** incidencias no bloqueantes (p. ej. copy UI, ruido de logs, o paso opcional de admin), el estado puede documentarse como **GO con observaciones** en `GO_NO_GO.md`.

---

## 7. Archivos y scripts de referencia en el repo

- `apps/web/scripts/seed-demo.ts` — semilla demo y `approveDemo`.
- `apps/web/lib/services/permiso.service.ts` — reglas de `CLIENTE` / `SOCIO`.
- `apps/web/lib/services/subtarea-mvp.service.ts` — validación de bloques y pagos.
- `apps/web/lib/services/wallet-mvp.service.ts` — movimientos y saldos.
- `apps/web/app/api/payments/webhook/route.ts` — validación de secreto y rama `payment`.
- `apps/web/supabase/migrations/20251210T122000_tareas_subtareas_blocks.sql` — constraints de bloques y evidencia.

---

## 8. Próximo paso operativo

1. Completar `QA_CREDENTIALS_REQUIRED.md` (roles y checklist de vinculación).  
2. Ejecutar preparación de datos (seed + SQL de vínculos).  
3. Correr `QA_E2E_RUNBOOK.md` y volcar resultados a `QA_MANUAL_E2E_CORE.md` (o anexo de evidencia).
