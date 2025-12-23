# CONTEXTO ACTUAL: FRONTEND SOCIO - GROWS

**Última actualización:** Diciembre 2024  
**Estado:** En desarrollo activo - 75% completo  
**Nota importante:** El frontend socio NO tiene restricciones de plan por sección. Todas las funcionalidades están disponibles para todos los socios. Los límites (máx. 2 tareas activas, máx. 2 bloques activos) son del backend y aplican a nivel de socio, no de plan de suscripción.

---

## 1. PANTALLAS REALES EXISTENTES

### 1.1 Pantallas Implementadas y Operativas

#### **Ahora (/socio/ahora)** - ⭐ CRÍTICO
- ✅ Vista principal de jornada diaria
- ✅ Saludo: "HOLA, {NOMBRE}" en mayúsculas
- ✅ Subtítulo: "Tu jornada de hoy"
- ✅ Hero card: Tarea/subtarea actual con información principal
- ✅ CTA principal: Botón grande para iniciar/finalizar jornada o tarea
- ✅ Estadísticas: Tareas completadas hoy vs programadas
- ✅ Accesos rápidos: Checklist, Planos, Chat, Evidencias
- ✅ Integración con jornadas_socio (creación y consulta)
- ✅ Ordenamiento por CPM (Critical Path Method)
- ✅ Modo compatibilidad para tareas sin subtareas

#### **Mensajes (/socio/mensajes)** - ✅ FUNCIONAL
- ✅ Chat tipo WhatsApp por obra
- ✅ Envío y recepción en tiempo real
- ✅ Indicador de mensajes no leídos
- ✅ Auto-scroll y recarga automática
- ✅ Integración con contador en TabBar
- ✅ **Disponible para todos los socios** (sin restricciones de plan)
- **NOTA:** El chat del socio NO fue eliminado (a diferencia del panel cliente donde se eliminó Chat con GrowsBot)

#### **Notificaciones (/socio/notificaciones)** - ✅ FUNCIONAL
- ✅ Lista de notificaciones con tipos (success, warning, error, info)
- ✅ Marcar como leída individual y masiva
- ✅ Contador de no leídas
- ✅ Realtime subscription (Supabase)
- ✅ Integración con mensajes no leídos
- ✅ Feedback sonoro y visual

#### **Billetera (/socio/billetera)** - ✅ FUNCIONAL
- ✅ Saldo disponible (saldo_actual) y pendiente (saldo_pendiente)
- ✅ Moneda (ARS por defecto)
- ✅ Lista de movimientos (CREDITO/DEBITO)
- ✅ Filtros por tipo y estado
- ✅ Paginación (50 por defecto)
- ✅ Formato de fecha y monto
- ✅ Integración con wallet service

#### **Presupuestos (/socio/presupuestos)** - ✅ FUNCIONAL
- ✅ Lista de obras con presupuestos
- ✅ Edición de presupuestos por etapa (ESTRUCTURA, OBRA_GRIS, TERMINACIONES)
- ✅ Guardado de borradores
- ✅ Envío de presupuestos
- ✅ Generación de PDF por etapa
- ✅ Visualización de PDF enviado
- ✅ Resumen acumulado (días y montos)
- ✅ Estados: PENDIENTE, ENVIADO, APROBADO

#### **Cuenta (/socio/cuenta)** - ✅ IMPLEMENTADO
- ✅ Información del perfil (avatar, nombre, nivel Bronce/Plata/Oro/Platino, rating con estrellas)
- ✅ Fecha de registro
- ✅ Progreso al siguiente nivel
- ✅ Información de contacto (email, teléfono, ubicación)
- ✅ Estadísticas (obras completadas, ingresos totales)
- ✅ Documentación y seguridad (seguros, certificados, ART con estados: vigente, por vencer, vencido)
- ✅ Configuración básica (cuenta, notificaciones, privacidad)
- ✅ Cerrar sesión

#### **Tareas (/socio/tareas)** - ✅ IMPLEMENTADO
- ✅ Lista de tareas asignadas
- ✅ Filtros y búsqueda básica

#### **Evidencias (/socio/evidencias)** - ✅ EXISTE
- ✅ Componente GaleriaEvidencias implementado
- ✅ Vista dedicada con header y contador

