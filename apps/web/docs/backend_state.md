Estado: Backend listo para QA. No hay trabajo core esta semana, solo soporte + correcciones de bugs.

# Backend State (MVP 1.0)

## Estado general
- Backend estable sobre Supabase con FSM oficial, wallet MVP y triggers en produccion. Solo se atienden tickets de soporte y bugfix puntuales.
- Toda la informacion de este documento describe comportamientos ya implementados en codigo (`lib/services/*`, `app/api/*`, `supabase/migrations/20251210*.sql`). No hay features conceptuales ni estados legacy activos.

## FSM oficial

### Tareas
- Estados oficiales (`tarea_estado_oficial`, `TareaFsmService`): `pendiente`, `en_progreso`, `para_validar`, `validada`, `rechazada`.
- Transiciones aplicadas por rol:
  - SOCIO: `pendiente -> en_progreso`, `en_progreso -> para_validar`, `rechazada -> en_progreso`.
  - CLIENTE: `para_validar -> validada | rechazada`, `rechazada -> en_progreso` para reabrir.
  - `validada` es terminal.
- `POST /api/tareas/[id]/transition` aplica `requestSchema` restringido y normaliza cualquier legacy hacia los estados oficiales mediante `TareaFsmService.mapLegacyToOficial`. No se guardan estados fuera del enum.
- Guardias dentro de `TareaFsmService.enforceTransition`:
  - Antes de `validada` se ejecuta `assertSubtareasValidadas` para asegurar que no queden bloques pendientes.
  - Antes de `en_progreso` se ejecuta `assertSocioPuedeOperar`, que combina `WalletMvpService.verificarSocioNoSuspendido` con `assertMaxTareasActivas` (maximo 2 tareas simultaneas por socio).
  - El rol `CLIENTE` es el unico que puede rechazar.
  - El handler valida permisos (`PermisoService`), responsable asignado, precedencias (`tarea_precedencias`), checklist completo y adjuntos (foto/firma/acta PDF).
- Eventos quedan registrados en `tareas_eventos` y `tareas_estados` como historico.

### Subtareas / bloques
- Estados oficiales (`tarea_subtarea_estado_oficial`, `SubtareaMvpService`): `pendiente`, `en_progreso`, `para_validar`, `validado`, `rechazado`.
- Flujo:
  1. `POST /api/tareas-subtareas/[id]/iniciar` (SOCIO) llama a `SubtareaMvpService.iniciarBloque`, valida socio asignado, suspension y el limite de 2 bloques activos antes de mover a `en_progreso`.
  2. `POST /api/tareas-subtareas/[id]/enviar-validar` (SOCIO) exige bloque en `en_progreso` y evidencia cargada cuando `evidencia_obligatoria=true` para pasar a `para_validar`.
  3. `POST /api/tareas-subtareas/[id]/validar` (CLIENTE) ejecuta `SubtareaMvpService.validarSubtarea` y permite `accion=validar` (pago) o `accion=rechazar` (vuelve a `rechazado`).
- Pagos y estado de la tarea:
  - Al validar un bloque se invoca `WalletMvpService.registrarPagoPorBloque`, que acredita al socio, cobra la comision de la organizacion, registra ambos movimientos y vuelve a verificar suspension antes del pago.
  - Si despues de validar no quedan otros bloques sin `validado`, se llama a `TareaFsmService.enforceTransition` para mover la tarea a `validada` de forma automatica.

## Reglas de bloques
- Generacion: `SubtareaMvpService.generarBloquesDesdePresupuesto` crea un bloque por cada dia confirmado (`tareas.dias_presupuesto`, `tareas.bloques_planificados` o `tareas_presupuestos.dias_reales`). Cada bloque queda con `bloque_index` correlativo y `monto_estimado = monto_total / dias`, cumpliendo la regla `1 bloque = 1 dia`.
- Unicidad: la migracion `supabase/migrations/20251210T122000_tareas_subtareas_blocks.sql` impone `UNIQUE (tarea_id, bloque_index)` y hereda `socio_id` desde la tarea, garantizando `bloque_index` unico.
- Evidencia: `evidencia_obligatoria` es `true` por defecto y el trigger `tareas_subtareas_evidencia_check` impide marcar `validado` sin evidencia. `enviarParaValidar` y `validarSubtarea` vuelven a verificar que exista evidencia cargada.
- Limites concurrentes: `SubtareaMvpService.assertMaxBloquesActivos` y el trigger `trg_enforce_socio_max_bloques` bloquean un tercer bloque `en_progreso`. La misma logica aplica a tareas mediante `assertMaxTareasActivas`.
- Flujo operativo: `pendiente -> en_progreso -> para_validar -> validado`, con `rechazado -> en_progreso` para rehacer. QA debe verificar la secuencia completa (inicio, carga evidencia, envio, validacion).
- Cierre automatico: la tarea pasa a `validada` en cuanto todos los bloques estan `validado`, sin acciones manuales extra.

