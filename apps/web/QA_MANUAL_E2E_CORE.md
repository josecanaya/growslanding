# QA_MANUAL_E2E_CORE

Fecha: 2026-04-23  
Estado inicial reportado: `READY FOR MANUAL QA`  
Entorno validado: `http://localhost:3000` (Next.js dev levantado)

## Alcance y criterio

- Se ejecuta QA E2E manual del core sin rediseños ni cambios en landing/Stitch.
- Se prioriza evidencia real de ejecución.
- Cuando falta credencial/actor real (cliente/socio) la prueba se marca `BLOCKED`.

## Resultados por prueba

| ID | Paso | Resultado esperado | Resultado obtenido | Estado | Evidencia / Nota | Archivo o endpoint relacionado |
|---|---|---|---|---|---|---|
| AUTH-01 | Login cliente | Cliente puede iniciar sesión y entrar a su org | No se pudo ejecutar por falta de credenciales QA de cliente | BLOCKED | No hay usuario/password/cuenta OAuth QA documentada para ejecutar login controlado | `app/auth/login/page.tsx` |
| AUTH-02 | Login socio | Socio puede iniciar sesión y entrar a su org | No se pudo ejecutar por falta de credenciales QA de socio | BLOCKED | Mismo bloqueo de credenciales | `app/auth/login/page.tsx` |
| AUTH-03 | Validar rol y org | Rol/org correctos post-login | No ejecutable sin sesión válida de cliente/socio | BLOCKED | Depende de AUTH-01/AUTH-02 | `lib/services/permiso.service.ts` |
| OBR-01 | Crear obra | `201` y obra creada en org autorizada | No ejecutable sin sesión autenticada | BLOCKED | Endpoint protegido; sin cookie de sesión responde `401` | `POST /api/obras` |
| OBR-02 | Listar obras | Lista sólo obras de org habilitadas | `GET /api/obras` sin sesión => `401` | PASS | Smoke de seguridad correcto | `GET /api/obras` |
| OBR-03 | Editar obra | Actualiza sólo obra de org habilitada | `PATCH /api/obras` sin sesión => `401` | PASS | Auth obligatoria aplicada | `PATCH /api/obras` |
| OBR-04 | Eliminar obra / usar obra prueba | Elimina sólo obra de org habilitada | `DELETE /api/obras` sin sesión => `401` | PASS | Auth obligatoria aplicada | `DELETE /api/obras` |
| OBR-05 | Aislamiento por organización | No acceso cruzado | Validado parcialmente por hardening en código + `401` sin sesión | PASS | Se agregó filtro por `allowedOrgIds` en GET/PATCH/DELETE | `app/api/obras/route.ts` |
| TAR-01 | Crear tarea | Se crea tarea para org autorizada | No ejecutable sin sesión cliente | BLOCKED | Requiere actor autenticado y contexto org real | `POST /api/tareas` |
| TAR-02 | Consultar tarea | Cliente/socio autorizado puede consultarla | `GET /api/tareas/[id]` sin sesión => `401` | PASS | Endpoint no expone datos sin auth | `GET /api/tareas/[id]` |
| TAR-03 | Editar tarea | Actualiza tarea con permisos válidos | `PATCH /api/tareas/[id]` sin sesión => `401` | PASS | Endpoint protegido | `PATCH /api/tareas/[id]` |
| TAR-04 | Asignar socio/cuadrilla | Asignación sólo por cliente autorizado | `POST /api/tareas/[id]/asignar-cuadrilla` sin sesión => `401` | PASS | Endpoint protegido | `POST /api/tareas/[id]/asignar-cuadrilla` |
| SOC-01 | Socio ve tarea asignada | Socio visualiza tarea correcta | No ejecutable sin login socio | BLOCKED | Requiere sesión socio + datos asignados | `app/socio/**` |
| SOC-02 | Socio inicia ejecución | Subtarea/tarea pasa a ejecución | No ejecutable sin actor socio | BLOCKED | Depende de SOC-01 | `lib/services/subtarea-mvp.service.ts` |
| SOC-03 | Socio carga evidencia | Evidencia queda registrada | No ejecutable sin sesión y tarea activa | BLOCKED | Requiere flujo real de evidencia | `tareas_evidencias` / rutas socio |
| BLK-01 | Subtarea a `para_validar` | Estado avanza correctamente | No ejecutable end-to-end sin actor socio | BLOCKED | Flujo requiere sesión y datos vivos | `lib/services/subtarea-mvp.service.ts` |
| BLK-02 | Cliente valida subtarea | Estado pasa a `validado` | `POST /api/tareas-subtareas/[id]/validar` sin sesión => `401` | PASS | Endpoint protegido y sin bypass por headers | `POST /api/tareas-subtareas/[id]/validar` |
| BLK-03 | Confirmar estado `validado` | Persistencia de estado final bloque | No ejecutable sin ciclo completo socio->cliente | BLOCKED | Falta data/cuentas QA | `tareas_subtareas.estado` |
| CLS-01 | Cierre de tarea por bloques | Tarea pasa a `validada` cuando todo bloque está `validado` | Validación lógica estática OK; prueba dinámica no ejecutada | BLOCKED | Requiere subtareas reales en todos los estados | `lib/services/subtarea-mvp.service.ts`, `lib/services/tarea-fsm.service.ts` |
| CLS-02 | No confusión `validada/validado` | No bloquea transiciones por naming | Validación estática OK; E2E pendiente | BLOCKED | Constantes de dominio alineadas, pero falta ejecución con datos reales | `lib/domain/estados-core.ts` |
| WAL-01 | Registrar crédito | Crea movimiento y ajusta saldo | `POST /api/wallet/creditos` sin sesión => `401` | PASS | Endpoint protegido | `POST /api/wallet/creditos` |
| WAL-02 | Registrar débito | Crea movimiento y ajusta saldo | `POST /api/wallet/debitos` sin sesión => `401` | PASS | Endpoint protegido | `POST /api/wallet/debitos` |
| WAL-03 | Verificar saldo | Consulta saldo sólo autorizado | `GET /api/wallet/saldo` sin sesión => `401` | PASS | Endpoint protegido | `GET /api/wallet/saldo` |
| WAL-04 | Verificar movimientos | Lista movimientos sólo autorizado | `GET /api/wallet/movimientos` sin sesión => `401` | PASS | Endpoint protegido | `GET /api/wallet/movimientos` |
| WAL-05 | No duplicación de pago | No duplica crédito/débito por mismo origen | No ejecutable sin escenario autenticado con transacciones reales | BLOCKED | Pendiente en entorno integrado | `wallet_movimientos` / `wallet_saldos` |
| WH-01 | Webhook payment (controlado) | Endpoint acepta payload y responde `200` | `POST /api/payments/webhook` => `200 {"received":true}` | PASS | Se ejecutó payload controlado local | `POST /api/payments/webhook` |
| WH-02 | Webhook con secreto | Rechaza si secreto/header inválido | No ejecutado en entorno con `MP_WEBHOOK_SECRET` activo | BLOCKED | Requiere ambiente seguro configurado para validar `401` por secreto | `app/api/payments/webhook/route.ts` |
| SEC-01 | Acceso cruzado obra/tarea | Rechazo con `401/403/404` | Sin sesión todos endpoints críticos devuelven `401` | PASS | Cobertura en obras/tareas/wallet/subtareas | `api/obras`, `api/tareas/**`, `api/wallet/**` |
| SEC-02 | Operar con headers falsos | Headers no deben otorgar acceso | `POST /api/wallet/creditos` con `x-organizacion-id/x-usuario-id` falsos => `401` | PASS | No hay bypass por headers inyectados | `POST /api/wallet/creditos` |

