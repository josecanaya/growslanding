# ESTADO Y PRÓXIMOS PASOS: FRONTEND SOCIO - GROWS

**Última actualización:** Diciembre 2024  
**Estado general:** Estabilizado, usando 100% la data real del backend  
**Nota importante:** El frontend socio NO tiene restricciones de plan por sección. Todas las funcionalidades están disponibles para todos los socios. Los límites (máx. 2 tareas activas, máx. 2 bloques activos) son del backend y aplican a nivel de socio, no de plan de suscripción.

---

## 1. QUÉ FALTA PARA MVP 1.0

### 1.1 Funcionalidades Críticas Pendientes

#### **Jornada** - ✅ IMPLEMENTADO (BÁSICO)
- ✅ Creación y consulta de jornadas
- ✅ Finalización de jornada
- ✅ Historial de jornadas anteriores (`/socio/jornadas`)
- ✅ Resumen de horas trabajadas (mensual)

#### **Evidencias** - ✅ IMPLEMENTADO
- ✅ Componente GaleriaEvidencias existe
- ✅ Modal de evidencias en AhoraSection
- ✅ Subida de evidencias parciales y finales
- ✅ Vista dedicada `/socio/evidencias` operativa, con filtros y previews
- ✅ Compresión de imágenes aplicada correctamente

#### **Chat** - ✅ FUNCIONAL PERO MEJORABLE
- ✅ Chat básico funcionando (mensajería directa por obra)
- ✅ Chat disponible para todos los socios (sin restricciones de plan)
- ❌ **FALTA:** Notificaciones push de mensajes nuevos
- ❌ **FALTA:** Indicadores de "escribiendo..."
- ❌ **FALTA:** Envío de imágenes/archivos en chat
- ❌ **FALTA:** Búsqueda de mensajes
- **NOTA:** El chat del socio NO fue eliminado (a diferencia del panel cliente donde se eliminó Chat con GrowsBot)

### 1.2 Funcionalidades Secundarias Pendientes

#### **Cuadrilla** - ❌ NO IMPLEMENTADO
- ❌ Perfil de cuadrilla (datos básicos)
- ❌ Vista de miembros de cuadrilla
- ❌ Gestión de cuadrilla
- ❌ Asignación de tareas a cuadrilla

#### **Calendario** - ❌ NO IMPLEMENTADO
- ❌ Vista de calendario mensual/semanal
- ❌ Visualización de tareas en calendario
- ❌ Planificación de jornadas

#### **Oportunidades** - ❌ NO IMPLEMENTADO
- ❌ Tareas disponibles para presupuestar
- ❌ Sistema de ofertas

#### **Competencias** - ❌ NO IMPLEMENTADO
- ❌ Sistema de habilidades y certificaciones
- ❌ Perfil de competencias

#### **Ganancias** - ✅ IMPLEMENTADO (SIMPLE)
- ✅ Integrado en billetera y cuenta
- ✅ Dashboard simple de ganancias (`/socio/ganancias`)
- ✅ Resumen: Ganaste este mes, Pendiente de cobro, Total histórico

### 1.3 Mejoras de UX Pendientes

- ❌ Modo offline con sincronización
- ❌ Service Worker para PWA
- ❌ Optimización de carga de imágenes (lazy loading)
- ❌ Gestos táctiles avanzados (swipe entre tareas)
- ❌ Búsqueda y filtros avanzados en tareas
- ❌ Vista de mapa de obras
- ❌ Modo oscuro
- ❌ Personalización de tema

---

## 2. BUGS CONOCIDOS

### 2.1 Problemas Técnicos

- ✅ **Resuelto:** Integración completa con FSM oficial del backend (tareas y subtareas)
- ✅ **Resuelto:** Eliminados todos los estados legacy
- ✅ **Resuelto:** Manejo correcto de límites (máx. 2 tareas activas, máx. 2 bloques activos, suspensión socio)
- ✅ **Resuelto:** Errores unificados (TRANSICIÓN_NO_PERMITIDA, SOCIO_SUSPENDIDO, BLOQUE_YA_VALIDADO, BLOQUE_ENVIADO)
- ✅ **Resuelto:** Compresión de imágenes aplicada correctamente
- ✅ **Resuelto:** Vista `/socio/evidencias` operativa, con filtros y previews
- ✅ **Resuelto:** AHORA estabilizado, usando 100% la data real del backend
- ✅ **Resuelto:** Sin logs, sin warnings, sin errores silenciosos