## Planes y comisiones
- `lib/services/plan.service.ts` define configuraciones reales:
  - FREE: comision dinamica entre 10% y 15% (`comisionMin=0.10`, `comisionMax=0.15`), limite 5 obras, sin costo mensual.
  - PRO: comision fija 7.5% (`comisionFija=0.075`), limite 10 obras, USD 100/mes.
  - ENTERPRISE: comision fija 4% (`comisionFija=0.04`), limite 20 obras (extras se cobran), USD 200/mes.
- `WalletMvpService.registrarPagoPorBloque` toma el plan de la organizacion via `obtenerConfigPlan`, calcula la comision por bloque (no por tarea) y genera dos movimientos:
  - Credito del socio con `monto_bruto`, `monto_comision`, `monto_neto`, `plan_aplicado` y `porcentaje_comision`.
  - Credito de la organizacion por la comision cobrada.
- `wallet_movimientos` actua como snapshot: cada fila guarda `owner_tipo`, `tarea_id`, `subtarea_id`, `presupuesto_id`, `origen`, metodo de pago, plan aplicado y factores de reputacion/oferta. Asi queda documentado el plan aplicado y el calculo por bloque.

## Wallet MVP
- Tablas: `wallet_saldos` mantiene `owner_tipo (SOCIO|ORG)`, `owner_id`, `saldo_actual`, `saldo_pendiente`, `moneda`, `suspendido`, `limite_sobregiro=-50000` y metadata. `wallet_movimientos` referencia `wallet_saldos` y cada subtarea pagada.
- API:
  - `GET /api/wallet/saldo` resuelve automaticamente si el usuario es socio (match por `socios.user_id` o email) u organizacion (`organizaciones.owner_user_id`). Devuelve `saldo_actual`, `saldo_pendiente` y `moneda`. El flag `suspendido` se usa solo server-side para bloquear acciones y no se expone en este payload.
  - `GET /api/wallet/movimientos?limit=&offset=` aplica la misma resolucion de propietario y retorna `movimientos`, `total` y `paginacion`. Cada item proviene directo de `wallet_movimientos`, por lo que refleja pagos por bloque, comisiones y metadatos (subtarea, presupuesto, plan).
  - No existen endpoints extra de wallet; toda la operacion es por bloque validado.

## Suspension y limites del socio
- `enforce_wallet_suspension` (migracion `20251210T120000_wallet_schema.sql`) marca `suspendido=true` y guarda un registro en `socio_suspensiones` cuando `saldo_actual < -50000`. Al revertirse el saldo, el trigger libera la suspension y completa el historial.
- `WalletMvpService.verificarSocioNoSuspendido` se ejecuta en:
  - `TareaFsmService.assertSocioPuedeOperar` (impide iniciar tareas en `en_progreso`).
  - `SubtareaMvpService.iniciarBloque` (impide iniciar bloques).
  - `WalletMvpService.registrarPagoPorBloque` (impide pagar a un socio suspendido).
- Resultado: un socio suspendido no puede arrancar tareas ni bloques y tampoco recibe pagos hasta normalizar el saldo. `POST /api/tareas-subtareas/[id]/enviar-validar` no vuelve a consultar el estado de suspension; si un socio se suspende despues de iniciar, puede enviar evidencia igual. QA debe registrarlo como comportamiento actual.
- Limites adicionales activos:
  - Maximo 2 tareas en `en_progreso` por socio (service + trigger).
  - Maximo 2 bloques en `en_progreso` por socio (service + trigger).

## Endpoints activos
- `/api/tareas/[id]/transition` (POST): valida rol con `PermisoService`, responsable, checklist, media, precedencias y delega en `TareaFsmService`. Errores regresan con codigos (`TRANSICION_NO_PERMITIDA`, `SOCIO_SUSPENDIDO`, `SUBTAREAS_INCOMPLETAS`, etc.).
- `/api/tareas-subtareas/[id]/iniciar` (POST SOCIO): mueve a `en_progreso` verificando suspension y limite de bloques.
- `/api/tareas-subtareas/[id]/enviar-validar` (POST SOCIO): requiere bloque en progreso y evidencia obligatoria antes de pasar a `para_validar`.
- `/api/tareas-subtareas/[id]/validar` (POST CLIENTE): permite validar o rechazar un bloque, registra el pago por bloque y dispara la validacion automatica de la tarea cuando no quedan bloques pendientes.
- `/api/wallet/saldo` (GET) y `/api/wallet/movimientos` (GET) exponen el estado real de la wallet MVP (saldos y movimientos con snapshot del plan).

## Soporte
- No hay features core en curso. Foco semanal: soporte de QA, bugs y verificacion documental. Cambios funcionales nuevos deben pasar primero por soporte/QA antes de planificarse.
