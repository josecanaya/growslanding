# Contexto de Negocio - Reglas y Comportamientos Implementados

**Fecha de extracción:** Diciembre 2024  
**Fuente:** Documentación técnica y código implementado  
**Nota:** Este documento contiene SOLO reglas y comportamientos ya definidos y codificados.

---

## 1. Conceptos Base

### 1.1 Tareas
- **Estados oficiales:** `pendiente`, `en_progreso`, `para_validar`, `validada`, `rechazada`
- **Estados legacy mapeados:**
  - `finalizado` → `para_validar`
  - `validado` → `validada`
  - `en_ejecucion` → `en_progreso`
  - `propuesta/presupuestada/asignada` → `pendiente`
  - `en_revision` → `para_validar`
- **Campos obligatorios:**
  - `bloques_planificados`: `integer NOT NULL DEFAULT 1` con `CHECK (bloques_planificados >= 1)`
  - `dias_presupuesto`: snapshot de días aprobados (`integer NOT NULL`)
  - `responsable_socio_id`: `uuid REFERENCES socios(id)` para límite de tareas activas
- **Constraint:** `CHECK (bloques_planificados = dias_presupuesto)` - obliga sincronización

### 1.2 Subtareas (Bloques Pagables)
- **Estados oficiales:** `pendiente`, `en_progreso`, `para_validar`, `validado`, `rechazado`
- **Estados legacy mapeados:**
  - `finalizada` → `para_validar`
  - `validada` → `validado`
- **Campos obligatorios:**
  - `bloque_index`: `integer NOT NULL`, `UNIQUE(tarea_id, bloque_index)` - identifica cada día/bloque
  - `socio_id`: `uuid REFERENCES socios(id)` - default heredado de tarea
  - `presupuesto_id`: `uuid REFERENCES tareas_presupuestos(id)` - link al presupuesto
  - `monto_estimado`: `numeric(15,2) NOT NULL` - monto del bloque
  - `evidencia_obligatoria`: `boolean NOT NULL DEFAULT true`
  - `evidencia_cargada`: `boolean NOT NULL DEFAULT false`
- **Constraint:** `CHECK (estado <> 'validado' OR evidencia_cargada)` - no permite validar sin evidencia

### 1.3 Bloques
- **Relación con días:** Cada bloque = 1 día de presupuesto
- **Cantidad:** `bloques_planificados` debe igualar `dias_presupuesto` de la tarea
- **Generación:** Se generan automáticamente desde presupuestos aprobados
- **Proporcionalidad:** `monto_estimado` debe ser proporcional al monto total del presupuesto dividido por días

---

## 2. FSM Real Implementada

### 2.1 Estados de Tarea (FSM Principal)
```typescript
Estados: 'PROPUESTA' | 'PRESUPUESTADA' | 'ASIGNADA' | 'EN_EJECUCION' | 'TERMINADA' | 'VALIDADA'
```

### 2.2 Transiciones Permitidas
- **PROPUESTA → PRESUPUESTADA:**
  - Actor permitido: `SOCIO` o `CLIENTE_TECNICO`
  - Acción: Socio sube presupuesto o cliente lo acepta

- **PRESUPUESTADA → ASIGNADA:**
  - Actor permitido: `CLIENTE_TECNICO`
  - Acción: Cliente asigna tarea

- **ASIGNADA → EN_EJECUCION:**
  - Actor permitido: `SOCIO`
  - Acción: Socio inicia trabajo

- **EN_EJECUCION → TERMINADA:**
  - Actor permitido: `SOCIO`
  - Acción: Socio finaliza trabajo

- **TERMINADA → VALIDADA:**
  - Actor permitido: `CLIENTE_TECNICO`
  - Acción: Cliente valida tarea
  - **Efecto:** Dispara pago automático (escrow o efectivo)

- **TERMINADA → EN_EJECUCION:**
  - Actor permitido: `SOCIO`
  - Acción: Rollback con motivo obligatorio
  - **Validación:** Requiere `motivo` no vacío