---

## 2. FLUJO AHORA REAL

### 2.1 Inicio de Jornada
**Flujo actual:**
1. Usuario entra a /socio/ahora
2. Sistema carga tareas asignadas (estado: ASIGNADA, pendiente, en_ejecucion, en_progreso)
3. Sistema busca primera subtarea pendiente o tarea asignada
4. Si no hay jornada para hoy:
   - Botón muestra "Iniciar jornada"
   - Al hacer click:
     * Crea registro en jornadas_socio
     * obra_id: de la tarea/subtarea
     * fecha: hoy (YYYY-MM-DD)
     * hora_inicio: timestamp actual
     * socio_id: currentUser.id
5. Si ya existe jornada:
   - Muestra jornada actual
   - Botón muestra "Comenzar tarea" o "Finalizar tarea"

**Estados de jornada:**
- Sin jornada: jornadaActual === null
- Jornada activa: jornadaActual.hora_fin === null
- Jornada finalizada: jornadaActual.hora_fin !== null

### 2.2 Iniciar Tarea (Modo compatibilidad sin subtareas)
**Flujo:**
1. Si no hay subtareas pero hay tarea asignada:
   - Botón muestra "Comenzar tarea"
   - Al hacer click:
     * Actualiza tarea: estado 'en_progreso', fecha_inicio_real, hora_inicio
     * Llama a /api/tareas/{id}/transition con nuevo_estado: 'en_ejecucion'
     * Efecto visual: fondo amarillo por 2 segundos
2. Tarea queda en estado "en_progreso"

### 2.3 Finalizar Tarea (Modo compatibilidad)
**Flujo:**
1. Si tarea está en_progreso:
   - Botón muestra "Finalizar tarea"
   - Requiere al menos una evidencia final
2. Al hacer click:
   - Si no hay evidencias: muestra error
   - Si hay evidencias:
     * Llama a /api/tareas/{id}/transition con nuevo_estado: 'finalizado'
     * Crea registro en tareas_evidencias
     * Efecto visual: fondo verde por 2 segundos
3. Tarea queda en estado "finalizado"
4. Sistema recarga lista de tareas

### 2.4 Validar Subtareas (Bloques)
**Flujo con subtareas:**
1. Sistema busca primera subtarea pendiente (orden ASC)
2. Al iniciar subtarea:
   - Estado: pendiente -> en_progreso
   - hora_inicio: timestamp actual
3. Al finalizar subtarea:
   - Modal obligatorio (ModalFinalizarSubtarea):
     * Foto de evidencia (obligatoria)
     * Video (opcional)
     * Reportar problemas (opcional)
     * Checkbox de control de calidad (obligatorio)
   - Estado: en_progreso -> finalizada
   - hora_fin: timestamp actual
   - evidencia_url, video_url, problemas: guardados
4. Si todas las subtareas están finalizadas:
   - Tarea principal se marca como COMPLETADA
   - Se envía notificación al cliente técnico

**Estados de subtarea:**
- pendiente: No iniciada
- en_progreso: En ejecución
- finalizada: Completada por socio
- validada: Validada por supervisor

### 2.5 Pasar a Siguiente Bloque
**Flujo:**
1. Al finalizar subtarea actual:
   - Sistema busca siguiente subtarea pendiente (orden ASC)
   - Si existe: la carga como subtareaActual
   - Si no existe: subtareaActual = null
2. Si no hay más subtareas:
   - Muestra mensaje de "No hay más tareas"
   - Botón "Iniciar jornada" desaparece o se deshabilita

### 2.6 Terminar Jornada
**Flujo:**
1. Usuario hace click en "Finalizar jornada"
2. Actualiza jornadas_socio: hora_fin = timestamp actual
3. Jornada queda finalizada
4. Al día siguiente se crea nueva jornada

---

## 3. EVIDENCIAS EXISTENTES

### 3.1 Componentes de Evidencias
- ✅ **GaleriaEvidencias:** Galería de evidencias fotográficas
- ✅ **ModalEvidencias:** Modal para subir evidencias en AhoraSection
- ✅ **ModalFinalizarSubtarea:** Modal obligatorio con foto, video y problemas

