# GROWS Backend

Backend completo para GROWS construido con Next.js (App Router) + Prisma + PostgreSQL.

## 🏗️ Arquitectura

### Dominios y Límites

**Persistente en DB:**
- **Tenancy y permisos**: Organizaciones multi-tenant, usuarios globales, miembros con roles
- **Suscripciones**: Planes con límites (Starter: 2 obras/5 socios, Pro: 10 obras/25 socios, Enterprise: ilimitado)
- **Obras**: Gestión completa de proyectos de construcción
- **Catálogo**: Plantillas de elementos y tareas constructivas
- **Elementos de obra**: Instancias específicas de elementos en obras
- **Tareas**: Instancias con FSM (PROPUESTA → PRESUPUESTADA → ASIGNADA → EN_EJECUCION → TERMINADA → VALIDADA)
- **Pagos**: Generados automáticamente al validar tareas
- **Eventos**: Auditoría completa con notificaciones automáticas

**Derivado/Cálculo:**
- **Camino crítico (CPM)**: Calculado on-demand con algoritmo de precedencias
- **KPIs**: Progreso, costos, duraciones
- **Timeline**: Layout visual (x,y,zoom)

### Estados y Responsables (FSM)

```mermaid
stateDiagram-v2
    [*] --> PROPUESTA
    PROPUESTA --> PRESUPUESTADA : Socio sube presupuesto
    PRESUPUESTADA --> ASIGNADA : Cliente asigna socio
    ASIGNADA --> EN_EJECUCION : Socio inicia
    EN_EJECUCION --> TERMINADA : Socio finaliza + evidencias
    TERMINADA --> VALIDADA : Cliente valida (genera pago)
    VALIDADA --> [*]
```

### Roles y Permisos

- **SOCIO**: Presupuestar, cambiar estados, subir evidencias
- **CLIENTE_TECNICO**: Crear obras/elementos/tareas, asignar socios, validar tareas
- **ADMIN**: Todos los permisos

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar base de datos con datos iniciales
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

## 🧩 Modo Desarrollador (GROWS)
- Activar: `NEXT_PUBLIC_DEV_MODE=true` (en `.env.local`)
- Acceso libre a todas las rutas sin login real
- Usuario simulado: `apps/web/lib/mockUser.ts`
- Banner visible 🧠 Modo Desarrollador Activo
- Middleware ignora Supabase Auth cuando está activo
- Solo para testing local o entornos de staging

## Logout y Persistencia de Sesión
- El helper `logout()` vive en `apps/web/lib/auth.ts` y se encarga de cerrar sesión, limpiar `localStorage` y redirigir al login.
- `useCurrentUser()` escucha los cambios de sesión con `supabase.auth.onAuthStateChange` y mantiene el estado global (Zustand) sincronizado.
- Al recargar la página la sesión se conserva; al cerrar sesión se limpian los datos locales.
- En modo desarrollador el cierre de sesión no llama a Supabase, muestra un aviso y vuelve al login simulado.

## 🧭 Onboarding de Organizaciones
- Ruta: `/onboarding`
- Crea y vincula organizaciones para cada Cliente Técnico
- Compatible con multi-tenancy y modo desarrollador
- Endpoint utilizado: `/api/orgs/create`

## 📊 Base de Datos

### Migración y Seeds

```bash
# Resetear base de datos
npm run db:reset

# Solo ejecutar seeds
npm run db:seed

# Abrir Prisma Studio
npm run db:studio
```

### Datos Iniciales

Los seeds inicializan:
- **Plantillas de elementos**: Desde `elementos-vivienda.ts` (6 categorías, 20+ tipos)
- **Plantillas de tareas**: Desde `tareas-construccion.ts` (1800+ tareas constructivas)
- **Planes de suscripción**: Starter, Pro, Enterprise con límites
- **Usuarios de ejemplo**: Admin, Cliente Técnico, Socio Constructor

## 🔌 API Endpoints

### Obras
- `GET /api/obras` - Listar obras con filtros
- `POST /api/obras` - Crear obra (valida límites de suscripción)
- `GET /api/obras/[id]` - Detalle de obra con elementos y KPIs
- `PATCH /api/obras/[id]` - Actualizar obra
- `DELETE /api/obras/[id]` - Soft delete obra
- `GET /api/obras/[id]/estadisticas` - KPIs de la obra
- `POST /api/obras/[id]/cronograma/recalcular` - Recalcular CPM

### Elementos
- `GET /api/obras/[obraId]/elementos` - Listar elementos de obra
- `POST /api/obras/[obraId]/elementos` - Crear elemento (desde plantilla o manual)