### 2.3 FSM Legacy (fsm.ts)
```typescript
Estados: 'pendiente' | 'en_ejecucion' | 'finalizado' | 'validado'

Transiciones:
- pendiente → en_ejecucion
- en_ejecucion → finalizado
- finalizado → validado
- finalizado → en_ejecucion (rollback con motivo)
```

---

## 3. Reglas de Validación Real

### 3.1 Validación de Tareas
- **Estado requerido:** Tarea debe estar en `TERMINADA` para validar
- **Actor requerido:** Solo `CLIENTE_TECNICO` puede validar
- **Efecto automático:** Al validar se dispara:
  1. `crearPagoAutomatico()` - crea registro en tabla `pagos`
  2. `EscrowService.liberarFondosPorTarea()` - intenta liberar escrow si existe
  3. Si no hay escrow: `crearMovimientosWallet()` - registra pago en efectivo

### 3.2 Validación de Subtareas/Bloques
- **Evidencia obligatoria:** No se puede validar bloque sin `evidencia_cargada = true`
- **Constraint DB:** `CHECK (estado <> 'validado' OR evidencia_cargada)`
- **Validación parcial:** Se puede validar bloques individuales sin validar toda la tarea

### 3.3 Límites de Tareas Activas por Socio
- **Máximo:** 2 tareas simultáneas en estado `en_progreso` por socio
- **Trigger:** `enforce_socio_max_tareas` bloquea si se excede
- **Validación:** Se ejecuta `BEFORE INSERT OR UPDATE` en `tareas`

### 3.4 Límites de Bloques Activos por Socio
- **Máximo:** 2 bloques simultáneos en estado `en_progreso` por socio
- **Trigger:** `enforce_socio_max_bloques` bloquea si se excede
- **Validación:** Se ejecuta sobre cambios a `estado` en `tareas_subtareas`

### 3.5 Control de Cantidad de Bloques
- **Trigger:** `enforce_subtarea_count` bloquea insertar más bloques que `tareas.bloques_planificados`
- **Validación:** `COUNT(*) FILTER (estado <> 'rechazado') <= tareas.bloques_planificados`
- **Constraint:** No se pueden crear más bloques que días planificados

---

## 4. Reglas Actuales de Planes y Comisiones

### 4.1 Planes Implementados

#### FREE
- **Costo mensual:** 0 USD
- **Límite obras activas:** 5
- **Comisión:** Variable 10-15% (promedio 15%)
  - Mínimo: 10% (0.10)
  - Máximo: 15% (0.15)
  - Cálculo: `comisionMin + (comisionMax - comisionMin) * factor`
  - Factor: `(reputacion + ofertaDemanda) / 2`
- **Costo obra extra:** No aplica

#### PRO
- **Costo mensual:** 100 USD
- **Límite obras activas:** 10
- **Comisión:** Fija 7.5% (0.075)
- **Costo obra extra:** No aplica

#### ENTERPRISE
- **Costo mensual:** 200 USD
- **Límite obras activas:** 20 (base, permite extras)
- **Comisión:** Fija 4% (0.04)
- **Costo obra extra:** 20 USD por obra extra

### 4.2 Cálculo de Comisiones
- **Función:** `calcularComision(monto, planConfig, options?)`
- **Lógica:**
  - Si `comisionFija !== null` → usa valor fijo
  - Si `comisionFija === null` → calcula variable según factores
- **Factores dinámicos (FREE):**
  - `reputacion`: 0-1 (default 0.5)
  - `ofertaDemanda`: 0-1 (default 0.5)
  - Factor final: `(reputacion + ofertaDemanda) / 2`
- **Almacenamiento:** Se guarda `porcentaje_comision` en `wallet_movimientos` para auditoría

### 4.3 Validación de Límites de Obras
- **Función:** `validarLimiteObras(orgId)`
- **Lógica:**
  - Cuenta obras con `estado = 'ACTIVA'`
  - FREE/PRO: Bloquea si `obrasActivas >= limiteObras`
  - ENTERPRISE: Permite extras (no bloquea, pero cobra)