### 2.2 Problemas Pendientes

- ⚠️ Sin modo offline: socio no puede trabajar sin conexión
- ⚠️ Optimización mobile-first del flujo AHORA pendiente

---

## 3. MEJORAS PENDIENTES

### 3.1 Funcionalidades Planeadas

- Calendario mensual/semanal de tareas
- Sistema de competencias y certificaciones
- Dashboard de ganancias con gráficos
- Oportunidades de trabajo (tareas disponibles)
- Modo offline completo con sincronización
- Notificaciones push nativas
- Geolocalización de obras
- Firma digital de documentos
- Historial completo de jornadas
- Reportes de productividad

### 3.2 Mejoras de UX

- Navegación entre tareas con swipe
- Búsqueda y filtros avanzados
- Vista de mapa de obras
- Modo oscuro
- Personalización de tema
- Atajos de teclado
- Gestos táctiles avanzados

### 3.3 Integraciones

- WhatsApp Business API
- Google Maps integrado
- Cámara con OCR para documentos
- Firma electrónica
- Notificaciones SMS
- Integración con sistemas de pago

### 3.4 Optimizaciones

- Lazy loading de imágenes
- Caché inteligente de datos
- Prefetch de tareas próximas
- Compresión de imágenes automática (parcialmente implementado)
- Reducción de bundle size
- Service Worker para offline

### 3.5 Seguridad

- Autenticación biométrica
- 2FA (Two Factor Authentication)
- Encriptación de datos sensibles
- Auditoría de acciones
- Logs de seguridad

### 3.6 Analytics

- Tracking de tiempo por tarea
- Métricas de productividad
- Análisis de patrones de trabajo
- Reportes automáticos
- Exportación de datos

---

## 4. PRIORIDADES PM

### 4.1 Para Completar MVP 1.0

**ALTA PRIORIDAD:**
1. ✅ Jornada (ya funciona, solo falta pausar/reanudar si es necesario)
2. ✅ Chat (funciona, mejoras opcionales)
3. ✅ Notificaciones (funciona)
4. ⚠️ Evidencias (falta vista dedicada completa, pero modal funciona)

**MEDIA PRIORIDAD:**
- ⚠️ Historial de jornadas
- ⚠️ Dashboard de ganancias
- ⚠️ Modo offline básico
- ⚠️ Compresión automática de imágenes (parcialmente implementado)

**BAJA PRIORIDAD (Post-MVP):**
- Calendario
- Oportunidades
- Competencias
- Cuadrilla (si no es crítica)

### 4.2 Decisiones Prioritarias Pendientes

#### **Jornada**
- ❓ ¿Necesitamos pausar/reanudar jornada o solo iniciar/finalizar?
- ❓ ¿Requerimos geolocalización obligatoria al iniciar jornada?
- ❓ ¿Necesitamos historial de jornadas anteriores en el MVP?

#### **Evidencias**
- ❓ ¿La vista dedicada de evidencias es crítica para MVP 1.0? (Ya existe básica)
- ❓ ¿Qué nivel de organización/filtros necesitamos?
- ❓ ¿Límite de tamaño de archivos? ¿Compresión obligatoria?

#### **Chat**
- ❓ ¿Envío de imágenes/archivos es crítico para MVP?
- ❓ ¿Notificaciones push son obligatorias o pueden esperar?

#### **Cuadrilla**
- ❓ ¿Gestión de cuadrilla es parte del MVP 1.0 o post-MVP?
- ❓ ¿Qué funcionalidades mínimas necesitamos?

### 4.3 Definiciones de UX Pendientes

- ❓ Flujo exacto de pausar jornada (¿cuánto tiempo puede estar pausada?)
- ❓ ¿Qué pasa si el socio pierde conexión durante una jornada?
- ❓ ¿Cómo manejamos conflictos si se inicia jornada en dos dispositivos?
- ❓ ¿Necesitamos confirmación antes de finalizar jornada?
- ❓ ¿Qué información debe mostrar el historial de jornadas?

### 4.4 Testing y Validación

- ❓ ¿Tenemos usuarios beta para probar el flujo completo?
- ❓ ¿Qué escenarios de prueba son críticos?
- ❓ ¿Necesitamos datos de prueba específicos?

### 4.5 Timeline

- ❓ ¿Cuál es la fecha objetivo para MVP 1.0?
- ❓ ¿Qué features son bloqueantes vs nice-to-have?
- ❓ ¿Hay dependencias con otros equipos (backend, diseño)?

