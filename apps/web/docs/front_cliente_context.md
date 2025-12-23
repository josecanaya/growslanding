# CONTEXTO ACTUAL — FRONTEND CLIENTE/SUPERVISOR GROWS
**Fecha:** Diciembre 2024  
**Versión:** MVP 1.0

---

## 1. PANTALLAS Y COMPONENTES REALES IMPLEMENTADOS

### 1.1 Dashboard Principal
**Ruta:** `/cliente/dashboard`  
**Componente:** `app/cliente/dashboard/page.tsx`

- ✅ Sidebar de navegación (`SidebarClienteTecnico.tsx`) con 8 secciones principales
- ✅ Sistema de secciones dinámicas con routing por query params (`?section=obras`)
- ✅ Contador de notificaciones no leídas en tiempo real
- ✅ Autenticación y redirección a onboarding si falta `orgId`
- ✅ Layout responsive con sidebar colapsable (220px expandido, 28px colapsado)

**Secciones disponibles:**
1. Chat - Mensajería con GrowsBot
2. Obras - Gestión de obras activas
3. Tareas - Gestión y seguimiento de tareas
4. Cuadrillas - Administración de cuadrillas
5. Billetera - Pagos y recibos del cliente
6. Notificaciones - Alertas y notificaciones del sistema
7. Calendario - Vista de calendario de eventos
8. Cuenta - Configuración de perfil y cuenta

---

### 1.2 Gestión de Obras
**Componente:** `components/cliente/ObrasSection.tsx`  
**Ruta:** `/cliente/dashboard?section=obras`

**Funcionalidades implementadas:**
- ✅ Lista de todas las obras de la organización
- ✅ Cards con información básica: nombre, ubicación, estado, fechas
- ✅ Estados: ACTIVA, PAUSADA, FINALIZADA, CANCELADA
- ✅ Estadísticas: total obras, activas, pausadas, finalizadas, canceladas
- ✅ Acciones: Ver detalle, Editar, Eliminar
- ✅ Crear nueva obra (vía modal o wizard)
- ✅ Vista detallada (`DetalleObra.tsx`)
- ✅ Integración con límites de suscripción (FREE: 2, STARTER: 5, PRO: 10)
- ✅ Modal de upgrade cuando se alcanza límite

**Endpoints utilizados:**
- `GET /api/obras` - Listar obras
- `GET /api/obras/[id]` - Detalle de obra
- `PATCH /api/obras/[id]` - Actualizar obra
- `GET /api/obras/[id]/elementos` - Elementos de obra
- `GET /api/obras/[id]/plantas` - Plantas de obra (verificar si existe)
- `POST /api/obras/[obraId]/elementos` - Crear elemento
- `PATCH /api/obras/[obraId]/elementos/[id]` - Editar elemento

**Tablas Supabase:**
- `obras` (id, org_id, name, address, estado, created_at, propietario, tipo_obra, plantas, terreno, superficies, latitud, longitud)

---

### 1.3 Gestión de Tareas
**Componente:** `components/cliente/TareasSection.tsx`  
**Ruta:** `/cliente/dashboard?section=tareas`

**Funcionalidades implementadas:**
- ✅ Vista de obras con resumen de tareas
- ✅ Vista detallada por obra con tabs: Organiza, Asigna, Validar, Etapas, Resumen
- ✅ Editor visual de planificación (`EditorVisualTareas.tsx`)
- ✅ Gestión de precedencias entre tareas
- ✅ Estadísticas: total tareas, pendientes, en progreso, finalizadas
- ✅ Filtrado por obra

**Tabs disponibles:**
- **Organiza:** Editor visual para organizar tareas y precedencias
- **Asigna:** Asignación de tareas a cuadrillas y socios (`AsignarSection.tsx`)
- **Validar:** Validación de bloques pagables (`ValidarSection.tsx`)
- **Etapas:** Vista por etapas de construcción (`EtapasSection.tsx`)
- **Resumen:** Resumen general de tareas

**Endpoints utilizados:**
- `GET /api/tareas` - Listar tareas
- `POST /api/tareas` - Crear tarea
- `PATCH /api/tareas/[id]` - Actualizar tarea
- `POST /api/tareas/[id]/transition` - Cambiar estado de tarea
- `GET /api/presupuestos` - Listar presupuestos
- `POST /api/presupuestos/aprobar-socio` - Aprobar presupuesto
- `POST /api/presupuestos/rechazar` - Rechazar presupuesto
- `GET /api/presupuestos/pdf` - Ver PDF de presupuesto