- **Endpoint:** `/api/obras` (POST) valida antes de crear

### 4.4 Planes de Suscripción (Frontend)
- **FREE:** 2 obras activas, 0 tareas activas, 0 cuadrillas
- **STARTER:** 5 obras activas, 3 tareas activas, 3 cuadrillas (15.000 ARS/mes)
- **PRO:** 10 obras activas, 10 tareas activas, cuadrillas ilimitadas

---

## 5. Reglas de Wallet

### 5.1 Estructura de Wallet
- **Tipos de owner:** `SOCIO`, `ORG`
- **Tablas:**
  - `wallet_saldos`: Saldos actuales y pendientes
  - `wallet_movimientos`: Historial de movimientos
  - `socio_suspensiones`: Historial de suspensiones

### 5.2 Tipos de Movimientos
- **CREDITO:** Aumenta saldo
- **DEBITO:** Disminuye saldo
- **Estados:** `pendiente`, `completado`, `cancelado`
- **Métodos de pago:** `EFECTIVO`, `ONLINE`

### 5.3 Registro de Pago por Tarea
**Función:** `WalletService.registrarPagoPorTarea()`

**Proceso:**
1. Obtiene configuración del plan de la organización
2. Calcula comisión según plan (variable o fija)
3. Crea 3 movimientos:
   - **Crédito al socio:** `montoTotal - comision`
   - **Débito del socio:** `comision` (comisión)
   - **Crédito a Grows/ORG:** `comision`
4. Actualiza saldos automáticamente
5. Vincula con `tarea_id`, `presupuesto_id`, `escrow_id` (si aplica)

**Campos guardados:**
- `monto_bruto`: monto del bloque
- `monto_comision`: comisión calculada
- `monto_neto`: `monto_bruto - monto_comision`
- `porcentaje_comision`: % aplicado (snapshot)
- `plan_aplicado`: snapshot del plan
- `metodo_pago`: `EFECTIVO` o `ONLINE`
- `origen`: `VALIDACION_TAREA` o `VALIDACION_BLOQUE`

### 5.4 Suspensión Automática de Socios
- **Trigger:** `enforce_wallet_suspension`
- **Condición:** Si `owner_tipo='SOCIO'` y `saldo_actual < limite_sobregiro`
- **Límite sobregiro:** `-50000` ARS (default)
- **Acción:**
  - Marca `suspendido=true`
  - Establece `suspendido_desde=now()`
  - Crea registro en `socio_suspensiones`
- **Reactivación:** Si saldo vuelve >= límite → `suspendido=false`, `suspendido_desde=NULL`

### 5.5 Saldos
- **Saldo actual:** `saldo_actual` - disponible para retiro
- **Saldo pendiente:** `saldo_pendiente` - movimientos pendientes
- **Moneda:** `ARS` (default)
- **Creación automática:** Si no existe saldo, se crea en cero

---

## 6. Reglas Operativas Socio/Cliente Implementadas

### 6.1 Flujo de Presupuestos
1. **Socio crea presupuesto:**
   - Estado: `PENDIENTE`
   - Campos: `monto`, `cantidad`, `unidad`, `dias_reales`
2. **Socio envía presupuesto:**
   - Estado: `ENVIADO`
   - Genera PDF
3. **Cliente aprueba presupuesto:**
   - Endpoint: `/api/presupuestos/aprobar-socio`
   - Estado: `APROBADO`
   - Asigna tarea al socio
   - Rechaza otros presupuestos de la misma tarea
   - Crea evento de asignación
   - **NO genera pago todavía**

### 6.2 Flujo de Ejecución
1. **Socio inicia tarea:**
   - Estado: `ASIGNADA` → `EN_EJECUCION`
   - Crea jornada en `jornadas_socio`
2. **Socio ejecuta bloques:**
   - Inicia/finaliza subtareas (bloques)
   - Carga evidencias obligatorias
   - Estado bloque: `pendiente` → `en_progreso` → `para_validar`
