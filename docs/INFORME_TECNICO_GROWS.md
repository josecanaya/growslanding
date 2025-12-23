# INFORME TÉCNICO COMPLETO - GROWS
## Análisis del Sistema Basado en Código Real

**Fecha de Análisis:** 2025-01-XX  
**Versión del Código:** Basado en análisis completo del repositorio  
**Metodología:** Análisis exhaustivo del código fuente sin inventar funcionalidades

---

## 1. ROLES REALES DEL SISTEMA

### 1.1 Roles Definidos en el Código

Según `apps/web/lib/roles.ts` y `apps/web/lib/schemas/organizacion.schema.ts`:

**Roles existentes:**
- `ADMIN`: Administrador del sistema
- `CLIENTE_TECNICO`: Cliente técnico que gestiona obras
- `SOCIO`: Socio constructor que ejecuta tareas

**NO EXISTE** un rol separado para "Líder de obra" - se maneja mediante invitaciones (`leader_invites`).

### 1.2 Permisos y Accesos por Rol

#### ADMIN
- **Rutas permitidas:** `/cliente/*` y `/socio/*` (según `middleware.ts`)
- **Acciones:** Acceso completo a todas las funcionalidades
- **Restricciones:** Ninguna identificada en el código

#### CLIENTE_TECNICO
- **Rutas permitidas:** `/cliente/*`
- **Acciones identificadas:**
  - Crear y gestionar obras (`POST /api/obras`)
  - Crear y gestionar tareas (`POST /api/tareas`)
  - Solicitar presupuestos (`POST /api/obras/[id]/solicitar-presupuesto`)
  - Aprobar/rechazar presupuestos (`POST /api/presupuestos/[id]/aprobar`)
  - Asignar socios a tareas (`POST /api/tareas/[id]/asignar-socio`)
  - Asignar cuadrillas (`POST /api/tareas/[id]/asignar-cuadrilla`)
  - Cambiar estado de tareas (`POST /api/tareas/[id]/estado`, `POST /api/tareas/[id]/transition`)
  - Validar tareas (crea pago automático)
  - Gestionar elementos constructivos
  - Ver evidencias y reportes
  - Enviar mensajes a socios
  - Ver notificaciones

- **Restricciones:**
  - Debe tener `org_id` en metadata de usuario (redirige a `/onboarding` si falta)
  - Limitado por plan de suscripción (`usePlanGate`)

#### SOCIO
- **Rutas permitidas:** `/socio/*`
- **Acciones identificadas:**
  - Ver obras asignadas (`GET /api/socio/obras`)
  - Ver tareas asignadas (`GET /api/socios/[id]/tareas`)
  - Enviar presupuestos (`POST /api/socio/presupuestos/bulk`)
  - Cambiar estado de tareas mediante transiciones (`POST /api/tareas/[id]/transition`)
  - Subir evidencias (`POST /api/tareas/[id]/evidencias`)
  - Ver mensajes (`GET /api/mensajes`)
  - Enviar mensajes (`POST /api/mensajes`)
  - Ver notificaciones (`GET /api/notificaciones`)
  - Ver planos de obra (`GET /api/socio/obras/[obra_id]/planos`)

- **Restricciones:**
  - Solo puede modificar tareas asignadas a él o su cuadrilla
  - No puede aprobar/rechazar presupuestos
  - No puede asignar socios

### 1.3 Sistema de Permisos

**Archivo:** `apps/web/lib/services/index.ts` - `PermisosService`

**Permisos identificados en el código:**
- `crear_presupuesto`
- `aprobar_presupuesto`
- `rechazar_presupuesto`
- `asignar_socio`
- `asignar_cuadrilla`

**NOTA:** El sistema de permisos está implementado pero **INCOMPLETO** - muchos endpoints no verifican permisos explícitamente.

---

## 2. CICLO DE VIDA REAL DEL SISTEMA

### 2.1 Creación de Usuario

**Flujo identificado:**

1. **Registro inicial:**
   - Usuario accede a `/auth/login`
   - Ingresa email (`signInWithOtp` de Supabase)
   - Recibe magic link por email
   - Click en link → redirige a `/auth/callback`

2. **Selección de rol:**
   - Si usuario no tiene `role` en metadata → redirige a `/auth/select-role`
   - Usuario selecciona: `CLIENTE_TECNICO` o `SOCIO`
   - El rol se guarda en `user_metadata.role` o `app_metadata.role`

3. **Onboarding para CLIENTE_TECNICO:**
   - Si `org_id` falta → redirige a `/onboarding`
   - Crea organización (`POST /api/orgs/create`)
   - Guarda `org_id` en metadata del usuario
   - Marca `onboarding_completed` en tabla `orgs`

4. **Onboarding para SOCIO:**
   - NO requiere organización propia
   - Puede ser invitado a una organización existente
   - Se vincula mediante tabla `socios` con `org_id`

**Archivos clave:**
- `apps/web/app/auth/login/page.tsx`
- `apps/web/app/auth/callback/page.tsx`
- `apps/web/app/auth/select-role/page.tsx`
- `apps/web/app/api/orgs/create/route.ts`

### 2.2 Login / Auth

**Flujo de autenticación:**

1. **Magic Link (OTP):**
   - `POST` a Supabase Auth con email
   - Supabase envía email con link
   - Link contiene código OAuth
   - `/auth/callback` intercambia código por sesión (`exchangeCodeForSession`)

2. **Google OAuth:**
   - `signInWithOAuth({ provider: 'google' })`
   - Redirige a Google
   - Vuelve a `/auth/callback` con código

3. **Middleware de protección:**
   - `apps/web/middleware.ts` verifica sesión en cada request
   - Si no hay sesión → redirige a `/auth/login`
   - Si no hay rol → redirige a `/auth/select-role`
   - Si CLIENTE_TECNICO sin `org_id` → redirige a `/onboarding`
   - Valida que el rol tenga acceso a la ruta

**Modo DEV:**
- Si `NODE_ENV !== 'production'` o `NEXT_PUBLIC_DEV_MODE=true` → bypass de autenticación
- Usa `mockUser` de `apps/web/lib/mockUser.ts`

### 2.3 Creación de Obra

**Flujo completo:**

1. **Cliente técnico accede a `/obras/nueva`**
   - Wizard de creación con múltiples pasos
   - Componente: `apps/web/components/obras/wizardNuevo/`

2. **Paso 1: Datos básicos**
   - Nombre, dirección, cliente, plantas
   - Guarda en estado local del wizard

3. **Paso 2-8: Elementos constructivos**
   - Fundaciones, Muros, Instalaciones, Cubiertas, Suelos, Amenities, Parquizado
   - Selección de elementos del catálogo
   - Cada elemento tiene: cantidad, unidad (m², ml, unidades)

4. **Paso 9: Resumen**
   - Muestra todos los elementos seleccionados
   - Calcula superficies totales

5. **Paso 10: Confirmación**
   - `POST /api/obras` con payload completo:
     ```json
     {
       "nombre": string,
       "localizacion": string,
       "cliente": string,
       "plantas": number,
       "superficies": { Json },
       "elementos": Array<{ elemento_id, cantidad, unidad }>
     }
     ```

6. **Backend crea:**
   - Registro en tabla `obras` (Supabase)
   - Registros en tabla `elementos` (uno por cada elemento seleccionado)
   - **NO crea tareas automáticamente** - se crean después

**Archivos clave:**
- `apps/web/app/api/obras/route.ts` (POST)
- `apps/web/components/obras/wizardNuevo/`
- `apps/web/lib/services/obra.service.ts`

