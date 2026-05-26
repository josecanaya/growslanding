# WALLET_ANALYSIS — Grows (`apps/web`)

## Tablas (Supabase / migraciones)

| Tabla | Rol | Notas |
|-------|-----|--------|
| `cliente_wallets` | Saldo lógico **organización (cliente técnico)** | Un registro por `org_id` (unique), `cliente_user_id` opcional |
| `cliente_wallet_movimientos` | Movimientos internos cliente (reserva, liberación, carga manual, etc.) | Tipos enum SQL; referencia a tareas/subtareas |
| `wallet_saldos` | Saldo **socio u org** MVP | `owner_tipo` + `owner_id` unique |
| `wallet_movimientos` | Créditos/débitos socio (p. ej. `VALIDACION_BLOQUE`, escrow) | FK compuesta a `wallet_saldos`; `subtarea_id` |

**Conclusión:** Son **dos modelos de negocio distintos** hoy:
1. **Reserva / liberación de fondos del cliente** (escrow interno org) → `cliente_*`
2. **Cartera ejecutable del socio** (pagos ganados) → `wallet_*`

Unificar en “una tabla” única obliga **decisión de producto + migración de datos + RPC**.

## Modelo recomendado (fase siguiente)

| Actor | Mantener físicamente | Abstracción código |
|-------|---------------------|---------------------|
| Cliente técnico (org) | `cliente_wallets` (+ movimientos) | `WalletService` → `ClienteWalletFacade` |
| Socio constructor | `wallet_saldos` (+ movimientos) | `WalletService` → `SocioWalletFacade` |

**Modelo conceptual único:** un `WalletService` en aplicación que **no mezcla tablas**, pero centraliza políticas (“tras validar cliente, reconciliar cliente + acreditar socio”).

## Endpoints actuales (inventario)

### Cliente (org)

| Método | Ruta | Servicio principal |
|--------|------|-------------------|
| GET | `/api/cliente/wallet/saldo` | `ClienteWalletService.getOrCreateWallet` |
| GET | `/api/cliente/wallet/movimientos` | `ClienteWalletService.listarMovimientos` |
| POST | `/api/cliente/wallet/carga-manual` | RPC `cliente_wallet_acreditar_manual` |
| POST | `/api/cliente/wallet/reservar-tarea` | RPC reserva |
| POST | `/api/cliente/wallet/liberar-tarea` | RPC liberación |
| POST | `/api/cliente/wallet/reconciliar-validadas` | `ClienteWalletService.reconciliarSubtareasValidadasOrg` |

### Socio / operaciones mixtas MVP

| Método | Ruta | Servicio principal |
|--------|------|---------------------|
| GET | `/api/wallet/saldo` | `WalletMvpService.obtenerSaldo` (+ `resolveOwner`) |
| GET | `/api/wallet/movimientos` | wallet_movimientos |
| POST | `/api/wallet/pagar-bloque` | pago bloque |
| GET/POST | `/api/wallet/debitos`, `/creditos` | Movimientos |
| PATCH | otros legacy | revisar llamadas |

### Pagos externos

| Ruta | Uso |
|------|-----|
| `/api/tareas/[id]/pago/checkout`, `escrow`, `/api/payments/webhook` | MercadoPago cuando configurado |

## Componentes UI

| Componente | API usada |
|------------|-----------|
| `components/cliente/BilleteraSection.tsx` | `useWalletCliente` → `/api/cliente/wallet/*` |
| `app/socio/billetera/page.tsx` | Saldo socio (mix mock removido en prod / API wallet) |

## Migración solicitada (“una sola wallet”)

**No ejecutada en este PR** — riesgo de romper flujo sagrado Obra→…→Wallet.

Pasos futuros recomendados:
1. Documentar invariantes financieros (reserva cliente ≠ saldo ejecutable socio).
2. Introducir `lib/services/wallet.service.ts` (fachada) que delegue a `ClienteWalletService` y `WalletMvpService`.
3. Mover llamadas repetidas desde rutas HTTP a esa fachada.
4. Sólo si negocio lo exige: migración física uniendo tablas (SQL + dual-write + cutover).
