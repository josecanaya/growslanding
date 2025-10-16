# 🗺️ Roadmap Editor - Documentación

## Descripción

Editor interactivo del roadmap de desarrollo con soporte para:
- ✅ Almacenamiento en **localStorage** (por defecto)
- 🗄️ Almacenamiento en **Base de Datos PostgreSQL** (opcional)
- 📊 Visualización por fases, timeline y módulos
- ✏️ Edición en vivo de objetivos y tareas
- 📤 Exportación/Importación JSON

## Configuración Inicial

### Opción 1: Usar localStorage (Recomendado para desarrollo)

Por defecto, el roadmap se carga desde `data/roadmap.initial.json` y se almacena en el navegador.

**No requiere configuración adicional** - ¡Simplemente abre `/roadmap` y empieza a trabajar!

### Opción 2: Usar Base de Datos PostgreSQL

Si deseas persistir el roadmap en la base de datos de Supabase, sigue estos pasos:

#### 1. Ejecutar las migraciones

```bash
cd apps/web
npx prisma migrate deploy
```

#### 2. Sembrar los datos iniciales

```bash
cd apps/web
npx ts-node prisma/seed-roadmap.ts
```

O con tsx:

```bash
cd apps/web
npx tsx prisma/seed-roadmap.ts
```

#### 3. Generar el cliente de Prisma

```bash
cd apps/web
npx prisma generate
```

#### 4. Activar el modo DB en la interfaz

En la página del roadmap, activa el toggle **"💾 DB"** en la esquina superior derecha.

## Solución de Problemas

### Error: "Error al cargar objetivos"

**Causa:** Las tablas del roadmap no existen en la base de datos.

**Solución:**
1. Asegúrate de haber ejecutado las migraciones (paso 1 arriba)
2. Ejecuta el seed para cargar los datos iniciales (paso 2 arriba)
3. Reinicia el servidor de desarrollo

### Error: "P1000: Authentication failed"

**Causa:** Las credenciales de la base de datos en el archivo `.env` no son válidas.

**Solución:**
1. Verifica que `DATABASE_URL` en `apps/web/.env` sea correcta
2. Asegúrate de tener conexión a Supabase
3. Si no tienes acceso a la DB, usa el modo localStorage

### El toggle DB se desactiva automáticamente

**Comportamiento esperado:** Si hay un error al cargar desde la base de datos, el sistema automáticamente vuelve a localStorage y desactiva el toggle.

**Para usar DB nuevamente:** Corrige el error de conexión y reactiva el toggle manualmente.

## Estructura de Datos

### Modelos de Base de Datos

#### RoadmapObjetivo
- `id`: UUID
- `titulo`: Texto del objetivo
- `descripcion`: Descripción detallada
- `prioridad`: ALTA | MEDIA | BAJA
- `estado`: pending | inProgress | done
- `progreso`: 0-100 (se calcula automáticamente)
- `startWeek`, `endWeek`, `targetWeeks`: Planificación temporal
- `dueDate`: Fecha límite (opcional)
- `collapsed`: Estado de la UI

#### RoadmapGrupoTareas
- `id`: UUID
- `titulo`: Nombre del grupo
- `descripcion`: Descripción
- `objetivoId`: Relación con objetivo padre

#### RoadmapTarea
- `id`: UUID
- `texto`: Descripción de la tarea
- `estado`: pending | inProgress | done | review
- `done`: Boolean
- `estimateHrs`: Horas estimadas
- `responsable`: Equipo responsable
- `objetivoId`: Relación directa con objetivo (opcional)
- `grupoId`: Relación con grupo de tareas (opcional)

### Formato JSON (localStorage)

```typescript
interface ProjectRoadmap {
  projectName: string;
  version: string;
  updatedAt: string;
  objectives: Objective[];
}

interface Objective {
  id: string;
  title: string;
  description: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  status: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETO';
  targetWeeks?: number;
  startWeek?: number;
  endWeek?: number;
  dueDate?: string;
  collapsed?: boolean;
  tasks?: Task[];
  taskGroups?: TaskGroup[];
}
```

## API Endpoints

### GET /api/roadmap/objetivos
Obtiene todos los objetivos con sus tareas y grupos.

### POST /api/roadmap/objetivos
Crea un nuevo objetivo.

**Body:**
```json
{
  "titulo": "Nombre del objetivo",
  "descripcion": "Descripción detallada",
  "prioridad": "ALTA",
  "estado": "pending"
}
```

### PATCH /api/roadmap/objetivos
Actualiza un objetivo existente.

**Body:**
```json
{
  "id": "uuid-del-objetivo",
  "titulo": "Nuevo título",
  ...
}
```

### DELETE /api/roadmap/objetivos?id={uuid}
Elimina un objetivo y todas sus tareas asociadas.

### POST /api/roadmap/tareas
Crea una nueva tarea.

### PATCH /api/roadmap/tareas
Actualiza una tarea existente.

### DELETE /api/roadmap/tareas?id={uuid}
Elimina una tarea.

## Características

### Vistas Disponibles

1. **Timeline Horizontal/Vertical**: Visualización temporal del proyecto
2. **Por Fases**: Agrupación de objetivos según las 5 fases del MVP
3. **Por Módulos**: Vista de tarjetas compacta
4. **Mapa Completo**: Vista general del proyecto

### Funcionalidades

- ✅ Crear, editar y eliminar objetivos
- ✅ Marcar tareas como completadas
- ✅ Calcular progreso automáticamente
- ✅ Exportar/Importar roadmap completo
- ✅ Auto-guardado en localStorage
- ✅ Sincronización con base de datos (opcional)
- ✅ Visualización de fases del MVP
- ✅ KPIs y métricas globales

## Scripts Útiles

### Limpiar datos de desarrollo

```bash
# Eliminar datos de localStorage
# Abre la consola del navegador y ejecuta:
localStorage.clear()

# Reiniciar la base de datos (CUIDADO: Elimina todos los datos)
cd apps/web
npx prisma migrate reset
```

### Re-sembrar datos

```bash
cd apps/web
npx ts-node prisma/seed-roadmap.ts
```

## Contribuir

Para agregar nuevos objetivos o modificar la estructura:

1. Edita `apps/web/data/roadmap.initial.json`
2. Si usas DB, ejecuta el seed nuevamente
3. Exporta el JSON actualizado para respaldo

## Soporte

Para problemas o dudas, consulta:
- 📖 Documentación de Prisma: https://www.prisma.io/docs
- 🗺️ Formato del roadmap: Ver `lib/roadmap/types.ts`
- 🎨 Fases del MVP: Ver `lib/roadmap/fases.ts`