### 2.4 Creación de Tareas

**Flujos identificados:**

#### A) Creación manual desde "Tareas" section
1. Cliente técnico accede a `/cliente/tareas`
2. Selecciona obra
3. Click en "Crear tarea"
4. Modal: `ModalCrearTarea.tsx`
5. `POST /api/tareas` con:
   ```json
   {
     "obra_id": string,
     "title": string,
     "descripcion": string,
     "etapa": "estructura" | "obra_gris" | "terminaciones",
     "elemento_id": string (opcional),
     "fecha_inicio_estimada": string,
     "fecha_fin_estimada": string
   }
   ```

#### B) Generación desde elementos
1. Cliente técnico en sección "Elementos" de una obra
2. Selecciona elementos
3. Click en "Generar tareas"
4. Sistema crea tareas basadas en catálogo de tareas por elemento
5. Usa `apps/web/lib/catalogos/elementos` para mapear elemento → tareas

#### C) Desde wizard de organización (CPM)
1. Cliente técnico en `/cliente/organiza`
2. Arrastra tareas en canvas visual
3. Define precedencias (dependencias)
4. Calcula CPM (Critical Path Method)
5. Guarda: `POST /api/obras/[id]/guardar-cpm`

**Estados de tarea identificados:**
- `pendiente` (default)
- `en_ejecucion`
- `finalizado`
- `validado`

**Archivos clave:**
- `apps/web/app/api/tareas/route.ts`
- `apps/web/components/cliente/modals/ModalCrearTarea.tsx`
- `apps/web/lib/services/tarea.service.ts`
- `apps/web/lib/services/cpm.service.ts`

### 2.5 Módulo de Elementos

**Funcionalidad:**

1. **Carga de elementos:**
   - Cliente técnico selecciona elementos del catálogo
   - Especifica cantidad y unidad
   - Guarda en tabla `elementos` con relación a `obra_id`

2. **Catálogo de elementos:**
   - Definido en `apps/web/lib/catalogos/elementos.ts`
   - Estructura jerárquica: categorías → subcategorías → elementos
   - Cada elemento tiene:
     - `task_id`: ID de tarea asociada en catálogo
     - `cantidad`: cantidad por defecto
     - `unidad`: m², ml, unidades, etc.

3. **Expansión de elementos:**
   - `ExpansorElementos` (`apps/web/lib/services/expansorElementos.ts`)
   - Convierte elementos en tareas según catálogo
   - Respeta cantidad y unidad

**Archivos clave:**
- `apps/web/components/cliente/CargaElementosPanel.tsx`
- `apps/web/app/api/obras/[id]/elementos/route.ts`
- `apps/web/lib/catalogos/elementos.ts`

### 2.6 Publicación de Oportunidad (Solicitar Presupuesto)

**Flujo:**

1. **Cliente técnico en sección "Asigna":**
   - Ve lista de tareas sin presupuesto
   - Selecciona tareas (checkboxes)
   - Selecciona socio de dropdown
   - Click en "Solicitar presupuesto para seleccionadas"

2. **Request:**
   - `POST /api/obras/[id]/solicitar-presupuesto`
   - Payload:
     ```json
     {
       "etapa": string,
       "tareaIds": string[],
       "socioId": string,
       "notas": string (opcional)
     }
     ```

3. **Backend:**
   - Valida que socio pertenece a la organización
   - Valida que tareas pertenecen a la obra
   - Verifica duplicados (no crea si ya existe solicitud PENDIENTE/ENVIADO)
   - Crea registros en `tareas_presupuestos` con:
     - `tarea_id`
     - `socio_id`
     - `estado: 'PENDIENTE'`
     - `monto: 0`
     - `moneda: 'ARS'`
     - `cantidad` y `unidad` (si el elemento tiene)
   - Crea notificación para el socio

4. **Notificación:**
   - Tabla `notificaciones`
   - `tipo: 'presupuesto'`
   - `titulo: 'Nueva solicitud de presupuesto'`

**Archivos clave:**
- `apps/web/app/api/obras/[id]/solicitar-presupuesto/route.ts`
- `apps/web/components/cliente/asigna/ListaTareasSinPresupuesto.tsx`

### 2.7 Vista del Socio

**Rutas principales:**
- `/socio` - Dashboard principal
- `/socio/presupuestos` - Ver y enviar presupuestos
- `/socio/tareas` - Ver tareas asignadas
- `/socio/evidencias` - Ver evidencias subidas
- `/socio/mensajes` - Mensajería
- `/socio/notificaciones` - Notificaciones
- `/socio/ahora` - Vista de tarea actual
- `/socio/panel` - Panel de control

**Componentes principales:**
- `apps/web/components/socio/presupuestos/`
- `apps/web/components/socio/sections/`

### 2.8 Envío de Presupuesto

**Flujo:**

1. **Socio accede a `/socio/presupuestos`**
   - Ve lista de solicitudes pendientes agrupadas por obra
   - Cada solicitud muestra: tarea, cantidad, unidad, etapa

2. **Socio completa presupuesto:**
   - Ingresa `monto` (opcional)
   - Ingresa `dias_reales` (opcional, se guarda en `notas` como JSON)
   - Marca estado como `ENVIADO`

3. **Request:**
   - `POST /api/socio/presupuestos/bulk`
   - Payload:
     ```json
     {
       "obra_id": string,
       "presupuestos": [
         {
           "tarea_id": string,
           "dias_reales": number (opcional),
           "monto": number (opcional),
           "estado": "PENDIENTE" | "ENVIADO"
         }
       ]
     }
     ```

4. **Backend:**
   - Valida que socio autenticado corresponde al `socio_id` de las solicitudes
   - Si presupuesto existe → UPDATE
   - Si no existe → INSERT
   - Si estado es `ENVIADO` → crea notificación para cliente técnico

5. **Notificación al cliente:**
   - `titulo: 'Nuevo presupuesto recibido'`
   - `mensaje: 'El socio {email} envió {count} presupuesto(s)'`

**Archivos clave:**
- `apps/web/app/api/socio/presupuestos/bulk/route.ts`
- `apps/web/components/socio/presupuestos/ListaTareas.tsx`

### 2.9 Selección de Socio (Aprobar Presupuesto y Asignar)

**Flujo:**

1. **Cliente técnico en "Asigna":**
   - Ve presupuestos recibidos agrupados por etapa y cuadrilla
   - Cada presupuesto muestra: tarea, monto, días ofrecidos, estado

2. **Aprobar presupuesto:**
   - Click en "Aprobar"
   - `POST /api/presupuestos/[id]/aprobar`
   - Payload:
     ```json
     {
       "aprobado": true,
       "motivo": string (opcional)
     }
     ```
   - Backend actualiza `tareas_presupuestos.estado = 'APROBADO'`
   - Crea evento y notificación

3. **Asignar socio a tarea:**
   - Click en "Asignar"
   - `POST /api/tareas/[id]/asignar-socio`
   - Payload:
     ```json
     {
       "socioId": string
     }
     ```
   - Backend actualiza `tareas.responsable = socioId`
   - Crea evento y notificación

**Archivos clave:**
- `apps/web/app/api/presupuestos/[id]/aprobar/route.ts`
- `apps/web/app/api/tareas/[id]/asignar-socio/route.ts`
- `apps/web/components/cliente/asigna/ListaPresupuestos.tsx`

### 2.10 Ejecución de Tareas

**Flujo de transición de estados:**