3. **Socio finaliza tarea:**
   - Estado: `EN_EJECUCION` → `TERMINADA`
   - **NO genera pago todavía**

### 6.3 Flujo de Validación y Pago
1. **Cliente valida tarea:**
   - Estado: `TERMINADA` → `VALIDADA`
   - Actor: `CLIENTE_TECNICO`
2. **Sistema procesa pago:**
   - Intenta liberar escrow si existe
   - Si hay escrow: libera y registra como `ONLINE`
   - Si no hay escrow: registra como `EFECTIVO`
3. **Registro en wallet:**
   - Crédito socio: `montoTotal - comision`
   - Débito socio: `comision`
   - Crédito Grows: `comision`

### 6.4 Jornadas de Socio
- **Creación:** Al iniciar trabajo diario
- **Finalización:** Al terminar jornada
- **Tabla:** `jornadas_socio`
- **Validación:** Detecta jornadas duplicadas (no previene completamente)

---

## 7. Flujo AHORA Real Definido

### 7.1 Vista "Ahora" del Socio
- **Ruta:** `/socio/ahora`
- **Funcionalidades:**
  - Inicio/finalización de jornada laboral
  - Gestión de tareas y subtareas (bloques pagables)
  - Inicio/finalización de tareas con estados FSM
  - Modal obligatorio para finalizar subtareas:
    - Evidencia
    - Video
    - Problemas
    - Control de calidad
  - Generación automática de subtareas desde presupuestos
  - Estadísticas diarias (tareas completadas vs programadas)
  - Accesos rápidos: Checklist, Planos, Chat, Evidencias
  - Integración con `jornadas_socio`
  - Ordenamiento por CPM (Critical Path Method)
  - Modo compatibilidad para tareas sin subtareas

### 7.2 Flujo de Trabajo Diario
1. Socio inicia jornada
2. Ve tareas asignadas ordenadas por CPM
3. Inicia tarea → estado `EN_EJECUCION`
4. Trabaja en bloques (subtareas):
   - Inicia bloque
   - Carga evidencias obligatorias
   - Finaliza bloque → estado `para_validar`
5. Finaliza tarea → estado `TERMINADA`
6. Cliente valida → estado `VALIDADA` → pago automático

---

## 8. Políticas Ya Incorporadas

### 8.1 Política de Evidencias
- **Obligatorias:** `evidencia_obligatoria = true` por defecto
- **Validación:** No se puede validar bloque sin `evidencia_cargada = true`
- **Tipos:** Fotos, videos, comentarios

### 8.2 Política de Límites
- **Tareas activas por socio:** Máximo 2 simultáneas
- **Bloques activos por socio:** Máximo 2 simultáneos
- **Obras activas por plan:** Según plan (FREE: 5, PRO: 10, ENTERPRISE: 20+)

### 8.3 Política de Comisiones
- **FREE:** Variable 10-15% según factores
- **PRO:** Fija 7.5%
- **ENTERPRISE:** Fija 4%
- **Auditoría:** Se guarda `porcentaje_comision` y `plan_aplicado` en cada movimiento

### 8.4 Política de Suspensión
- **Límite sobregiro:** -50.000 ARS
- **Automática:** Se suspende si saldo < límite
- **Reactivación:** Automática cuando saldo >= límite
- **Efecto:** Socios suspendidos no pueden validar nuevas tareas

### 8.5 Política de Escrow
- **Opcional:** Sistema tolera pagos sin escrow (efectivo)
- **Flujo:** Si hay escrow → libera al validar, si no → registra efectivo
- **Estados:** `pendiente` → `retenido` → `liberado`
- **Integración:** Vinculado con MercadoPago

### 8.6 Política de Sincronización
- **Bloques = Días:** `bloques_planificados` debe igualar `dias_presupuesto`
- **Trigger:** `sync_dias_presupuesto` sincroniza automáticamente
- **Origen:** Se actualiza desde `tareas_presupuestos.dias_reales` cuando se aprueba