### 3.2 Funcionalidades Actuales
- ✅ Subida de evidencias parciales y finales
- ✅ Subida de videos
- ✅ Vista de evidencias en galería
- ✅ Modal de evidencias en sección Ahora
- ✅ Evidencia obligatoria para finalizar subtarea

### 3.3 Vista Dedicada
- ✅ Ruta `/socio/evidencias` existe
- ✅ Componente GaleriaEvidencias implementado
- ✅ Header con contador de evidencias
- ✅ Filtrado por obra

---

## 4. SUBTAREAS Y CÓMO LAS CONSUME

### 4.1 Generación Automática
- ✅ Sistema genera subtareas automáticamente desde presupuestos aprobados
- ✅ Se crean cuando se asigna socio a tarea
- ✅ Basadas en días_reales del presupuesto
- ✅ Cada subtarea representa un bloque pagable

### 4.2 Consulta de Subtareas
**Queries directas a Supabase:**
- SELECT FROM tareas_subtareas
  - Filtros: tarea_id, estado, orden
  - Orden: orden ASC
  - Campos: id, tarea_id, orden, cantidad, unidad, estado, fecha, hora_inicio, hora_fin, evidencia_url, video_url, problemas

### 4.3 Actualización de Subtareas
**UPDATE tareas_subtareas:**
- SET estado, hora_inicio, hora_fin, evidencia_url, video_url, problemas
- WHERE id = subtareaId

### 4.4 Flujo de Consumo
1. Sistema busca primera subtarea pendiente (orden ASC)
2. Muestra en hero card de /socio/ahora
3. Permite iniciar (pendiente -> en_progreso)
4. Permite finalizar con modal obligatorio
5. Al finalizar, busca siguiente subtarea pendiente
6. Si todas están finalizadas, marca tarea como COMPLETADA

---

## 5. CHAT ACTUAL

### 5.1 Componentes
- ✅ **MensajeriaSocio:** Componente interno de chat
- ✅ **ChatPorObra:** Wrapper de chat por obra (role="socio")

### 5.2 Funcionalidades
- ✅ Chat tipo WhatsApp
- ✅ Mensajes por obra y por usuario
- ✅ Envío y recepción en tiempo real
- ✅ Indicador de mensajes no leídos
- ✅ Auto-scroll al final
- ✅ Recarga automática cuando vuelve a estar visible

### 5.3 Estados
- Cargando mensajes
- Enviando mensaje
- Sin mensajes

### 5.4 Integración
- ✅ Contador en TabBar (badge con mensajes no leídos)
- ✅ Acceso desde drawer lateral
- ✅ Acceso rápido desde /socio/ahora
- ✅ **Disponible para todos los socios** (sin restricciones de plan)

---

## 6. NOTIFICACIONES

### 6.1 Funcionalidades
- ✅ Lista de notificaciones con tipos: success, warning, error, info
- ✅ Marcar como leída individual
- ✅ Marcar todas como leídas
- ✅ Contador de no leídas
- ✅ Realtime subscription (Supabase)

### 6.2 Estadísticas
- ✅ Total de notificaciones
- ✅ Sin leer
- ✅ Leídas

### 6.3 Integración
- ✅ Muestra contador de mensajes no leídos
- ✅ Botón para ir a mensajes
- ✅ Badge en drawer lateral
- ✅ Evento 'grows:notificaciones-unread-count' emite contador actualizado

---

## 7. PRESUPUESTOS

### 7.1 Funcionalidades
- ✅ Lista de obras con presupuestos
- ✅ Edición de presupuestos por etapa (ESTRUCTURA, OBRA_GRIS, TERMINACIONES)
- ✅ Guardado de borradores
- ✅ Envío de presupuestos
- ✅ Generación de PDF por etapa
- ✅ Visualización de PDF enviado
- ✅ Resumen acumulado (días y montos)
- ✅ Estados: PENDIENTE, ENVIADO, APROBADO

### 7.2 Componentes
- ✅ EtapasButtons: Botones para filtrar por etapa
- ✅ FilaPresupuesto: Fila de presupuesto en tabla
- ✅ ListaObras: Lista de obras con presupuestos
- ✅ ListaTareas: Lista de tareas para presupuestar
- ✅ ModalVerPlanos: Modal para ver planos de obra
- ✅ PresupuestoTabs: Tabs de navegación en presupuestos
- ✅ ResumenAcumulado: Resumen de presupuestos acumulados
- ✅ ResumenObra: Resumen de presupuesto por obra
- ✅ TablaPresupuesto: Tabla de presupuestos
- ✅ TareaItem: Item de tarea en presupuestos