1. **Socio inicia tarea:**
   - Accede a tarea en `/socio/ahora` o `/socio/tareas`
   - Click en "Iniciar"
   - `POST /api/tareas/[id]/transition`
   - Payload:
     ```json
     {
       "nuevo_estado": "en_ejecucion",
       "notas": string,
       "checklist": Array<{ id, label, checked }>,
       "has_nc": boolean,
       "actor": {
         "name": string,
         "role": "Cliente" | "Socio",
         "method": "QR" | "login" | "PIN"
       },
       "media": Array<{ kind: "foto" | "firma", dataUrl: string }>,
       "gps_lat": number,
       "gps_lon": number
     }
     ```

2. **Backend procesa transición:**
   - Valida transición según FSM (`apps/web/lib/fsm.ts`)
   - Actualiza `tareas.estado`
   - Crea registro en `eventos` con:
     - `nuevo_estado`
     - `actor_name`, `actor_role`, `actor_method`
     - `checklist` (JSON)
     - `has_nc`, `nc_responsable`, `nc_deadline`
     - `notas`
     - `gps_lat`, `gps_lon`
   - Sube media a Supabase Storage (`actas` bucket)
   - Crea registros en `media` vinculados al `evento_id`
   - Genera PDF de acta (si aplica) y guarda en `eventos.pdf_path`

3. **Socio finaliza tarea:**
   - Similar proceso con `nuevo_estado: "finalizado"`
   - Debe subir evidencias obligatorias

4. **Cliente técnico valida:**
   - Ve tarea en estado "finalizado"
   - Click en "Validar"
   - `POST /api/tareas/[id]/estado` o transición a "validado"
   - Backend:
     - Actualiza `tareas.estado = 'validado'`
     - Actualiza `tareas.validado_por` y `tareas.fecha_validacion`
     - **Crea pago automático** si hay presupuesto aprobado
     - Crea evento y notificación

**Archivos clave:**
- `apps/web/app/api/tareas/[id]/transition/route.ts`
- `apps/web/lib/fsm.ts`
- `apps/web/lib/evento-rules.ts`
- `apps/web/lib/services/evento.service.ts`

### 2.11 Reportes / Evidencias

**Flujo:**

1. **Socio sube evidencias:**
   - Durante transición de estado o después
   - `POST /api/tareas/[id]/evidencias`
   - Sube fotos/videos a Supabase Storage
   - Crea registros en `tareas_evidencias` o `media`

2. **Cliente técnico ve evidencias:**
   - `GET /api/tareas/[id]/evidencias`
   - Muestra galería de imágenes
   - Componente: `apps/web/components/socio/evidencias/GaleriaEvidencias.tsx`

3. **Eventos como reportes:**
   - Cada cambio de estado genera un `evento`
   - Los eventos incluyen: checklist, notas, GPS, media, PDF
   - Se pueden consultar: `GET /api/eventos?tarea_id=...`

**Archivos clave:**
- `apps/web/app/api/tareas/[id]/evidencias/route.ts`
- `apps/web/lib/services/evidencias.ts`

### 2.12 Notificaciones

**Sistema de notificaciones:**

1. **Tabla:** `notificaciones` (Supabase)
   - Campos: `id`, `org_id`, `socio_id`, `obra_id`, `tarea_id`, `titulo`, `mensaje`, `tipo`, `leida`, `created_at`

2. **Tipos de notificaciones identificados:**
   - `presupuesto`: Solicitudes y envíos de presupuestos
   - Otros tipos no especificados explícitamente en código

3. **Creación automática:**
   - Al solicitar presupuesto → notifica al socio
   - Al enviar presupuesto → notifica al cliente
   - Al aprobar/rechazar presupuesto → notifica al socio
   - Al asignar tarea → notifica al socio
   - Al cambiar estado de tarea → notifica según reglas

4. **Consulta:**
   - `GET /api/notificaciones` con filtros por `org_id` y `socio_id`
   - Marcar como leída: `PATCH /api/notificaciones/[id]/leida`

**Archivos clave:**
- `apps/web/app/api/notificaciones/route.ts`
- `apps/web/lib/services/notificacion.service.ts` (Prisma - **INCOMPLETO**, no se usa en producción)

**NOTA:** El `NotificacionService` de Prisma existe pero **NO SE USA** - las notificaciones se crean directamente en Supabase.

### 2.13 Mensajería

**Sistema de mensajes:**

1. **Tabla:** `mensajes` (Supabase)
   - Campos identificados: `id`, `org_id`, `obra_id`, `tarea_id`, `remitente_id`, `destinatario_id`, `mensaje`, `created_at`, `leido`

2. **Flujo:**
   - Cliente técnico o socio envía mensaje: `POST /api/mensajes`
   - Consulta mensajes: `GET /api/mensajes` con filtros:
     - `obra_id`
     - `tarea_id`
     - `socio_id` (filtra por remitente o destinatario)
     - `cliente_id` (filtra por remitente o destinatario)
   - Marcar como leído: `PATCH /api/mensajes/[id]/leido`

3. **Componentes:**
   - Cliente: `apps/web/components/cliente/ChatSection.tsx`
   - Socio: `apps/web/components/socio/MensajeriaSocio.tsx`

**Archivos clave:**
- `apps/web/app/api/mensajes/route.ts`

### 2.14 Calendario del Socio

**NO IMPLEMENTADO COMPLETAMENTE**

- Existe ruta `/socio/ahora` pero no hay calendario visual
- Las tareas tienen `fecha_inicio_estimada` y `fecha_fin_estimada` pero no se muestran en calendario

### 2.15 Billetera

**NO IMPLEMENTADO**

- No existe módulo de billetera en el código
- Los pagos se generan automáticamente al validar tareas pero no hay interfaz de billetera
- Referencias a pagos en `TareaService.crearPagoAutomatico` pero no hay tabla `pagos` visible en Supabase

---

## 3. ESTRUCTURA DE DATOS

### 3.1 Tablas de Supabase (Identificadas)

#### `orgs` / `organizations`
- `id` (UUID, PK)
- `name` (string)
- `cuit` (string, nullable)
- `address` (string, nullable)
- `created_at` (timestamp)
- `onboarding_completed` (boolean)
- `owner_user_id` (UUID, nullable)

#### `obras`
- `id` (UUID, PK)
- `org_id` (UUID, FK → orgs)
- `nombre` (string)
- `localizacion` (string, nullable)
- `cliente` (string, nullable)
- `plantas` (number, nullable)
- `superficies` (JSON, nullable)
- `created_at` (timestamp)

#### `elementos`
- `id` (UUID, PK)
- `obra_id` (UUID, FK → obras)
- `cantidad` (number)
- `unidad` (string: m², ml, unidades, etc.)
- Otros campos no especificados completamente en tipos

#### `tareas`
- `id` (UUID, PK)
- `org_id` (UUID, FK → organizations)
- `obra_id` (UUID, FK → obras)
- `elemento_id` (UUID, FK → elementos, nullable)
- `cuadrilla_id` (UUID, FK → cuadrillas, nullable)
- `title` (string)
- `descripcion` (string, nullable)
- `estado` (string, nullable: pendiente, en_ejecucion, finalizado, validado)
- `responsable` (string, nullable) - ID del socio
- `prioridad` (string, nullable)
- `etapa` (string, nullable: estructura, obra_gris, terminaciones)
- `fecha_inicio` (timestamp, nullable)
- `fecha_fin` (timestamp, nullable)
- `fecha_inicio_estimada` (timestamp, nullable)
- `fecha_fin_estimada` (timestamp, nullable)
- `fecha_inicio_real` (timestamp, nullable)
- `fecha_fin_real` (timestamp, nullable)
- `avance` (number, nullable: 0-100)
- `validado_por` (string, nullable)
- `fecha_validacion` (timestamp, nullable)
- `costo_presupuestado` (number, nullable)
- `created_at` (timestamp, nullable)
- `updated_at` (timestamp, nullable)