---

## 5. DEPENDENCIAS DEL BACKEND

### 5.1 Endpoints Críticos Requeridos

#### **Tareas**
- ✅ `GET /api/tareas` - Lista de tareas del socio
- ✅ `GET /api/tareas/[id]` - Detalle de tarea
- ✅ `POST /api/tareas/[id]/transition` - Transición de estados FSM oficial
- ✅ `GET /api/tareas/[id]/evidencias` - Evidencias de tarea
- ✅ `POST /api/tareas/[id]/asignar-socio` - Asignación (usado por cliente)
- ✅ Integración completa con FSM oficial del backend

#### **Subtareas/Bloques**
- ✅ FSM de bloques implementada 100% (iniciar → enviar-validar → validar / rechazar → rehacer)
- ✅ Endpoints alineados al nuevo estándar FSM
- ✅ Manejo correcto de límites (máx. 2 bloques activos)
- ✅ Errores unificados (BLOQUE_YA_VALIDADO, BLOQUE_ENVIADO)

#### **Jornadas** (Queries directas a Supabase)
- ✅ `SELECT FROM jornadas_socio` - Consulta de jornadas
- ✅ `INSERT INTO jornadas_socio` - Creación de jornada
- ✅ `UPDATE jornadas_socio` - Finalización de jornada
- ⚠️ **FALTA:** Endpoint para pausar/reanudar jornada

#### **Wallet**
- ✅ `GET /api/wallet/saldo` - Saldo disponible y pendiente
- ✅ `GET /api/wallet/movimientos` - Historial de movimientos
- ✅ `POST /api/wallet/creditos` - (Backend interno)
- ✅ `POST /api/wallet/debitos` - (Backend interno)

#### **Mensajes**
- ✅ `GET /api/mensajes?socio_id={id}` - Mensajes del socio
- ✅ `POST /api/mensajes` - Envío de mensajes
- ✅ `PATCH /api/mensajes/[id]/leido` - Marcar como leído

#### **Notificaciones**
- ✅ `GET /api/notificaciones` - Lista de notificaciones
- ✅ `PATCH /api/notificaciones/[id]/leida` - Marcar como leída

#### **Presupuestos**
- ✅ `GET /api/socio/presupuestos` - Lista de obras y presupuestos
- ✅ `GET /api/presupuestos/pdf` - Obtener PDF
- ✅ `POST /api/presupuestos/pdf` - Subir PDF
- ✅ `POST /api/presupuestos/eliminar-pdf` - Eliminar PDF

#### **Upload**
- ✅ `POST /api/upload/file` - Subida de evidencias y videos

### 5.2 Servicios Backend Requeridos

- ✅ **tarea.service:** Lógica de FSM oficial, generación de subtareas, eventos
- ✅ **wallet.service:** Cálculo de comisiones, registro de pagos
- ✅ **obra.service:** Operaciones relacionadas a obras
- ✅ **PermisoService:** Permisos implementados
- ✅ **FSM oficial:** Transiciones válidas, roles aplicados, eventos registrados
- ⚠️ **FALTA:** Servicio dedicado para jornadas (actualmente se hace directo)

### 5.3 Tablas de Base de Datos

- ✅ `tareas` - Tareas asignadas
- ✅ `tareas_subtareas` - Bloques pagables
- ✅ `jornadas_socio` - Jornadas laborales
- ✅ `wallet_saldos` - Saldos de billetera
- ✅ `wallet_movimientos` - Movimientos de billetera
- ✅ `mensajes` - Mensajes de chat
- ✅ `notificaciones` - Notificaciones del sistema
- ✅ `tareas_presupuestos` - Presupuestos de tareas
- ✅ `eventos` - Historial de eventos
- ✅ `media` - Archivos de evidencias

### 5.4 Dependencias Externas

- ⚠️ Dependencia total de Supabase para datos en tiempo real
- ⚠️ Storage de Supabase para evidencias (costos pueden escalar)
- ⚠️ Sin fallback si Supabase está caído

---

## 6. PRÓXIMAS TAREAS SUGERIDAS

### 6.1 Tareas Críticas para MVP 1.0

1. ✅ **Jornadas (historial + horas)** - COMPLETADO
   - ✅ Historial de jornadas anteriores (`/socio/jornadas`)
   - ✅ Resumen de horas trabajadas (mensual)