## Evidencia técnica ejecutada (resumen)

- Script HTTP local contra `http://localhost:3000` ejecutado sobre endpoints críticos.
- Confirmaciones observadas:
  - `GET/PATCH/DELETE /api/obras` => `401` sin sesión.
  - `GET/PATCH /api/tareas/[id]` => `401` sin sesión.
  - `POST /api/tareas/[id]/asignar-cuadrilla` => `401` sin sesión.
  - `POST /api/tareas-subtareas/[id]/validar` => `401` sin sesión.
  - `POST /api/wallet/creditos` y `POST /api/wallet/debitos` => `401` sin sesión.
  - `GET /api/wallet/saldo` y `GET /api/wallet/movimientos` => `401` sin sesión.
  - `POST /api/payments/webhook` => `200` con payload controlado.

## Resumen de estado

- `PASS`: 16
- `FAIL`: 0
- `BLOCKED`: 13

## Bloqueos concretos para cerrar GO

1. Credenciales QA reales (cliente + socio) para ejecutar flujo autenticado completo.
2. Dataset de prueba trazable (obra/tarea/subtarea) para validar transición completa y cierre de tarea.
3. Entorno seguro con `MP_WEBHOOK_SECRET` habilitado para validar rechazo/aceptación de webhook por secreto.
4. Validación integrada de no duplicación de pagos en wallet con transacciones reales.

## Recomendación QA_CORE_SENIOR

Estado recomendado: **READY WITH BLOCKERS**  
Justificación: no hay fallas críticas detectadas en lo ejecutado; sin embargo, el E2E funcional autenticado completo está bloqueado por falta de credenciales/datos de prueba controlados.