#### `tarea_precedencias`
- `tarea_id` (UUID, FK → tareas)
- `depende_de` (UUID, FK → tareas, nullable)
- `tipo_dependencia` (string, nullable)
- `lag_dias` (number, nullable)
- `pos_x` (number, nullable)
- `pos_y` (number, nullable)

#### `socios`
- `id` (UUID, PK)
- `org_id` (UUID, FK → orgs)
- `nombre` (string, nullable)
- `telefono` (string, nullable)
- `email` (string, nullable)
- `estado` (string: activo, inactivo)
- `rol` (string, default: "socio")
- `created_at` (timestamp)

#### `cuadrillas`
- `id` (UUID, PK)
- `org_id` (UUID, FK → orgs)
- `nombre` (string)
- Otros campos no completamente especificados

#### `cuadrilla_socios`
- Relación many-to-many entre cuadrillas y socios
- Campos no completamente especificados

#### `cuadrilla_integrantes`
- Relación entre cuadrillas e integrantes
- Campos no completamente especificados

#### `tareas_presupuestos`
- `id` (UUID, PK)
- `tarea_id` (UUID, FK → tareas)
- `socio_id` (UUID, FK → socios)
- `monto` (number, nullable)
- `moneda` (string, default: 'ARS')
- `estado` (string: PENDIENTE, ENVIADO, APROBADO, RECHAZADO)
- `cantidad` (number, nullable)
- `unidad` (string, nullable)
- `notas` (string, nullable) - Puede contener JSON con `dias_reales`
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `eventos`
- `id` (UUID, PK)
- `tarea_id` (UUID, FK → tareas)
- `actor_method` (string: QR, login, PIN)
- `actor_name` (string)
- `actor_role` (string: Cliente, Socio)
- `nuevo_estado` (enum: pendiente, en_ejecucion, finalizado, validado)
- `checklist` (JSON)
- `has_nc` (boolean)
- `nc_deadline` (string, nullable)
- `nc_responsable` (string, nullable)
- `notas` (string)
- `gps_lat` (number, nullable)
- `gps_lon` (number, nullable)
- `pdf_path` (string, nullable) - Ruta al PDF del acta en Storage
- `snapshot_json` (JSON, nullable)
- `created_at` (timestamp)

#### `media`
- `id` (UUID, PK)
- `evento_id` (UUID, FK → eventos)
- `kind` (string: foto, firma)
- `path` (string) - Ruta en Supabase Storage
- `idx` (number)
- `created_at` (timestamp)

#### `notificaciones`
- `id` (UUID, PK)
- `org_id` (UUID, FK → orgs)
- `socio_id` (UUID, FK → socios, nullable)
- `obra_id` (UUID, FK → obras, nullable)
- `tarea_id` (UUID, FK → tareas, nullable)
- `titulo` (string)
- `mensaje` (string)
- `tipo` (string: presupuesto, etc.)
- `leida` (boolean, default: false)
- `created_at` (timestamp)

#### `mensajes`
- `id` (UUID, PK)
- `org_id` (UUID, FK → orgs)
- `obra_id` (UUID, FK → obras, nullable)
- `tarea_id` (UUID, FK → tareas, nullable)
- `remitente_id` (UUID)
- `destinatario_id` (UUID)
- `mensaje` (string)
- `leido` (boolean, default: false)
- `created_at` (timestamp)

#### `leader_invites`
- `id` (UUID, PK)
- `org_id` (UUID, FK → orgs)
- `email` (string)
- `nombre` (string)
- `rol` (string)
- `token` (string)
- `status` (string)
- `accepted_at` (timestamp, nullable)
- `created_at` (timestamp)

#### `qr_tokens`
- `id` (UUID, PK)
- `token` (string)
- `ref_id` (string)
- `scope` (string)
- `pin` (string, nullable)
- `enabled` (boolean)
- `created_at` (timestamp)

#### `actas`
- Tabla mencionada pero estructura no completamente visible en tipos

#### `tareas_evidencias`
- Tabla mencionada pero estructura no completamente visible en tipos

#### `tareas_estados`
- Tabla mencionada pero estructura no completamente visible en tipos

### 3.2 Tablas de Prisma (Roadmap MVP)

**NO SE USAN EN PRODUCCIÓN** - Solo para desarrollo interno:

- `RoadmapObjetivo`
- `RoadmapGrupoTareas`
- `RoadmapTarea`

---

## 4. ENDPOINTS O SERVER ACTIONS

### 4.1 Autenticación

#### `POST /auth/invite`
- Crea invitación para líder de obra
- Genera token y envía email

#### `GET /auth/invite-accept`
- Página para aceptar invitación
- Valida token y vincula usuario a organización

#### `POST /auth/signout`
- Cierra sesión

### 4.2 Organizaciones

#### `POST /api/orgs/create`
- Crea nueva organización
- Payload: `{ name: string }`
- Respuesta: `{ id, name, created_at }`
- Rol: CLIENTE_TECNICO

#### `POST /api/orgs/update`
- Actualiza organización
- Rol: CLIENTE_TECNICO

#### `POST /api/orgs/complete-onboarding`
- Marca onboarding como completado
- Rol: CLIENTE_TECNICO

### 4.3 Obras

#### `GET /api/obras`
- Lista todas las obras del usuario
- Respuesta: Array de obras con elementos
- Rol: CLIENTE_TECNICO

#### `POST /api/obras`
- Crea nueva obra
- Payload:
  ```json
  {
    "nombre": string,
    "localizacion": string,
    "cliente": string,
    "plantas": number,
    "superficies": Json,
    "elementos": Array<{ elemento_id?, cantidad, unidad }>
  }
  ```
- Respuesta: `{ id, ...obra }`
- Rol: CLIENTE_TECNICO

#### `GET /api/obras/[id]`
- Obtiene obra por ID con elementos y tareas
- Rol: CLIENTE_TECNICO

#### `PATCH /api/obras/[id]`
- Actualiza obra
- Rol: CLIENTE_TECNICO

#### `DELETE /api/obras/[id]`
- Elimina obra (cascade)
- Rol: CLIENTE_TECNICO

#### `GET /api/obras/[id]/elementos`
- Lista elementos de una obra
- Rol: CLIENTE_TECNICO

#### `POST /api/obras/[id]/elementos`
- Agrega elemento a obra
- Payload: `{ elemento_id, cantidad, unidad }`
- Rol: CLIENTE_TECNICO

#### `PUT /api/obras/[id]/elementos/[elementoId]`
- Actualiza elemento
- Rol: CLIENTE_TECNICO

#### `GET /api/obras/[id]/tareas-disponibles`
- Obtiene tareas disponibles del catálogo para agregar
- Rol: CLIENTE_TECNICO

#### `POST /api/obras/[id]/solicitar-presupuesto`
- Solicita presupuesto a socio para tareas
- Payload:
  ```json
  {
    "etapa": string,
    "tareaIds": string[],
    "socioId": string,
    "notas": string (opcional)
  }
  ```
- Respuesta: `{ ok: true, created: number, skipped: number }`
- Rol: CLIENTE_TECNICO