---

## 8. JORNADAS

### 8.1 Funcionalidades Actuales
- ✅ Creación de jornada al iniciar
- ✅ Consulta de jornada del día actual
- ✅ Finalización de jornada
- ✅ Detección de jornada duplicada (error 23505)

### 8.2 Queries Directas a Supabase
**SELECT FROM jornadas_socio:**
- Filtros: socio_id, fecha (YYYY-MM-DD)
- Campos: id, socio_id, obra_id, fecha, hora_inicio, hora_fin

**INSERT INTO jornadas_socio:**
- Campos: socio_id, obra_id, fecha, hora_inicio

**UPDATE jornadas_socio:**
- SET hora_fin
- WHERE id = jornadaId

### 8.3 Estados
- Sin jornada: jornadaActual === null
- Jornada activa: jornadaActual.hora_fin === null
- Jornada finalizada: jornadaActual.hora_fin !== null

---

## 9. LIMITACIONES ACTUALES

### 9.1 Funcionalidades No Implementadas
- ❌ Pausar/reanudar jornada (solo se puede finalizar)
- ❌ Historial de jornadas anteriores
- ❌ Resumen de horas trabajadas
- ❌ Validación de geolocalización al iniciar jornada
- ❌ Vista de cuadrilla
- ❌ Calendario mensual/semanal
- ❌ Oportunidades de trabajo
- ❌ Sistema de competencias
- ❌ Dashboard de ganancias con gráficos

### 9.2 Mejoras de UX Pendientes
- ❌ Modo offline con sincronización
- ❌ Service Worker para PWA
- ❌ Optimización de carga de imágenes (lazy loading)
- ❌ Gestos táctiles avanzados (swipe entre tareas)
- ❌ Búsqueda y filtros avanzados en tareas
- ❌ Vista de mapa de obras
- ❌ Notificaciones push nativas (PWA)
- ❌ Indicadores de "escribiendo..." en chat
- ❌ Envío de imágenes/archivos en chat
- ❌ Búsqueda de mensajes

### 9.3 Limitaciones Técnicas
- ⚠️ Sin paginación en frontend para muchas tareas
- ⚠️ Imágenes grandes sin compresión automática (implementado parcialmente)
- ⚠️ Múltiples queries a Supabase sin optimización
- ⚠️ No hay realtime para actualizaciones de tareas (solo notificaciones)
- ⚠️ Sin fallback si Supabase está caído

### 9.4 Restricciones de Plan
- ✅ **NO hay restricciones de plan por sección en el frontend socio**
- ✅ Todas las funcionalidades (Chat, Notificaciones, Billetera, Presupuestos, etc.) están disponibles para todos los socios
- ⚠️ Los límites del backend (máx. 2 tareas activas, máx. 2 bloques activos) aplican a nivel de socio, no de plan de suscripción
- ⚠️ La suspensión de socio por saldo negativo es independiente del plan de suscripción

---

## 10. ENDPOINTS QUE USA

### 10.1 Tareas
- ✅ `GET /api/tareas` - Lista de tareas del socio (query params: org_id implícito, filtros por responsable)
- ✅ `GET /api/tareas/[id]` - Detalle de tarea específica con todas las relaciones
- ✅ `POST /api/tareas/[id]/transition` - Transición de estados FSM
  - Body: nuevo_estado, notas, checklist, has_nc, actor, media, snapshot_json
- ✅ `GET /api/tareas/[id]/evidencias` - Lista de evidencias de la tarea
- ✅ `POST /api/tareas/[id]/asignar-socio` - Asignación de socio (usado por cliente)

### 10.2 Subtareas (Supabase directo)
- ✅ SELECT FROM tareas_subtareas - Consulta de subtareas
- ✅ UPDATE tareas_subtareas - Actualización de estado y evidencias

