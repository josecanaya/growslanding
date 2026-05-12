# Billetera Cliente MVP - Prueba manual

> La billetera cliente es interna. Mercado Pago queda preparado con campos `mp_payment_id` y `mp_preference_id`, pero no acredita saldo hasta integrar webhook aprobado.

## 1. Crear wallet

1. Iniciar sesión como `CLIENTE_TECNICO` o `ADMIN`.
2. Abrir `/cliente/billetera`.
3. Verificar que el endpoint `GET /api/cliente/wallet/saldo` responda `success: true`.
4. Confirmar en Supabase que existe una fila en `cliente_wallets` para la `org_id` del usuario.

## 2. Cargar saldo manual

1. En `/cliente/billetera`, pulsar `Cargar saldo de prueba`.
2. Confirmar que `saldo_disponible` sube en `$100.000`.
3. Confirmar un movimiento `CARGA_SALDO` con estado `confirmado` en `cliente_wallet_movimientos`.

## 3. Reservar saldo para tarea

1. Tomar una tarea de la misma organización.
2. Si la tarea tiene presupuesto aprobado, usar su monto; si no, enviar un monto manual solo para prueba controlada:

```bash
curl -X POST http://localhost:3000/api/cliente/wallet/reservar-tarea \
  -H "Content-Type: application/json" \
  --cookie "<cookies de sesión>" \
  -d '{"tareaId":"<uuid-tarea>","monto":50000}'
```

3. Confirmar que baja `saldo_disponible` y sube `saldo_reservado`.
4. Confirmar movimiento `RESERVA_TAREA`.

## 4. Liberar pago

1. Con la misma tarea reservada, llamar:

```bash
curl -X POST http://localhost:3000/api/cliente/wallet/liberar-tarea \
  -H "Content-Type: application/json" \
  --cookie "<cookies de sesión>" \
  -d '{"tareaId":"<uuid-tarea>","socioId":"<uuid-socio>"}'
```

2. Confirmar que baja `saldo_reservado`.
3. Confirmar movimientos `LIBERACION_PAGO` y `COMISION_GROWS` si la comisión calculada es mayor a cero.
4. Confirmar movimiento `CREDITO` en `wallet_movimientos` del socio con origen `CLIENTE_WALLET_LIBERACION`.

## 5. Ver movimientos

1. Abrir `/cliente/billetera`.
2. Confirmar que se ven movimientos recientes.
3. Confirmar por API:

```bash
curl http://localhost:3000/api/cliente/wallet/movimientos --cookie "<cookies de sesión>"
```

## 6. Comprobar saldos

1. Verificar `GET /api/cliente/wallet/saldo`.
2. Confirmar que:
   - `saldo_disponible` refleja cargas menos reservas activas.
   - `saldo_reservado` refleja reservas pendientes de liberar/devolver.
   - `moneda` es `ARS`.