#### `GET /api/obras/[id]/cpm`
- Calcula CPM (Critical Path Method) para obra
- Respuesta: Grafo de precedencias y ruta crítica
- Rol: CLIENTE_TECNICO

#### `POST /api/obras/[id]/guardar-cpm`
- Guarda precedencias calculadas
- Rol: CLIENTE_TECNICO

#### `GET /api/obras/[id]/plantas`
- Obtiene información de plantas de la obra
- Rol: CLIENTE_TECNICO

#### `GET /api/obras/[id]/estadisticas`
- Obtiene estadísticas de la obra
- Rol: CLIENTE_TECNICO

#### `POST /api/obras/[id]/cronograma/recalcular`
- Recalcula cronograma basado en precedencias
- Rol: CLIENTE_TECNICO

### 4.4 Tareas

#### `GET /api/tareas`
- Lista tareas con filtros
- Query params: `obra_id`, `estado`, `etapa`, etc.
- Rol: CLIENTE_TECNICO, SOCIO (solo asignadas)

#### `POST /api/tareas`
- Crea nueva tarea
- Payload:
  ```json
  {
    "obra_id": string,
    "title": string,
    "descripcion": string,
    "etapa": string,
    "elemento_id": string (opcional),
    "fecha_inicio_estimada": string,
    "fecha_fin_estimada": string
  }
  ```
- Rol: CLIENTE_TECNICO

#### `GET /api/tareas/[id]`
- Obtiene tarea por ID con relaciones
- Rol: CLIENTE_TECNICO, SOCIO (si asignada)

#### `PATCH /api/tareas/[id]`
- Actualiza tarea
- Rol: CLIENTE_TECNICO

#### `POST /api/tareas/[id]/estado`
- Cambia estado de tarea
- Payload: `{ estado: string, motivo?: string }`
- Rol: CLIENTE_TECNICO, SOCIO (solo asignadas)

#### `POST /api/tareas/[id]/transition`
- Transición de estado con validaciones FSM
- Payload completo con actor, checklist, media, GPS
- Crea evento y sube archivos
- Rol: CLIENTE_TECNICO, SOCIO (solo asignadas)

#### `POST /api/tareas/[id]/asignar-socio`
- Asigna socio a tarea
- Payload: `{ socioId: string }`
- Rol: CLIENTE_TECNICO

#### `POST /api/tareas/[id]/asignar-cuadrilla`
- Asigna cuadrilla a tarea
- Payload: `{ cuadrillaId: string }`
- Rol: CLIENTE_TECNICO

#### `GET /api/tareas/[id]/presupuestos`
- Lista presupuestos de una tarea
- Rol: CLIENTE_TECNICO, SOCIO (solo propios)

#### `POST /api/tareas/[id]/presupuestos`
- Crea presupuesto para tarea
- Payload: `{ socioId, monto, moneda, notas }`
- Rol: CLIENTE_TECNICO (solicitar), SOCIO (enviar)

#### `GET /api/tareas/[id]/evidencias`
- Lista evidencias de una tarea
- Rol: CLIENTE_TECNICO, SOCIO (solo asignadas)

#### `POST /api/tareas/[id]/evidencias`
- Sube evidencia para tarea
- Payload: `{ tipo, archivo, descripcion }`
- Rol: SOCIO (solo asignadas)

### 4.5 Presupuestos

#### `POST /api/presupuestos/[id]/aprobar`
- Aprueba o rechaza presupuesto
- Payload: `{ aprobado: boolean, motivo?: string }`
- Rol: CLIENTE_TECNICO

### 4.6 Socios

#### `GET /api/socios`
- Lista socios de la organización
- Rol: CLIENTE_TECNICO

#### `POST /api/socios`
- Crea nuevo socio
- Payload: `{ nombre, email, telefono }`
- Rol: CLIENTE_TECNICO

#### `GET /api/socios/[id]`
- Obtiene socio por ID
- Rol: CLIENTE_TECNICO

#### `DELETE /api/socios/[id]`
- Elimina socio
- Rol: CLIENTE_TECNICO

#### `POST /api/socios/invitar`
- Invita socio por email
- Payload: `{ email, nombre }`
- Rol: CLIENTE_TECNICO

#### `POST /api/socios/vincular-usuario`
- Vincula usuario existente a socio
- Payload: `{ socioId, userId }`
- Rol: CLIENTE_TECNICO

#### `GET /api/socios/[id]/tareas`
- Lista tareas asignadas a un socio
- Rol: CLIENTE_TECNICO, SOCIO (solo propias)

### 4.7 Socio (Vista del Socio)

#### `GET /api/socio/obras`
- Lista obras donde el socio tiene tareas asignadas
- Rol: SOCIO

#### `GET /api/socio/obras/[obra_id]/planos`
- Obtiene planos de una obra
- Rol: SOCIO (si tiene tareas en la obra)

#### `GET /api/socio/presupuestos`
- Lista presupuestos del socio
- Query params: `obra_id`
- Rol: SOCIO

#### `POST /api/socio/presupuestos/bulk`
- Guarda/actualiza múltiples presupuestos
- Payload:
  ```json
  {
    "obra_id": string,
    "presupuestos": Array<{
      "tarea_id": string,
      "dias_reales": number (opcional),
      "monto": number (opcional),
      "estado": "PENDIENTE" | "ENVIADO"
    }>
  }
  ```
- Rol: SOCIO

### 4.8 Cuadrillas

#### `GET /api/cuadrillas/[id]/socios`
- Lista socios de una cuadrilla
- Rol: CLIENTE_TECNICO

#### `POST /api/cuadrillas/[id]/socios`
- Agrega socio a cuadrilla
- Payload: `{ socioId: string }`
- Rol: CLIENTE_TECNICO

#### `DELETE /api/cuadrillas/[id]/socios`
- Remueve socio de cuadrilla
- Query params: `socio_id`
- Rol: CLIENTE_TECNICO

### 4.9 Eventos

#### `GET /api/eventos`
- Lista eventos con filtros
- Query params: `tarea_id`, `obra_id`, `tipo`
- Rol: CLIENTE_TECNICO, SOCIO (solo relacionados)

### 4.10 Notificaciones

#### `GET /api/notificaciones`
- Lista notificaciones
- Headers: `x-organizacion-id`, `x-socio-id` (opcional)
- Respuesta: Array de notificaciones
- Rol: CLIENTE_TECNICO, SOCIO

#### `POST /api/notificaciones`
- Crea notificación manual
- Payload: `{ org_id, socio_id, obra_id, tarea_id, titulo, mensaje, tipo }`
- Rol: Sistema (automático)

#### `PATCH /api/notificaciones/[id]/leida`
- Marca notificación como leída
- Rol: CLIENTE_TECNICO, SOCIO

#### `POST /api/notificaciones/[id]/leer`
- Alias de marcar como leída
- Rol: CLIENTE_TECNICO, SOCIO

### 4.11 Mensajes

#### `GET /api/mensajes`
- Lista mensajes con filtros
- Query params: `obra_id`, `tarea_id`, `socio_id`, `cliente_id`
- Respuesta: Array de mensajes
- Rol: CLIENTE_TECNICO, SOCIO

#### `POST /api/mensajes`
- Envía mensaje
- Payload:
  ```json
  {
    "org_id": string,
    "obra_id": string (opcional),
    "tarea_id": string (opcional),
    "remitente_id": string,
    "destinatario_id": string,
    "mensaje": string
  }
  ```
- Rol: CLIENTE_TECNICO, SOCIO