### Tareas
- `POST /api/tareas` - Crear tarea
- `GET /api/tareas/[id]` - Detalle de tarea con historial
- `PATCH /api/tareas/[id]` - Actualizar tarea
- `POST /api/tareas/[id]/estado` - Cambiar estado (FSM)
- `POST /api/tareas/[id]/asignar-socio` - Asignar socio
- `GET /api/tareas/[id]/presupuestos` - Listar presupuestos
- `POST /api/tareas/[id]/presupuestos` - Crear presupuesto
- `GET /api/tareas/[id]/evidencias` - Listar evidencias
- `POST /api/tareas/[id]/evidencias` - Subir evidencia

### Presupuestos
- `POST /api/presupuestos/[id]/aprobar` - Aprobar/rechazar presupuesto

### Suscripciones
- `GET /api/suscripciones/limites` - Obtener límites y estadísticas de uso

### Eventos y Notificaciones
- `GET /api/eventos` - Listar eventos con filtros
- `GET /api/notificaciones` - Notificaciones del usuario
- `POST /api/notificaciones/[id]/leer` - Marcar como leída

## 🔐 Autenticación y Autorización

### Headers Requeridos
```
x-usuario-id: uuid
x-organizacion-id: uuid
```

### Middleware de Autenticación
- `withAuth()` - Requiere autenticación
- `withRole(role)` - Requiere rol específico
- `withPermission(permission)` - Requiere permiso específico

### Validación de Límites
- **Obras**: Valida límite antes de crear
- **Socios**: Valida límite antes de invitar
- **Planes**: Verifica upgrade/downgrade

## 📈 CPM (Critical Path Method)

### Algoritmo Implementado
1. **Forward Pass**: Calcula fechas tempranas
2. **Backward Pass**: Calcula fechas tardías
3. **Holguras**: Total y libre
4. **Camino Crítico**: Tareas con holgura = 0

### Validaciones
- **Detección de ciclos**: Valida dependencias antes de calcular
- **Topological Sort**: Ordena tareas por dependencias
- **Cache**: Almacena resultados en `obra_cache`

## 🔔 Sistema de Eventos

### Tipos de Eventos
- `OBRA_CREADA`, `OBRA_ACTUALIZADA`
- `ELEMENTO_AGREGADO`
- `TAREA_CREADA`, `TAREA_ESTADO_CAMBIADO`
- `PRESUPUESTO_SUBIDO`, `PRESUPUESTO_APROBADO`, `PRESUPUESTO_RECHAZADO`
- `SOCIO_ASIGNADO`
- `TAREA_INICIADA`, `TAREA_FINALIZADA`
- `EVIDENCIA_SUBIDA`
- `TAREA_VALIDADA`
- `PAGO_GENERADO`, `PAGO_REALIZADO`

### Notificaciones Automáticas
- **In-App**: Almacenadas en DB
- **Email**: Integración con servicios externos
- **Push**: Integración con FCM/OneSignal

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 📝 Validaciones Zod

Todos los endpoints validan datos de entrada con schemas Zod:
- `CrearObraSchema`, `ActualizarObraSchema`
- `CrearTareaSchema`, `CambiarEstadoTareaSchema`
- `CrearPresupuestoSchema`, `AprobarPresupuestoSchema`
- `CrearEvidenciaSchema`
- `ValidarTransicionSchema` (FSM)

## 🚀 Despliegue

```bash
# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

### Variables de Entorno Requeridas
```env
DATABASE_URL="postgresql://user:password@localhost:5432/grows"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📚 Estructura del Proyecto

```
apps/web/
├── app/api/                 # Endpoints API
├── lib/
│   ├── schemas/            # Validaciones Zod
│   ├── services/           # Lógica de negocio
│   └── middleware/          # Autenticación
├── prisma/
│   ├── schema.prisma       # Modelo de datos
│   └── seeds/              # Datos iniciales
└── components/             # Componentes React
```

## 🔧 Comandos Útiles

```bash
# Generar cliente Prisma
npm run db:generate

# Resetear DB y ejecutar seeds
npm run db:reset

# Ver datos en Prisma Studio
npm run db:studio

# Linter
npm run lint
```

## 📋 TODO

- [ ] Integración con servicios de email (SendGrid/AWS SES)
- [ ] Integración con push notifications (FCM/OneSignal)
- [ ] Tests unitarios y de integración
- [ ] Documentación OpenAPI/Swagger
- [ ] Rate limiting
- [ ] Logging estructurado
- [ ] Métricas y monitoreo
- [ ] Backup automático de DB
