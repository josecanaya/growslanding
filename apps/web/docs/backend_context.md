# Backend Contexto (MVP 1.0)

## Arquitectura real
- Aplicacion Next.js / App Router con handlers en `app/api/**` que usan `createServiceSupabaseClient` y `createRouteHandlerClient` para hablar con Supabase (ver ANALISIS_BILLETERA_GROWS.md, Bloque 4).
- Servicios de dominio en `lib/services/*.ts` encapsulan la logica (plan.service, wallet.service, tarea.service, escrow.service).
- Supabase es la unica base de datos: todas las tablas descritas viven en el esquema `public` (docs/backend_esquema_mvp.md y sql/*).
- La integracion de pagos externos se maneja via MercadoPago (escrows) en `lib/payments/mercadopago.ts` y `app/api/payments/webhook/route.ts` (RESUMEN_ESCROW_IMPLEMENTACION.md).

## Modelos reales
### Tareas
- Enum `tarea_estado_oficial`: `pendiente`, `en_progreso`, `para_validar`, `validada`, `rechazada`.
- Columnas claves: `bloques_planificados` (igual a `dias_presupuesto`), `dias_presupuesto`, `responsable_socio_id` (FK a `socios`).
- Constraints y triggers: `CHECK(bloques_planificados = dias_presupuesto)`, trigger `sync_dias_presupuesto`, trigger `enforce_socio_max_tareas` que limita a 2 tareas en progreso por socio (docs/backend_esquema_mvp.md seccion 2).

### Tareas_subtareas (bloques pagables)
- Enum `tarea_subtarea_estado_oficial`: `pendiente`, `en_progreso`, `para_validar`, `validado`, `rechazado`.
- Columnas: `bloque_index` (UNIQUE por tarea), `socio_id`, `presupuesto_id`, `monto_estimado`, `evidencia_obligatoria`, `evidencia_cargada`.
- Constraints: `CHECK(estado <> 'validado' OR evidencia_cargada)`.
- Triggers: `inherit_subtarea_socio` (hereda responsable), `enforce_subtarea_count` (no supera `bloques_planificados`), `enforce_socio_max_bloques` (maximo 2 bloques `en_progreso` por socio) (docs/backend_esquema_mvp.md seccion 3).

### Wallet
- Enums: `wallet_owner_tipo`, `wallet_movimiento_tipo`, `wallet_movimiento_estado`, `wallet_metodo_pago` (docs/backend_esquema_mvp.md seccion 1.1).
- Tabla `wallet_saldos`: `owner_tipo`, `owner_id`, `saldo_actual`, `saldo_pendiente`, `moneda`, `suspendido`, `limite_sobregiro=-50000`, trigger `enforce_wallet_suspension` y tabla `socio_suspensiones` para historico (docs/backend_esquema_mvp.md secciones 1.2 y 4).
- Tabla `wallet_movimientos`: owner, tarea/subtarea/presupuesto/escrow IDs, tipo, montos bruto/comision/neto, `porcentaje_comision`, `plan_aplicado`, factores de reputacion/oferta, `origen`, `metodo_pago`, metadata y UNIQUE `(subtarea_id, tipo)` (docs/backend_esquema_mvp.md y docs/pagos_movimientos.txt).

### Escrow
- Tabla `escrow_transacciones`: referencia tarea/socio/org/cliente, `monto_total`, `monto_comision`, `mp_preference_id`, `mp_payment_id`, estados `pendiente|retenido|liberado|reembolsado|cancelado`, timestamps de deposito/liberacion/reembolso (RESUMEN_ESCROW_IMPLEMENTACION.md).
- `wallet_movimientos` tiene `escrow_id` para trazar el origen del pago (RESUMEN_ESCROW_IMPLEMENTACION.md).

## Endpoints existentes relevantes
- `/api/tareas/[id]/transition` (FSM de tareas) y `/api/tareas/[id]/estado` (legacy) (ANALISIS_BILLETERA_GROWS.md Bloque 2).
- `/api/tareas-subtareas/[id]/validar` (valida bloques y gatilla wallet) (docs/pagos_movimientos.txt y ANALISIS_BILLETERA_GROWS.md).
- `/api/wallet/saldo`, `/api/wallet/movimientos`, `/api/wallet/creditos`, `/api/wallet/debitos` (RESUMEN_IMPLEMENTACION.md seccion 3, ANALISIS_BILLETERA_GROWS.md Bloque 5).
- `/api/tareas/[id]/pago/checkout`, `/api/tareas/[id]/pago/escrow` y `/api/payments/webhook` (RESUMEN_ESCROW_IMPLEMENTACION.md secciones 5 y 6).
- `/api/suscripciones/limites` y `/api/obras` reutilizan `plan.service.ts` para limites y costos (RESUMEN_IMPLEMENTACION.md seccion 3).

## FSM real implementada
- Tareas: `pendiente -> en_progreso` (SOCIO), `en_progreso -> para_validar` (SOCIO), `para_validar -> validada | rechazada` (CLIENTE), `rechazada -> en_progreso` (SOCIO), `validada` es terminal. Los triggers impiden superar dos tareas simultaneas por socio (docs/backend_esquema_mvp.md seccion 2; ANALISIS_BILLETERA_GROWS.md Bloque 2).
- Subtareas/bloques: `pendiente -> en_progreso` (SOCIO), `en_progreso -> para_validar` (SOCIO), `para_validar -> validado | rechazado` (CLIENTE), `rechazado -> en_progreso` (SOCIO). Validar requiere evidencia cargada y respeta el limite de dos bloques activos (docs/backend_esquema_mvp.md seccion 3).

## Reglas financieras reales
- Planes FREE/PRO/ENTERPRISE con comisiones 10-15 %, 7.5 %, 4 % y limites de 5/10/20 obras (RESUMEN_IMPLEMENTACION.md seccion 1; docs/pagos_movimientos.txt describe como se aplica el porcentaje a cada movimiento).
- `WalletService.registrarPagoPorTarea`/`registrarPagoPorBloque` crea 3 movimientos: credito neto al socio, debito de comision y credito a Grows. Se persisten `porcentaje_comision`, factores de reputacion/oferta y `plan_aplicado` (docs/pagos_movimientos.txt, RESUMEN_IMPLEMENTACION.md seccion 2).
- Suspensiones automaticas: cuando `saldo_actual < limite_sobregiro` se marca `wallet_saldos.suspendido` y se registra en `socio_suspensiones` (docs/backend_esquema_mvp.md secciones 1.2 y 4).

## Validacion de subtareas
- `/api/tareas-subtareas/[id]/validar` marca la subtarea como `validado`, exige evidencia (constraint) y llama al WalletService (docs/pagos_movimientos.txt, ANALISIS_BILLETERA_GROWS.md Bloque 2).
- La combinacion de `evidencia_obligatoria = true` + `CHECK (estado <> 'validado' OR evidencia_cargada)` evita validaciones sin prueba (docs/backend_esquema_mvp.md seccion 3).

## Flujo de pagos (efectivo y escrow)
1. Presupuesto aprobado genera `dias_presupuesto` y subtareas planificadas. No hay movimientos aun (docs/pagos_movimientos.txt).
2. El cliente puede pagar en efectivo (flujo directo) o crear un escrow via `POST /api/tareas/[id]/pago/checkout` (RESUMEN_ESCROW_IMPLEMENTACION.md seccion 5).
3. El webhook de MercadoPago marca la transaccion como `retenido`; al validar la subtarea se ejecuta `EscrowService.liberarFondosPorTarea` y se registran los movimientos con `metodo_pago='ONLINE'` y `escrow_id`. Si no existe escrow, el WalletService registra el pago como `EFECTIVO` (RESUMEN_ESCROW_IMPLEMENTACION.md seccion 6, docs/pagos_movimientos.txt).
4. Al validar todos los bloques la tarea pasa a `validada` y no se genera un movimiento adicional (docs/pagos_movimientos.txt).

## Reglas de planes implementadas
- `plan.service.ts` expone `obtenerConfigPlan`, `calcularComision`, `validarLimiteObras`, `obtenerCostoObrasExtras`. `/api/suscripciones/limites` y `/api/obras` ya consumen estas funciones (RESUMEN_IMPLEMENTACION.md secciones 1-3).
- Enterprise cobra USD 20 por obra extra; FREE y PRO tienen limites estrictos (RESUMEN_IMPLEMENTACION.md).

## SQL relevante ya preparado
- `supabase/migrations/20251210T120000_wallet_schema.sql`: crea enums de wallet, `wallet_saldos`, `wallet_movimientos`, `socio_suspensiones`, triggers de suspension y timestamps (docs/backend_esquema_mvp.md seccion 5).
- `supabase/migrations/20251210T121000_tareas_fsm_enum.sql`: migra `tareas.estado`, agrega `dias_presupuesto`, `responsable_socio_id` y triggers de sincronizacion/limite (docs/backend_esquema_mvp.md seccion 5).
- `supabase/migrations/20251210T122000_tareas_subtareas_blocks.sql`: normaliza subtareas, agrega `bloque_index`, `socio_id`, `presupuesto_id`, `evidencia_cargada` y triggers de conteo y evidencia (docs/backend_esquema_mvp.md seccion 5).
- `sql/create_escrow_tables.sql`: define `escrow_transacciones` y FK para wallet (RESUMEN_ESCROW_IMPLEMENTACION.md).

## Backend operativo hoy
- Calcula y aplica comisiones segun plan al registrar pagos (RESUMEN_IMPLEMENTACION.md seccion 2).
- Expone endpoints de wallet para saldos, movimientos y ajustes (RESUMEN_IMPLEMENTACION.md seccion 3; ANALISIS_BILLETERA_GROWS.md Bloque 5).
- Genera y libera escrows con MercadoPago (RESUMEN_ESCROW_IMPLEMENTACION.md secciones 1-6).
- Valida tareas y subtareas guardando eventos y evidencias (`eventos`, `media`) (ANALISIS_BILLETERA_GROWS.md Bloque 2).
- Triggers y constraints estan definidos para suspensiones, limites de bloques/tareas y evidencia obligatoria (docs/backend_esquema_mvp.md).
- La navegacion socio/cliente tiene ubicaciones claras para exponer saldo y movimientos (ANALISIS_BILLETERA_GROWS.md Bloque 1 y docs/pagos_movimientos.txt).