**Estados de tareas (FSM oficial):**
- `pendiente` / `en_progreso` / `para_validar` / `validada` / `rechazada`

---

### 1.4 Validación de Bloques (ValidarSection)
**Componente:** `components/cliente/ValidarSection.tsx`  
**Ruta:** `/cliente/dashboard?section=tareas` (tab Validar)

**Estado actual (MVP 1.0 refactorizado):**
- ✅ Lista de tareas con bloques en estado `para_validar`
- ✅ Vista de evidencias fotográficas por tarea (desde `tareas_evidencias` y `media` vía eventos)
- ✅ Evidencias por bloque individual (desde `evidencia_url` en `tareas_subtareas`)
- ✅ Validación individual de bloques pagables
- ✅ Rechazo de bloques con motivo opcional
- ✅ Vista de tareas ya validadas (todas las subtareas validadas)
- ✅ Filtrado por obra
- ✅ Formateo de montos en ARS
- ✅ Modales de confirmación para validar/rechazar
- ✅ Resumen de tarea: total bloques, validados, rechazados
- ✅ Estados oficiales FSM: `pendiente`, `para_validar`, `validado`, `rechazado`
- ✅ Botones solo cuando `estado === "para_validar"`
- ✅ Banner de upgrade para usuarios FREE/STARTER
- ✅ Sin console.logs
- ✅ Refresco automático de datos tras validar/rechazar

**Proceso de validación:**
1. Cliente ve bloques en estado `para_validar`
2. Cliente revisa evidencias fotográficas (tarea y bloque)
3. Cliente valida o rechaza el bloque (modal de confirmación)
4. Si valida: backend procesa pago automático
5. Si rechaza: bloque vuelve a estado `rechazado`, socio puede retomarlo
6. Cuando todos los bloques están `validado`, backend marca tarea como `validada`

**Endpoints utilizados:**
- `GET /api/tareas` - Obtener tareas (con normalización FSM)
- `POST /api/tareas-subtareas/[id]/validar` - Validar o rechazar bloque
  - Payload: `{ accion: "validar" | "rechazar", motivo?: string }`

**Tablas Supabase:**
- `tareas` (id, estado, title, descripcion, obra_id, responsable, fecha_inicio, fecha_fin)
- `tareas_subtareas` (id, tarea_id, estado, monto_estimado, monto_validado, orden, bloque_index, evidencia_url, evidencia_cargada)
- `tareas_evidencias` (id, tarea_id, url, path, created_at)
- `media` (id, evento_id, path, kind, created_at)
- `eventos` (id, tarea_id)

**Flujo de validación:**
- Cliente solo puede validar/rechazar bloques (nunca tareas directamente)
- Pago se ejecuta automáticamente en backend tras validar bloque
- Validación de tarea es automática cuando todos los bloques = `validado`

---

### 1.5 Chat y Mensajería
**Componente:** `components/cliente/ChatSection.tsx`  
**Ruta:** `/cliente/dashboard?section=chat`

**Funcionalidades implementadas:**
- ✅ Interfaz tipo WhatsApp con burbujas de mensajes
- ✅ Integración con n8n vía `/api/chat`
- ✅ Fallback cuando n8n no está disponible (respuestas predefinidas)
- ✅ Sugerencias rápidas: Estado de obra, Cuadrillas, Pagos y materiales
- ✅ Indicador de escritura cuando el bot procesa
- ✅ Auto-scroll al último mensaje
- ✅ Navegación contextual desde sugerencias

**Restricciones de plan:**
- ⚠️ **Chat:** Requiere plan PRO o superior (verificado en código línea 79)
- ⚠️ Banner de restricción cuando plan < PRO

**Mensajería directa:**
- ⚠️ Componente `MensajeriaDirecta.tsx` implementado pero no integrado en sidebar principal
- Componente usa endpoints: `GET /api/mensajes`, `POST /api/mensajes`

**Endpoints utilizados:**
- `POST /api/chat` - Enviar mensaje a GrowsBot (conecta con n8n)
  - Payload: `{ sessionId, action: "sendMessage", chatinput }`
- `GET /api/mensajes` - Obtener mensajes directos
- `POST /api/mensajes` - Enviar mensaje directo

**Tablas Supabase:**
- `mensajes` (id, obra_id, remitente_id, destinatario_id, contenido, created_at)

---

### 1.6 Billetera Cliente
**Componente:** `components/cliente/BilleteraSection.tsx`  
**Ruta:** `/cliente/dashboard?section=billetera`