#### `PATCH /api/mensajes/[id]/leido`
- Marca mensaje como leído
- Rol: CLIENTE_TECNICO, SOCIO

### 4.12 Suscripciones

#### `GET /api/suscripciones/limites`
- Obtiene límites del plan actual
- Headers: `x-organizacion-id`
- Respuesta: `{ obras, tareas, socios, ... }`
- Rol: CLIENTE_TECNICO

#### `GET /api/subscription/plan`
- Obtiene plan de suscripción actual
- Rol: CLIENTE_TECNICO

### 4.13 Pagos (MercadoPago)

#### `POST /api/payments/subscribe`
- Crea suscripción en MercadoPago
- Payload: `{ planId, externalReference }`
- Respuesta: `{ id, initPoint, status }`
- Rol: CLIENTE_TECNICO

#### `POST /api/payments/cancel`
- Cancela suscripción
- Payload: `{ subscriptionId }`
- Rol: CLIENTE_TECNICO

#### `POST /api/payments/webhook`
- Webhook de MercadoPago para actualizar estado
- Rol: Sistema (MercadoPago)

### 4.14 QR

#### `POST /api/qr/resolve`
- Resuelve token QR y valida PIN
- Payload: `{ token, pin? }`
- Respuesta: `{ ref_id, scope, enabled }`
- Rol: Público (para QR en obra)

### 4.15 Legajo

#### `GET /api/legajo/documentos`
- Lista documentos del legajo
- Query params: `obra_id`, `categoria`
- Rol: CLIENTE_TECNICO

#### `POST /api/legajo/documentos/upload`
- Sube documento al legajo
- FormData: `archivo`, `obra_id`, `categoria`, `descripcion`
- Rol: CLIENTE_TECNICO

#### `DELETE /api/legajo/documentos/[id]`
- Elimina documento
- Rol: CLIENTE_TECNICO

#### `GET /api/legajo/categorias`
- Lista categorías de documentos
- Rol: CLIENTE_TECNICO

### 4.16 Roadmap (Desarrollo Interno)

#### `GET /api/roadmap/objetivos`
- Lista objetivos del roadmap
- **NO SE USA EN PRODUCCIÓN**

#### `POST /api/roadmap/objetivos`
- Crea objetivo
- **NO SE USA EN PRODUCCIÓN**

#### `PATCH /api/roadmap/objetivos`
- Actualiza objetivo
- **NO SE USA EN PRODUCCIÓN**

#### `DELETE /api/roadmap/objetivos`
- Elimina objetivo
- **NO SE USA EN PRODUCCIÓN**

#### `POST /api/roadmap/tareas`
- Crea tarea de roadmap
- **NO SE USA EN PRODUCCIÓN**

#### `PATCH /api/roadmap/tareas`
- Actualiza tarea de roadmap
- **NO SE USA EN PRODUCCIÓN**

#### `DELETE /api/roadmap/tareas`
- Elimina tarea de roadmap
- **NO SE USA EN PRODUCCIÓN**

### 4.17 Invitaciones

#### `POST /api/invites`
- Crea invitación
- Payload: `{ email, nombre, rol, org_id }`
- Rol: CLIENTE_TECNICO

#### `DELETE /api/invites/[id]`
- Elimina invitación
- Rol: CLIENTE_TECNICO

### 4.18 Catálogo

#### `GET /api/catalogo`
- Obtiene catálogo completo de elementos y tareas
- Respuesta: JSON con estructura jerárquica
- Rol: CLIENTE_TECNICO

#### `PUT /api/catalogo`
- Actualiza catálogo (solo admin interno)
- Rol: ADMIN

### 4.19 Upload

#### `POST /api/upload/photo`
- Sube foto genérica
- FormData: `file`
- Respuesta: `{ url }`
- Rol: CLIENTE_TECNICO, SOCIO

### 4.20 Usage

#### `GET /api/usage/[key]`
- Obtiene métricas de uso
- Query params: `org_id`
- Rol: CLIENTE_TECNICO

---

## 5. EVENTOS QUE DISPARAN NOTIFICACIONES O CAMBIOS DE ESTADO

### 5.1 Eventos Identificados en el Código

Según `apps/web/lib/services/notificacion.service.ts` y `apps/web/lib/services/evento.service.ts`:

#### `TAREA_CREADA`
- **Cuándo:** Al crear una tarea nueva
- **Notifica a:** Cliente técnico de la obra
- **Estado:** Implementado pero **NO SE USA** (el servicio de Prisma no se usa)

#### `TAREA_ESTADO_CAMBIADO`
- **Cuándo:** Al cambiar estado de tarea
- **Notifica a:** Cliente técnico de la obra
- **Estado:** Implementado en código pero notificaciones se crean directamente en Supabase

#### `PRESUPUESTO_SUBIDO`
- **Cuándo:** Socio envía presupuesto (`POST /api/socio/presupuestos/bulk` con estado ENVIADO)
- **Notifica a:** Cliente técnico
- **Estado:** **IMPLEMENTADO** - Se crea notificación en Supabase directamente

#### `PRESUPUESTO_APROBADO`
- **Cuándo:** Cliente aprueba presupuesto
- **Notifica a:** Socio asignado
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

#### `PRESUPUESTO_RECHAZADO`
- **Cuándo:** Cliente rechaza presupuesto
- **Notifica a:** Socio asignado
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

#### `SOCIO_ASIGNADO`
- **Cuándo:** Cliente asigna socio a tarea
- **Notifica a:** Socio asignado
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

#### `TAREA_INICIADA`
- **Cuándo:** Socio inicia tarea (transición a `en_ejecucion`)
- **Notifica a:** Cliente técnico
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

#### `TAREA_FINALIZADA`
- **Cuándo:** Socio finaliza tarea (transición a `finalizado`)
- **Notifica a:** Cliente técnico
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

#### `EVIDENCIA_SUBIDA`
- **Cuándo:** Socio sube evidencia
- **Notifica a:** Cliente técnico
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

#### `TAREA_VALIDADA`
- **Cuándo:** Cliente valida tarea (transición a `validado`)
- **Notifica a:** Socio asignado
- **Dispara:** Creación automática de pago
- **Estado:** **IMPLEMENTADO** - `TareaService.crearPagoAutomatico`

#### `PAGO_GENERADO`
- **Cuándo:** Se genera pago automático al validar tarea
- **Notifica a:** Socio asignado
- **Estado:** Implementado en servicio Prisma pero **NO SE USA**

### 5.2 Eventos Reales que se Crean en Supabase

**Tabla `eventos` se crea en:**
- `POST /api/tareas/[id]/transition` - Crea evento con todos los datos de la transición
- Cada evento incluye: actor, estado, checklist, notas, GPS, media, PDF

**Notificaciones reales que se crean directamente:**
1. Al solicitar presupuesto → notifica al socio (en `solicitar-presupuesto/route.ts`)
2. Al enviar presupuesto → notifica al cliente (en `presupuestos/bulk/route.ts`)

---

## 6. FLUJOS CRUZADOS REALES

### 6.1 Socio ↔ Cliente

#### Flujo: Solicitud y Envío de Presupuesto