---

## 9. Integraciones Implementadas

### 9.1 MercadoPago
- **Suscripciones:** `PreApproval` para planes
- **Tareas (Escrow):** `Preference` para pagos de tareas
- **Webhook:** Procesa confirmaciones de pago
- **Estados:** `approved`, `rejected`, `cancelled`, `refunded`

### 9.2 Supabase
- **Realtime:** Notificaciones, mensajes
- **Storage:** Evidencias, PDFs
- **Triggers:** Validaciones, sincronizaciones

### 9.3 n8n
- **Chat:** Respuestas automatizadas
- **Fallback:** Respuestas predefinidas si n8n no está disponible

---

## 10. Endpoints Implementados

### 10.1 Tareas
- `POST /api/tareas/[id]/transition` - Transición de estados FSM
- `GET /api/tareas` - Listar tareas
- `POST /api/tareas/[id]/asignar` - Asignar tarea

### 10.2 Wallet
- `GET /api/wallet/saldo` - Obtener saldo
- `GET /api/wallet/movimientos` - Listar movimientos
- `POST /api/wallet/creditos` - Crear crédito (interno)
- `POST /api/wallet/debitos` - Crear débito (interno)

### 10.3 Escrow
- `POST /api/tareas/[id]/pago/checkout` - Crear checkout de pago
- `GET /api/tareas/[id]/pago/escrow` - Consultar estado de escrow

### 10.4 Presupuestos
- `GET /api/socio/presupuestos` - Listar presupuestos del socio
- `POST /api/presupuestos/aprobar-socio` - Aprobar presupuesto
- `GET /api/presupuestos/pdf` - Obtener PDF
- `POST /api/presupuestos/pdf` - Subir PDF

### 10.5 Obras
- `GET /api/obras` - Listar obras
- `POST /api/obras` - Crear obra (valida límites)
- `GET /api/obras/[id]` - Detalle de obra

---

## 11. Tablas de Base de Datos Críticas

### 11.1 Tareas
- `tareas`: Tareas principales
- `tareas_subtareas`: Bloques pagables
- `tareas_presupuestos`: Presupuestos de tareas
- `tareas_estados`: Historial de estados (legacy)

### 11.2 Wallet
- `wallet_saldos`: Saldos actuales
- `wallet_movimientos`: Movimientos financieros
- `socio_suspensiones`: Historial de suspensiones

### 11.3 Escrow
- `escrow_transacciones`: Transacciones de escrow

### 11.4 Operativas
- `jornadas_socio`: Jornadas laborales
- `eventos`: Historial de eventos
- `media`: Archivos de evidencias
- `pagos`: Registros de pago (legacy, se mantiene)

---

## 12. Servicios Implementados

### 12.1 TareaService
- `cambiarEstadoTarea()`: Maneja transiciones FSM
- `crearPresupuesto()`: Crea presupuestos
- `crearPagoAutomatico()`: Crea registro de pago (legacy)
- `crearMovimientosWallet()`: Registra pagos en wallet

### 12.2 WalletService
- `crearCredito()`: Crea crédito y actualiza saldo
- `crearDebito()`: Crea débito y actualiza saldo
- `obtenerSaldo()`: Obtiene saldo actual
- `obtenerMovimientos()`: Lista movimientos con paginación
- `registrarPagoPorTarea()`: Función principal para pagos automáticos

### 12.3 EscrowService
- `crearIntentoPagoTarea()`: Crea checkout de pago
- `marcarPagoAprobadoDesdeWebhook()`: Procesa confirmación de MP
- `liberarFondosPorTarea()`: Libera fondos al validar tarea
- `obtenerEstadoEscrowTarea()`: Consulta estado de escrow

### 12.4 PlanService
- `obtenerConfigPlan()`: Obtiene configuración del plan
- `calcularComision()`: Calcula comisión según plan
- `validarLimiteObras()`: Valida límites de obras
- `obtenerCostoObrasExtras()`: Calcula costo de obras extras

---

**Fin del documento**