**Funcionalidades implementadas:**
- ✅ Card de saldo disponible con formateo en ARS
- ✅ Historial de movimientos (créditos y débitos)
- ✅ Estados de movimientos: Completado, Pendiente, Cancelado
- ✅ Filtrado por tipo y fecha
- ✅ Integración con hook `useWalletCliente`
- ✅ Manejo de errores y estados de carga
- ✅ Formateo de fechas en formato argentino

**Endpoints utilizados:**
- `GET /api/wallet/saldo` - Obtener saldo actual
- `GET /api/wallet/movimientos` - Obtener historial de movimientos

**Tablas Supabase:**
- `wallet_saldos` (id, org_id, saldo_actual, saldo_pendiente, moneda)
- `wallet_movimientos` (id, org_id, tipo, monto, concepto, tarea_id, estado, created_at)

**Tipos de movimientos:**
- CREDITO: Ingresos por comisiones de GROWS
- DEBITO: Pagos realizados a socios, comisiones

---

### 1.7 Notificaciones
**Componente:** `components/cliente/NotificacionesSection.tsx`  
**Ruta:** `/cliente/dashboard?section=notificaciones`

**Funcionalidades implementadas:**
- ✅ Lista de notificaciones con tabs: Notificaciones, Informes, Mensajes
- ✅ Marcar como leída individual y masiva
- ✅ Realtime subscription para notificaciones nuevas
- ✅ Contador de no leídas sincronizado con sidebar
- ✅ Sonidos de feedback al recibir notificaciones

**Restricciones de plan:**
- ⚠️ **Notificaciones:** Requiere plan STARTER o superior (línea 37)

**Endpoints utilizados:**
- `GET /api/notificaciones` - Listar notificaciones
- `PATCH /api/notificaciones/[id]/leida` - Marcar como leída

**Componentes relacionados:**
- `ListaNotificaciones.tsx` - Lista principal
- `ListaInformes.tsx` - Informes (sin datos reales aún)

---

### 1.8 Cuadrillas
**Componente:** `components/cliente/CuadrillasSection.tsx`  
**Ruta:** `/cliente/dashboard?section=cuadrillas`

**Funcionalidades implementadas:**
- ✅ Lista de cuadrillas con estadísticas
- ✅ Asignación de socios a cuadrillas
- ✅ Vista de tareas asignadas por cuadrilla
- ✅ Invitar socios a cuadrillas

**Restricciones de plan:**
- ⚠️ **Cuadrillas:** Requiere plan STARTER o superior (línea 66)

**Endpoints utilizados:**
- `GET /api/cuadrillas` - Listar cuadrillas
- `POST /api/invitaciones/crear` - Crear invitación

---

### 1.9 Presupuestos
**Componente:** `components/cliente/PresupuestoSection.tsx`  
**Ruta:** `/cliente/dashboard?section=presupuesto`

**Funcionalidades implementadas:**
- ✅ Lista de presupuestos por obra
- ✅ Aprobar/Rechazar presupuestos con comentarios
- ✅ Vista de PDF de presupuestos
- ✅ Seguimiento de solicitudes

**Componentes relacionados:**
- `asigna/PresupuestoRechazarModal.tsx` - Modal de rechazo
- `asigna/PresupuestoPDFModal.tsx` - Vista de PDF
- `asigna/PresupuestoComentarioModal.tsx` - Comentarios

**Endpoints utilizados:**
- `GET /api/presupuestos` - Listar presupuestos
- `POST /api/presupuestos/aprobar-socio` - Aprobar
- `POST /api/presupuestos/rechazar` - Rechazar
- `GET /api/presupuestos/pdf` - Ver PDF

---

### 1.10 Legajo Técnico
**Componente:** `components/cliente/Legajo/LegajoSection.tsx`  
**Ruta:** Incluido en vista detalle de obra

**Funcionalidades implementadas:**
- ✅ Subida de documentos (PDFs, imágenes, planos)
- ✅ Organización por categorías: planos, permisos, contratos, seguridad, otros
- ✅ Vista previa de documentos
- ✅ Descarga de documentos
- ✅ Filtrado por planta (si aplica)

**Endpoints utilizados (verificar existencia):**
- `GET /api/legajo/[obra_id]` - Obtener legajo (mencionado en docs)
- `POST /api/legajo/upload` - Subir documento (mencionado en docs)

**Tablas Supabase:**
- `legajo_tecnico` (id, obra_id, tipo_documento, nombre, url, path, created_at)

---

### 1.11 Calendario
**Componente:** `components/cliente/CalendarioSection.tsx`  
**Ruta:** `/cliente/dashboard?section=calendario`

