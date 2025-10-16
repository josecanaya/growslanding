# 🔧 Solución: Error al cargar objetivos del Roadmap

## Problema Identificado

El error ocurre cuando intentás activar el **toggle "DB"** en la página del roadmap (`/roadmap`). 

**Causa raíz:** Las tablas del roadmap (`roadmap_objetivos`, `roadmap_grupos_tareas`, `roadmap_tareas`) no existen en la base de datos PostgreSQL de Supabase.

## ✅ Solución Implementada

He realizado los siguientes cambios:

### 1. Schema de Prisma actualizado
- ✅ Agregados los modelos `RoadmapObjetivo`, `RoadmapGrupoTareas` y `RoadmapTarea` al schema de PostgreSQL
- 📁 Archivo: `apps/web/prisma/schema.prisma`

### 2. Migración SQL creada
- ✅ Creada migración para PostgreSQL con las 3 tablas necesarias
- 📁 Archivo: `apps/web/prisma/migrations/20251014000000_add_roadmap_tables_postgres/migration.sql`

### 3. Script de seed
- ✅ Creado script para cargar los datos iniciales del roadmap desde `roadmap.initial.json`
- 📁 Archivo: `apps/web/prisma/seed-roadmap.ts`

### 4. Mejor manejo de errores
- ✅ Mejorado el manejo de errores en la página del roadmap
- ✅ Ahora desactiva automáticamente el toggle "DB" si falla la conexión
- ✅ Muestra instrucciones útiles en la consola del navegador
- 📁 Archivo: `apps/web/app/roadmap/page.tsx`

### 5. Documentación completa
- ✅ Creado README con instrucciones detalladas
- 📁 Archivo: `apps/web/app/roadmap/README.md`

## 🚀 Pasos para Resolver el Error

Tenés **dos opciones**:

### Opción A: Usar localStorage (Recomendado - Sin configuración)

1. Simplemente **NO actives el toggle "DB"** en la página del roadmap
2. El roadmap funcionará perfectamente usando localStorage del navegador
3. ✅ Ya está funcionando así ahora

### Opción B: Configurar la Base de Datos

Si querés usar la base de datos, seguí estos pasos:

#### Paso 1: Ejecutar las migraciones

```bash
cd apps/web
npx prisma migrate deploy
```

> ⚠️ **Importante:** Necesitás tener acceso a la base de datos de Supabase. Si aparece un error de autenticación, verificá tu archivo `.env`.

#### Paso 2: Generar el cliente de Prisma

**Antes de ejecutar este comando, DETENÉ el servidor de desarrollo** (si está corriendo):

```bash
# En la terminal donde está corriendo el servidor, presiona Ctrl+C

# Luego ejecuta:
cd apps/web
npx prisma generate
```

#### Paso 3: Sembrar los datos iniciales

```bash
cd apps/web
npx tsx prisma/seed-roadmap.ts
```

O si no tenés tsx instalado:

```bash
cd apps/web
npx ts-node prisma/seed-roadmap.ts
```

#### Paso 4: Reiniciar el servidor

```bash
# Vuelve a iniciar el servidor de desarrollo
npm run dev
# o
pnpm dev
```

#### Paso 5: Activar el toggle DB

Ahora sí podés activar el **toggle "💾 DB"** en la página del roadmap y debería funcionar correctamente.

## 🧪 Verificación

Para verificar que todo funciona:

1. Abrí `/roadmap` en el navegador
2. Abrí la consola de desarrollador (F12)
3. Activá el toggle "💾 DB"
4. Si todo está bien, deberías ver los objetivos cargándose desde la base de datos
5. Si hay un error, verás un mensaje útil en la consola con instrucciones

## 💡 Recomendación

Para desarrollo local, **usá la Opción A (localStorage)**. Es más simple y no requiere conexión a la base de datos.

Solo usá la Opción B si necesitás:
- Compartir el roadmap entre múltiples usuarios
- Persistencia fuera del navegador
- Sincronización con otros sistemas

## 📚 Más Información

Para más detalles sobre el roadmap, consulta:
- 📖 `apps/web/app/roadmap/README.md` - Documentación completa
- 🗺️ `apps/web/data/roadmap.initial.json` - Datos del roadmap
- 🎨 `apps/web/lib/roadmap/fases.ts` - Definición de fases

## ❓ Preguntas Frecuentes

**P: ¿Por qué hay dos schemas de Prisma?**  
R: Uno es para SQLite (en la raíz) y otro para PostgreSQL (en `apps/web`). Estás usando PostgreSQL con Supabase.

**P: ¿Puedo importar/exportar el roadmap?**  
R: Sí, usá los botones "Importar" y "Exportar" en la interfaz del roadmap.

**P: ¿Cómo vuelvo a los datos iniciales?**  
R: Con localStorage, simplemente ejecutá `localStorage.clear()` en la consola. Con DB, re-ejecutá el seed.

**P: ¿El progreso se calcula automáticamente?**  
R: Sí, tanto en localStorage como en DB, el progreso se calcula basándose en las tareas completadas.