```
Cliente Técnico                    Socio
     |                               |
     |-- POST solicitar-presupuesto  |
     |   (tareaIds, socioId)         |
     |----------------------------->  |
     |                               |
     |                    [Crea tareas_presupuestos]
     |                    [Crea notificación]
     |                               |
     |<-- GET /socio/presupuestos ---|
     |                               |
     |                    [Ve solicitudes pendientes]
     |                               |
     |                               |-- POST presupuestos/bulk
     |                               |   (monto, dias_reales, estado: ENVIADO)
     |<-------------------------------|
     |                               |
     |                    [Actualiza tareas_presupuestos]
     |                    [Crea notificación]
     |                               |
     |-- GET /api/obras/[id] --------|
     |   [Ve presupuestos recibidos] |
     |                               |
     |-- POST presupuestos/[id]/aprobar
     |   (aprobado: true)            |
     |----------------------------->  |
     |                    [Actualiza estado: APROBADO]
     |                    [Crea evento]
     |                               |
```

#### Flujo: Asignación y Ejecución de Tarea

```
Cliente Técnico                    Socio
     |                               |
     |-- POST tareas/[id]/asignar-socio
     |   (socioId)                   |
     |----------------------------->  |
     |                    [Actualiza tareas.responsable]
     |                    [Crea evento]
     |                               |
     |                               |-- GET /socio/tareas
     |                               |   [Ve tarea asignada]
     |                               |
     |                               |-- POST tareas/[id]/transition
     |                               |   (nuevo_estado: en_ejecucion)
     |<-------------------------------|
     |                    [Crea evento con checklist, media, GPS]
     |                    [Sube archivos a Storage]
     |                    [Genera PDF acta]
     |                               |
     |-- GET /api/tareas/[id] -------|
     |   [Ve estado y evidencias]    |
     |                               |
     |                               |-- POST tareas/[id]/transition
     |                               |   (nuevo_estado: finalizado)
     |<-------------------------------|
     |                    [Crea evento]
     |                               |
     |-- POST tareas/[id]/estado ----|
     |   (estado: validado)          |
     |----------------------------->  |
     |                    [Actualiza tareas.estado]
     |                    [Crea pago automático]
     |                    [Crea evento]
     |                               |
```

### 6.2 Cliente ↔ Backend

#### Flujo: Creación de Obra Completa

```
Frontend (Cliente)              Backend (API)
     |                               |
     |-- POST /api/obras             |
     |   (nombre, elementos, ...)    |
     |----------------------------->  |
     |                               |
     |                    [Valida sesión]
     |                    [Valida org_id]
     |                    [Crea obra en Supabase]
     |                    [Crea elementos en Supabase]
     |                    [Retorna obra con ID]
     |<-------------------------------|
     |                               |
     |-- GET /api/obras/[id] --------|
     |   [Obtiene obra completa]    |
     |----------------------------->  |
     |                    [Query Supabase con joins]
     |                    [Retorna obra + elementos + tareas]
     |<-------------------------------|
```

### 6.3 Backend ↔ Supabase

#### Flujo: Autenticación

```
Next.js Middleware          Supabase Auth
     |                           |
     |-- getSession() ---------->|
     |                           |
     |<-- Session data ----------|
     |   (user, role, org_id)    |
     |                           |
     |-- getUser() ------------->|
     |   (en API routes)         |
     |                           |
     |<-- User data -------------|
     |                           |
```

#### Flujo: Operaciones de Datos

```
API Route                 Supabase Client
     |                           |
     |-- from('tareas')          |
     |   .select('*')            |
     |   .eq('obra_id', id)      |
     |-------------------------> |
     |                           |
     |                    [Ejecuta query SQL]
     |                    [Aplica RLS policies]
     |                           |
     |<-- { data, error } -------|
     |                           |
     |-- .insert([...])          |
     |   .select()               |
     |-------------------------> |
     |                           |
     |                    [Inserta en tabla]
     |                    [Retorna registros creados]
     |                           |
     |<-- { data, error } -------|
     |                           |
```

### 6.4 Frontend ↔ Estado Global

#### Flujo: Gestión de Estado

```
React Component          Zustand Store / Context
     |                           |
     |-- useCurrentUser() ------->|
     |                           |
     |<-- SessionUser -----------|
     |   (id, role, orgId)       |
     |                           |
     |-- useAuthStore() --------->|
     |   .setUser()              |
     |-------------------------> |
     |                    [Actualiza estado global]
     |                           |
     |-- useOrganizaStore() ----->|
     |   [Estado del canvas]     |
     |-------------------------> |
     |                           |
```

---

## 7. ERRORES, HUECOS O MÓDULOS INCOMPLETOS

### 7.1 Funciones Sin Implementar

1. **Sistema de Pagos/Billetera:**
   - `TareaService.crearPagoAutomatico` existe pero **NO HAY** tabla `pagos` en Supabase
   - No hay interfaz de billetera para ver pagos
   - Los pagos se mencionan pero no se implementan completamente

2. **Notificaciones Automáticas:**
   - `NotificacionService` de Prisma está implementado pero **NO SE USA**
   - Las notificaciones se crean manualmente en algunos endpoints
   - No hay sistema centralizado de notificaciones

3. **Calendario del Socio:**
   - No existe vista de calendario
   - Las fechas están en la BD pero no se visualizan

4. **Sistema de Permisos:**
   - `PermisosService` existe pero **NO SE USA** en la mayoría de endpoints
   - Solo algunos endpoints verifican permisos explícitamente

5. **Validación de Límites de Suscripción:**
   - `usePlanGate` existe pero **NO SE APLICA** consistentemente
   - Los límites se consultan pero no se validan al crear recursos

### 7.2 Endpoints Rotos o Incompletos

1. **`POST /api/tareas/[id]/presupuestos`:**
   - Usa Prisma pero debería usar Supabase
   - **INCOMPLETO** - no se usa en producción

2. **`GET /api/eventos`:**
   - Existe pero la tabla `eventos` se crea en Supabase, no en Prisma
   - Puede haber inconsistencia

3. **Roadmap endpoints:**
   - Todos los endpoints de `/api/roadmap/*` **NO SE USAN** en producción
   - Son para desarrollo interno

### 7.3 Dependencias Faltantes

1. **Tabla `pagos`:**
   - Referenciada en código pero **NO EXISTE** en Supabase
   - `crearPagoAutomatico` fallaría

2. **Tabla `notificaciones` en Prisma:**
   - `NotificacionService` espera tabla Prisma pero se usa Supabase

3. **Modelos Prisma vs Supabase:**
   - Hay modelos Prisma (`Organization`, `Obra`, `Tarea`) pero **NO SE USAN**
   - Todo se maneja con Supabase directamente
   - Prisma solo se usa para Roadmap (desarrollo interno)

### 7.4 Tablas que No Se Usan

1. **Prisma Models:**
   - `Organization`, `Obra`, `Tarea`, `Socio`, `Evento` en Prisma
   - **NO SE USAN** - se usa Supabase directamente

2. **Roadmap Tables:**
   - `RoadmapObjetivo`, `RoadmapGrupoTareas`, `RoadmapTarea`
   - Solo para desarrollo interno

### 7.5 Componentes Incompletos

1. **`PanelAuditoria.tsx`:**
   - Muestra tareas pero **NO TIENE** funcionalidad de búsqueda (fue removida)
   - Solo muestra lista estática

2. **`CalendarioSection.tsx`:**
   - Existe pero **NO FUNCIONA** completamente
   - No muestra calendario real

3. **Sistema de Billetera:**
   - **NO EXISTE** componente de billetera
   - Los pagos se generan pero no se visualizan

### 7.6 Inconsistencias Identificadas

1. **Dualidad Prisma/Supabase:**
   - Algunos servicios usan Prisma (`TareaService`, `NotificacionService`)
   - Pero las tablas reales están en Supabase
   - **INCONSISTENCIA CRÍTICA**