**Estado:**
- ⚠️ Componente básico implementado
- ⚠️ Funcionalidad limitada
- ⚠️ **Restricción:** Requiere plan PRO o superior (línea 45)

---

### 1.12 Cuenta
**Componente:** `components/cliente/CuentaSection.tsx`  
**Ruta:** `/cliente/dashboard?section=cuenta`

**Funcionalidades implementadas:**
- ✅ Configuración de perfil
- ✅ Información de suscripción
- ✅ Gestión de plan

---

## 2. ENDPOINTS REALES CONSUMIDOS

### 2.1 Endpoints Verificados en Código
- ✅ `GET /api/obras` - Listar obras
- ✅ `GET /api/obras/[id]` - Detalle de obra
- ✅ `PATCH /api/obras/[id]` - Actualizar obra
- ✅ `GET /api/obras/[id]/elementos` - Elementos de obra
- ✅ `POST /api/obras/[obraId]/elementos` - Crear elemento
- ✅ `PATCH /api/obras/[obraId]/elementos/[id]` - Editar elemento
- ✅ `GET /api/tareas` - Listar tareas
- ✅ `POST /api/tareas` - Crear tarea
- ✅ `PATCH /api/tareas/[id]` - Actualizar tarea
- ✅ `POST /api/tareas/[id]/transition` - Cambiar estado
- ✅ `POST /api/tareas-subtareas/[id]/validar` - Validar/rechazar bloque
- ✅ `GET /api/presupuestos` - Listar presupuestos
- ✅ `POST /api/presupuestos/aprobar-socio` - Aprobar presupuesto
- ✅ `POST /api/presupuestos/rechazar` - Rechazar presupuesto
- ✅ `GET /api/presupuestos/pdf` - Ver PDF
- ✅ `GET /api/cuadrillas` - Listar cuadrillas
- ✅ `POST /api/invitaciones/crear` - Crear invitación
- ✅ `POST /api/chat` - Chat con GrowsBot
- ✅ `GET /api/mensajes` - Obtener mensajes
- ✅ `POST /api/mensajes` - Enviar mensaje
- ✅ `GET /api/notificaciones` - Listar notificaciones
- ✅ `PATCH /api/notificaciones/[id]/leida` - Marcar como leída
- ✅ `GET /api/wallet/saldo` - Saldo de billetera
- ✅ `GET /api/wallet/movimientos` - Movimientos

### 2.2 Endpoints Pendientes de Verificación
- ⚠️ `GET /api/obras/[id]/plantas` - Usado en `DetalleObra.tsx` línea 368
- ⚠️ `GET /api/legajo/[obra_id]` - Mencionado en documentación
- ⚠️ `POST /api/legajo/upload` - Mencionado en documentación

### 2.3 Headers Requeridos
Todos los endpoints requieren:
- `x-organizacion-id`: ID de la organización del usuario
- `x-usuario-id`: ID del usuario autenticado

**Riesgo:** Si estos headers no están presentes, las peticiones fallan.

---

## 3. RESTRICCIONES DE PLAN IMPLEMENTADAS

### 3.1 Límites de Obras
- **FREE:** 2 obras activas
- **STARTER:** 5 obras activas
- **PRO:** 10 obras activas
- ✅ Implementado en `ObrasSection.tsx` con modal de upgrade

### 3.2 Límites de Tareas
- **FREE:** 0 tareas activas (solo lectura)
- **STARTER:** 3 tareas activas
- **PRO:** 10 tareas activas
- ✅ Verificado en `lib/subscriptions/texts.ts`

### 3.3 Límites de Cuadrillas
- **FREE:** 0 cuadrillas (solo demo)
- **STARTER:** 3 cuadrillas activas
- **PRO:** Ilimitado
- ⚠️ **Restricción:** Requiere STARTER o superior (implementado en `CuadrillasSection.tsx`)

### 3.4 Funcionalidades por Plan
- **Chat:** ⚠️ Requiere PRO o superior (`ChatSection.tsx` línea 79)
- **Notificaciones:** ⚠️ Requiere STARTER o superior (`NotificacionesSection.tsx` línea 37)
- **Calendario:** ⚠️ Requiere PRO o superior (`CalendarioSection.tsx` línea 45)
- **Cuadrillas:** ⚠️ Requiere STARTER o superior (`CuadrillasSection.tsx` línea 66)

### 3.5 Banner de Upgrade
- ✅ Implementado en `ValidarSection.tsx` para usuarios FREE/STARTER
- ✅ Integrado con `useUpgradeModal` hook

---

## 4. TABLAS SUPABASE UTILIZADAS