### 10.3 Jornadas (Supabase directo)
- ✅ SELECT FROM jornadas_socio - Consulta de jornadas
- ✅ INSERT INTO jornadas_socio - Creación de jornada
- ✅ UPDATE jornadas_socio - Finalización de jornada

### 10.4 Billetera
- ✅ `GET /api/wallet/saldo` - Saldo disponible y pendiente (headers: x-organizacion-id)
- ✅ `GET /api/wallet/movimientos` - Historial de movimientos (query params: limit default 50, offset default 0)

### 10.5 Mensajes
- ✅ `GET /api/mensajes?socio_id={id}` - Mensajes del socio (headers: x-organizacion-id)
- ✅ `POST /api/mensajes` - Envío de mensajes (body: org_id, remitente_id, remitente_tipo, destinatario_id, destinatario_tipo, contenido, tipo, leido)
- ✅ `PATCH /api/mensajes/[id]/leido` - Marcar como leído (headers: x-organizacion-id, x-usuario-id)

### 10.6 Notificaciones
- ✅ `GET /api/notificaciones` - Lista de notificaciones (headers: x-organizacion-id, x-socio-id o x-usuario-id)
- ✅ `PATCH /api/notificaciones/[id]/leida` - Marcar notificación como leída (headers: x-organizacion-id, x-usuario-id)

### 10.7 Presupuestos
- ✅ `GET /api/socio/presupuestos` - Lista de obras y presupuestos
- ✅ `GET /api/presupuestos/pdf` - Obtener PDF (query params: obra_id, etapa)
- ✅ `POST /api/presupuestos/pdf` - Subir PDF (body: FormData con archivo PDF)
- ✅ `DELETE /api/presupuestos/eliminar-pdf` - Eliminar PDF (body: obra_id, etapa)

### 10.8 Upload
- ✅ `POST /api/upload/file` - Subida de evidencias y videos (body: FormData con file, kind, tareaId opcional, obraId opcional)

### 10.9 Planos
- ✅ `GET /api/socio/obras/[obra_id]/planos` - Lista de planos de la obra

### 10.10 Supabase Direct Queries
- ✅ socios: SELECT id, org_id WHERE email = currentUser.email
- ✅ tareas: SELECT con filtros por org_id y responsable
- ✅ tarea_precedencias: SELECT para ordenar tareas por CPM
- ✅ eventos: SELECT para avances y finalizaciones
- ✅ media: SELECT para evidencias relacionadas con eventos
- ✅ organizaciones: SELECT owner_user_id para notificaciones

---

## 11. LO QUE YA ESTÁ IMPLEMENTADO HOY

### 11.1 Navegación y Estructura
- ✅ Layout principal con Header fijo (SocioHeader) y TabBar inferior (SocioTabBar)
- ✅ Drawer lateral con acceso a todas las secciones
- ✅ 4 pestañas principales: Inicio, Mis tareas, Mensajes, Menú
- ✅ Navegación completa entre secciones

### 11.2 Componentes UI Principales
- ✅ **Navegación:** SocioHeader, SocioTabBar, TopBar
- ✅ **Secciones:** AhoraSection, CuentaSection, TareasEnCurso, Notificaciones, MiCuadrilla, Obras, MisTareas
- ✅ **Billetera:** SaldoCard, MovimientosList
- ✅ **Tareas:** ChecklistModal, SlideToConfirm, SwipeUpCameraButton, PanelViewer
- ✅ **Presupuestos:** Componentes completos de edición y visualización
- ✅ **Mensajería:** MensajeriaSocio, ChatPorObra
- ✅ **Evidencias:** GaleriaEvidencias, ModalEvidencias
- ✅ **UI Genéricos:** Card, Button, Badge, Progress, Dialog, EmptyState, BaseCard

### 11.3 Integraciones Backend
- ✅ Endpoints de tareas funcionando
- ✅ Endpoints de wallet funcionando
- ✅ Endpoints de mensajes funcionando
- ✅ Endpoints de notificaciones funcionando
- ✅ Endpoints de presupuestos funcionando
- ✅ Queries directas a Supabase funcionando

### 11.4 Flujos Completos
- ✅ Inicio/finalización de jornada
- ✅ Inicio/finalización de tareas con FSM
- ✅ Gestión de subtareas (bloques) con modal obligatorio
- ✅ Generación automática de subtareas desde presupuestos
- ✅ Chat en tiempo real
- ✅ Notificaciones con realtime
- ✅ Billetera completa con movimientos
- ✅ Presupuestos completos con PDF