2. ✅ **Ganancias (dashboard simple)** - COMPLETADO
   - ✅ Dashboard simple de ganancias (`/socio/ganancias`)

3. **Perfil de cuadrilla (datos básicos)**

4. **Ajustes mobile-first del flujo AHORA**
   - Optimización mobile de AHORA

5. **Chat básico** (si entra en MVP final)
   - Integración futura de Chat Socio ↔ Cliente

### 6.2 Tareas de Mejora

1. **Mejorar chat**
   - Agregar indicadores de "escribiendo..."
   - Implementar envío de imágenes/archivos
   - Agregar búsqueda de mensajes

2. **Implementar modo offline**
   - Service Worker para PWA
   - Sincronización cuando vuelve conexión
   - Caché de datos críticos

3. **Mejorar UX general**
   - Gestos táctiles avanzados
   - Búsqueda y filtros avanzados
   - Vista de mapa de obras
   - Confirmaciones para acciones críticas

### 6.3 Tareas Post-MVP

1. Calendario mensual/semanal
2. Sistema de competencias
3. Dashboard de ganancias
4. Oportunidades de trabajo
5. Gestión de cuadrilla

---

## 7. RESUMEN EJECUTIVO

### Estado General: **ESTABILIZADO, USANDO 100% LA DATA REAL DEL BACKEND**

**Funcionando:**
- ✅ Navegación y estructura base
- ✅ Jornada (inicio/finalización)
- ✅ Tareas y subtareas con flujo completo FSM oficial
- ✅ Chat básico
- ✅ Notificaciones con realtime
- ✅ Billetera completa
- ✅ Presupuestos completos
- ✅ Integración completa con FSM oficial del backend (tareas y subtareas)
- ✅ Eliminados todos los estados legacy
- ✅ Manejo correcto de límites (máx. 2 tareas activas, máx. 2 bloques activos, suspensión socio)
- ✅ Errores unificados (TRANSICIÓN_NO_PERMITIDA, SOCIO_SUSPENDIDO, BLOQUE_YA_VALIDADO, BLOQUE_ENVIADO)
- ✅ Compresión de imágenes aplicada correctamente
- ✅ Vista `/socio/evidencias` operativa, con filtros y previews
- ✅ AHORA estabilizado, usando 100% la data real del backend
- ✅ Sin logs, sin warnings, sin errores silenciosos

**Falta para MVP 1.0:**
- ⚠️ Perfil de cuadrilla (datos básicos)
- ⚠️ Ajustes mobile-first del flujo AHORA
- ⚠️ Mejoras de chat (indicadores, archivos, búsqueda) - Chat básico ya funciona

**Bloqueos:**
- ✅ Ninguno técnico. Todo depende de nuevas tareas PM.

**Próximos Pasos:**
1. ✅ Jornadas + Ganancias - COMPLETADO
2. Optimización mobile de AHORA
3. Mejoras de chat (indicadores, archivos, búsqueda)
4. Integración futura de Chat Socio ↔ Cliente (ya funciona mensajería directa por obra)
5. Perfil de cuadrilla (datos básicos)

---

## Actualizado en esta iteración (Diciembre 2024):
- Integración completa con FSM oficial del backend (tareas y subtareas).
- Eliminados todos los estados legacy.
- Manejo correcto de límites: máx. 2 tareas activas, máx. 2 bloques activos, suspensión socio.
- Errores unificados: TRANSICIÓN_NO_PERMITIDA, SOCIO_SUSPENDIDO, BLOQUE_YA_VALIDADO, BLOQUE_ENVIADO.
- Compresión de imágenes aplicada correctamente.
- Vista `/socio/evidencias` operativa, con filtros y previews.
- AHORA estabilizado, usando 100% la data real del backend.
- Sin logs, sin warnings, sin errores silenciosos.
- ✅ **NUEVO:** Vista `/socio/jornadas` implementada (historial de jornadas + resumen mensual de horas).
- ✅ **NUEVO:** Vista `/socio/ganancias` implementada (dashboard simple con ganancias del mes, pendiente y total histórico).
- **Aclaración importante:** El frontend socio NO tiene restricciones de plan por sección. Todas las funcionalidades (Chat, Notificaciones, Billetera, etc.) están disponibles para todos los socios sin restricciones de suscripción.
- **Chat del socio:** Funcional y disponible (mensajería directa por obra). NO fue eliminado como en el panel cliente.

---

**FIN DEL DOCUMENTO**