### 4.1 Tablas Principales
- ✅ `obras` - Obras
- ✅ `tareas` - Tareas
- ✅ `tareas_subtareas` - Bloques pagables (subtareas)
- ✅ `tareas_evidencias` - Evidencias a nivel tarea
- ✅ `media` - Archivos multimedia de eventos
- ✅ `eventos` - Eventos del sistema
- ✅ `wallet_saldos` - Saldos de billetera
- ✅ `wallet_movimientos` - Movimientos de billetera
- ✅ `notificaciones` - Notificaciones
- ✅ `mensajes` - Mensajes
- ✅ `presupuestos` - Presupuestos
- ✅ `cuadrillas` - Cuadrillas
- ✅ `socios` - Socios
- ✅ `legajo_tecnico` - Documentos del legajo
- ✅ `organizations` - Organizaciones

---

## 5. COMPONENTES UI Y HOOKS

### 5.1 Componentes Principales
- `SidebarClienteTecnico.tsx` - Navegación principal
- `ObrasSection.tsx` - Gestión de obras
- `TareasSection.tsx` - Gestión de tareas
- `ValidarSection.tsx` - Validación de bloques
- `ChatSection.tsx` - Chat con GrowsBot
- `BilleteraSection.tsx` - Billetera cliente
- `NotificacionesSection.tsx` - Notificaciones
- `CuadrillasSection.tsx` - Cuadrillas
- `PresupuestoSection.tsx` - Presupuestos
- `LegajoSection.tsx` - Legajo técnico
- `CalendarioSection.tsx` - Calendario
- `CuentaSection.tsx` - Cuenta

### 5.2 Hooks Personalizados
- `useCurrentUser` - Usuario actual
- `useWalletCliente` - Billetera del cliente
- `useOnboardingCliente` - Onboarding
- `useSubscription` - Suscripción
- `useCurrentPlan` - Plan actual
- `usePlanGate` - Verificación de permisos por plan

### 5.3 Servicios
- `lib/services/obrasService.ts` - Servicios de obras
- `lib/services/tarea.service.ts` - Servicios de tareas
- `lib/services/subtarea-mvp.service.ts` - Servicios de bloques
- `lib/services/tarea-fsm.service.ts` - FSM de tareas
- `lib/services/wallet.service.ts` - Servicios de billetera
- `lib/services/escrow.service.ts` - Servicios de escrow

---

## 6. ESTADO ACTUAL DEL CÓDIGO

### 6.1 Implementaciones Completas
- ✅ Dashboard y navegación funcional
- ✅ Gestión de obras completa
- ✅ Validación de bloques (refactorizada MVP 1.0)
- ✅ Billetera cliente funcional
- ✅ Notificaciones (con restricciones)
- ✅ Presupuestos

### 6.2 Implementaciones Parciales
- ⚠️ Chat (depende de n8n, tiene fallback)
- ⚠️ Mensajería directa (componente existe pero no integrado)
- ⚠️ Calendario (básico)
- ⚠️ Legajo (subida funciona, endpoints pendientes verificación)

### 6.3 Sistema de Diseño
- ✅ Componentes UI en `components/ui/grows`
- ✅ Design tokens en `lib/design-tokens.ts`
- ✅ Sistema de suscripciones en `lib/subscriptions`
- ✅ Modales de upgrade en `components/subscriptions/UpgradeModal.tsx`

---

## 7. LIMITACIONES ACTUALES CONOCIDAS

1. **Endpoints pendientes de verificación:**
   - `GET /api/obras/[id]/plantas`
   - `GET /api/legajo/[obra_id]`
   - `POST /api/legajo/upload`

2. **Dependencias externas:**
   - Chat depende de n8n (tiene fallback implementado)
   - Headers requeridos pueden causar fallos si faltan

3. **Funcionalidades no integradas:**
   - Mensajería directa (`MensajeriaDirecta.tsx`) no está en sidebar principal
   - Timeline interactivo (`TimelineInteractivo.tsx`) existe pero no integrado

4. **Mobile:**
   - Sidebar se colapsa pero puede mejorarse
   - No hay menú hamburguesa específico para mobile

---

## 8. INTEGRACIONES

### 8.1 n8n
- ✅ Integración vía `/api/chat`
- ✅ Fallback cuando n8n no está disponible
- ⚠️ No hay retry logic si falla la conexión

### 8.2 Supabase
- ✅ Realtime subscriptions para notificaciones
- ✅ Storage para evidencias y documentos
- ✅ Autenticación integrada

### 8.3 Sistema de Suscripciones
- ✅ Verificación de límites por plan
- ✅ Modales de upgrade
- ✅ Banners informativos