### 11.5 Estados y Validaciones
- ✅ Estados FSM para tareas (pendiente, en_progreso, para_validar, validada, rechazada)
- ✅ Estados para subtareas (pendiente, en_progreso, para_validar, validado, rechazado)
- ✅ Validación de evidencias obligatorias
- ✅ Validación de control de calidad
- ✅ Ordenamiento por CPM (Critical Path Method)
- ✅ Manejo de errores básico

---

## 12. ESTRUCTURA DE NAVEGACIÓN

### 12.1 Layout Principal
- Header fijo superior (SocioHeader): Logo GROWS dorado sobre fondo azul oscuro (#071A34)
- Contenido principal: padding-top 70px, padding-bottom 90px
- TabBar fijo inferior (SocioTabBar): 4 pestañas principales
- Drawer lateral: accesible desde botón Menú en TabBar

### 12.2 TabBar Permanente
- Posición: fixed bottom-0, z-index 40
- 4 botones principales:
  1. Inicio (Home icon) -> /socio/ahora
  2. Mis tareas (CheckSquare icon) -> /socio/tareas
  3. Mensajes (MessageSquare icon) -> /socio/mensajes (con badge de no leídos)
  4. Menú (Menu icon) -> Abre drawer lateral

### 12.3 Drawer Lateral
- Acceso: Botón Menú en TabBar o evento 'grows:open-side-menu'
- Posición: fixed left-0, z-index 50, width 320px
- Fondo: bg-grows-blue (#276EF1)
- Contenido:
  - Header con avatar, nombre y rol del usuario
  - Lista de opciones: Notificaciones, Ahora, Tareas, Presupuesta, Billetera, Mi Cuadrilla, Cuenta
  - Footer con botón "Cerrar sesión"

---

## 13. ERRORES Y EDGE CASES MANEJADOS

### 13.1 Errores de Autenticación
- ✅ Usuario no autenticado: Redirige a /auth/login
- ✅ Usuario sin orgId: Intenta resolver desde tabla socios

### 13.2 Errores de Datos
- ✅ Sin tareas asignadas: Muestra estado vacío
- ✅ Sin subtareas pero con tarea: Modo compatibilidad
- ✅ Jornada duplicada: Detecta y carga jornada existente (error 23505)

### 13.3 Errores de Validación
- ✅ Finalizar subtarea sin evidencia: Modal bloquea finalización
- ✅ Finalizar subtarea sin control de calidad: Checkbox obligatorio
- ✅ Finalizar tarea sin evidencias finales: Error claro

### 13.4 Edge Cases
- ✅ Subtarea sin tarea asociada: Sistema busca tarea desde subtarea.tarea_id
- ✅ Tarea sin obra_id: Error al iniciar jornada
- ✅ Múltiples tareas asignadas: Ordena por CPM
- ✅ Subtareas fuera de orden: Sistema busca primera pendiente por orden ASC

---

## 14. DIFERENCIAS CON FRONTEND CLIENTE

### 14.1 Restricciones de Plan
- **Frontend Socio:** NO tiene restricciones de plan por sección. Todas las funcionalidades están disponibles para todos los socios.
- **Frontend Cliente:** Tiene restricciones de plan basadas en límites (obras activas, tareas activas, cuadrillas). Los banners de upgrade aparecen cuando se exceden los límites.

### 14.2 Chat
- **Frontend Socio:** Chat funcional (mensajería directa por obra). Disponible para todos los socios.
- **Frontend Cliente:** Chat con GrowsBot fue eliminado en esta versión (MVP). La mensajería directa por obra sigue disponible en Notificaciones > tab Mensajes.

### 14.3 Límites del Backend
- **Frontend Socio:** Límites aplican a nivel de socio (máx. 2 tareas activas, máx. 2 bloques activos, suspensión por saldo negativo).
- **Frontend Cliente:** Límites aplican a nivel de organización según plan de suscripción (FREE: 2 obras, STARTER: 5 obras, PRO: 10 obras).

---

**FIN DEL DOCUMENTO**