2. **Autenticación:**
   - Modo DEV bypassea autenticación completamente
   - Puede causar problemas en desarrollo

3. **Validación de Roles:**
   - Middleware valida roles pero algunos endpoints no verifican
   - Puede haber acceso no autorizado

4. **Estados de Tarea:**
   - Hay múltiples formas de cambiar estado:
     - `POST /api/tareas/[id]/estado`
     - `POST /api/tareas/[id]/transition`
   - Pueden causar inconsistencias

---

## 8. RESUMEN EJECUTIVO

### 8.1 Arquitectura General

GROWS es una plataforma de gestión de obras de construcción construida con:
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth (Magic Link, Google OAuth)
- **Storage:** Supabase Storage (para media y PDFs)
- **Pagos:** MercadoPago (suscripciones)

### 8.2 Roles y Permisos

- **3 roles:** ADMIN, CLIENTE_TECNICO, SOCIO
- **Sistema de permisos:** Implementado pero **INCOMPLETO** - no se aplica consistentemente
- **Control de acceso:** Middleware valida rutas pero endpoints individuales no siempre verifican permisos

### 8.3 Flujos Principales Funcionando

✅ **Funcionando:**
- Autenticación y registro
- Creación de obras y elementos
- Creación y gestión de tareas
- Solicitud y envío de presupuestos
- Asignación de socios
- Transiciones de estado de tareas
- Subida de evidencias
- Mensajería básica
- Notificaciones básicas (algunas)

❌ **Incompleto o No Implementado:**
- Sistema de pagos/billetera
- Calendario del socio
- Notificaciones automáticas centralizadas
- Validación consistente de límites de suscripción
- Sistema de permisos completo

### 8.4 Problemas Críticos

1. **Dualidad Prisma/Supabase:** Servicios usan Prisma pero datos están en Supabase
2. **Pagos:** Se mencionan pero no hay implementación completa
3. **Permisos:** No se verifican en todos los endpoints
4. **Notificaciones:** Sistema automático no funciona, se crean manualmente

### 8.5 Recomendaciones

1. **Eliminar Prisma** o migrar todo a Prisma (actualmente es inconsistente)
2. **Implementar tabla `pagos`** en Supabase y completar flujo de pagos
3. **Centralizar notificaciones** - usar un solo sistema (Supabase o Prisma)
4. **Aplicar permisos** en todos los endpoints críticos
5. **Completar billetera** para visualizar pagos generados
6. **Implementar calendario** del socio si es requerido

---

## 9. CHECKLIST FINAL DE FLUJOS ENCONTRADOS

### ✅ Flujos Completamente Implementados

- [x] Registro y autenticación de usuario
- [x] Selección de rol
- [x] Onboarding de cliente técnico (creación de organización)
- [x] Creación de obra con wizard
- [x] Carga de elementos constructivos
- [x] Creación manual de tareas
- [x] Generación de tareas desde elementos
- [x] Organización de tareas con CPM
- [x] Solicitud de presupuesto a socio
- [x] Envío de presupuesto por socio
- [x] Aprobación/rechazo de presupuesto
- [x] Asignación de socio a tarea
- [x] Asignación de cuadrilla a tarea
- [x] Transición de estados de tarea (FSM)
- [x] Subida de evidencias
- [x] Validación de tareas
- [x] Mensajería entre cliente y socio
- [x] Notificaciones básicas (solicitud y envío de presupuesto)
- [x] Visualización de obras, tareas y presupuestos
- [x] Gestión de cuadrillas
- [x] Invitaciones a líderes de obra
- [x] Sistema de QR para acceso en obra
- [x] Subida de documentos al legajo
- [x] Suscripciones con MercadoPago

### ⚠️ Flujos Parcialmente Implementados

- [ ] Sistema de pagos (se genera pero no se visualiza)
- [ ] Notificaciones automáticas (solo algunas se crean)
- [ ] Calendario del socio (no hay vista de calendario)
- [ ] Validación de límites de suscripción (se consultan pero no se aplican)
- [ ] Sistema de permisos (existe pero no se usa consistentemente)

### ❌ Flujos No Implementados

- [ ] Billetera para visualizar pagos
- [ ] Notificaciones push/email (solo in-app básicas)
- [ ] Reportes avanzados
- [ ] Exportación de datos
- [ ] Integración con sistemas externos (excepto MercadoPago)

---

## 10. MAPA DEL SISTEMA

### 10.1 Estructura de Directorios Principales

```
apps/web/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── obras/                # Endpoints de obras
│   │   ├── tareas/               # Endpoints de tareas
│   │   ├── socio/                # Endpoints del socio
│   │   ├── presupuestos/         # Endpoints de presupuestos
│   │   ├── mensajes/             # Endpoints de mensajería
│   │   ├── notificaciones/       # Endpoints de notificaciones
│   │   ├── cuadrillas/           # Endpoints de cuadrillas
│   │   ├── payments/             # Endpoints de pagos
│   │   └── ...
│   ├── auth/                     # Páginas de autenticación
│   ├── cliente/                  # Rutas del cliente técnico
│   ├── socio/                    # Rutas del socio
│   └── ...
├── components/                   # Componentes React
│   ├── cliente/                  # Componentes del cliente
│   │   ├── asigna/               # Sección "Asigna"
│   │   ├── modals/               # Modales
│   │   └── ...
│   ├── socio/                    # Componentes del socio
│   ├── obras/                    # Componentes de obras
│   └── ...
├── lib/                          # Utilidades y servicios
│   ├── services/                 # Servicios de negocio
│   ├── schemas/                  # Schemas de validación (Zod)
│   ├── types/                    # Tipos TypeScript
│   ├── supabase/                 # Clientes de Supabase
│   └── ...
└── ...
```

### 10.2 Flujo de Datos Principal

```
Usuario (Browser)
    ↓
Next.js Middleware (auth check)
    ↓
React Component
    ↓
API Route Handler
    ↓
Supabase Client
    ↓
Supabase Database/Storage
```

### 10.3 Módulos Principales

1. **Módulo de Autenticación:** `app/auth/`, `middleware.ts`
2. **Módulo de Obras:** `app/api/obras/`, `components/obras/`
3. **Módulo de Tareas:** `app/api/tareas/`, `components/cliente/TareasSection.tsx`
4. **Módulo de Presupuestos:** `app/api/presupuestos/`, `components/cliente/asigna/`
5. **Módulo de Socios:** `app/api/socios/`, `components/socio/`
6. **Módulo de Mensajería:** `app/api/mensajes/`, `components/cliente/ChatSection.tsx`
7. **Módulo de Notificaciones:** `app/api/notificaciones/`
8. **Módulo de Cuadrillas:** `app/api/cuadrillas/`, `components/cuadrillas/`
9. **Módulo de Pagos:** `app/api/payments/`, `lib/payments/`
10. **Módulo de Suscripciones:** `lib/subscriptions/`

---

## CONCLUSIÓN

Este informe técnico está basado **100% en el código real** del repositorio GROWS. Se identificaron:

- **Funcionalidades completas:** Autenticación, obras, tareas, presupuestos, asignaciones, transiciones de estado
- **Funcionalidades incompletas:** Pagos, notificaciones automáticas, calendario, permisos
- **Problemas críticos:** Dualidad Prisma/Supabase, falta de consistencia en permisos

El sistema es **funcional para el flujo principal** (crear obra → solicitar presupuesto → asignar → ejecutar → validar) pero tiene **áreas que requieren completarse** para ser producción-ready completo.

---

**Fin del Informe Técnico**

