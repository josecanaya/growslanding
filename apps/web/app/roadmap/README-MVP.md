# 🚀 Roadmap MVP - GROWS (v0.3.0)

## 📋 ESTRUCTURA DEL ROADMAP

El roadmap está organizado en **4 categorías principales**:

### 🧩 CORE DEL SISTEMA (Backend + Lógica)
Objetivos 1-5: Autenticación, Backend, APIs, Base de Datos, Pagos

### 🧠 UX/UI Y FRONTEND FUNCIONAL
Objetivos 6-11: Interfaces, Panel Socio, Cuadrillas, Wizard, Configuración

### 🔄 OPERATIVOS / COORDINACIÓN
Objetivos 12-15: Comunicación, Documentación, Testing, Deploy

### 🧠 FUTUROS (Escalabilidad / Innovación)
Objetivos 16-17: BIM & 3D, Métricas & Rendimiento

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 📊 **VISUALIZACIÓN**
- ✅ Vista Timeline (horizontal/vertical)
- ✅ Vista de Módulos (grid)
- ✅ Progreso global del proyecto
- ✅ Estadísticas por objetivo
- ✅ Colores corporativos GROWS

### ✏️ **EDICIÓN DE TAREAS**
- ✅ Modo edición manual (toggle)
- ✅ Cambio de estado por tarea (🔴 Pendiente, 🟣 En Curso, ✅ Completada)
- ✅ Recálculo automático de progreso
- ✅ Indicadores visuales dinámicos

### 🗄️ **PERSISTENCIA**
- ✅ **LocalStorage** - Modo offline (por defecto)
- ✅ **Base de Datos** - Prisma + SQLite (toggle "💾 DB")
- ✅ Sincronización automática
- ✅ Auto-guardado

### 📝 **CRUD DE OBJETIVOS**
- ✅ **Crear** - Botón "➕ Nuevo Objetivo" en header
- ✅ **Editar** - Botón "✏️ Editar Objetivo" en modal
- ✅ **Eliminar** - Botón "🗑️ Eliminar" en modal
- ✅ **Leer** - Carga desde DB o localStorage

### 📋 **CRUD DE TAREAS**
- ✅ **Crear** - Formulario `FormTarea.tsx`
- ✅ **Editar** - Cambio de estado manual en modal
- ✅ **Eliminar** - API endpoint `/api/roadmap/tareas`
- ✅ **Recálculo de progreso** - Automático al modificar

---

## 🏗️ **ARQUITECTURA IMPLEMENTADA**

### **Backend (API Routes)**
```
/app/api/roadmap/
├── objetivos/route.ts  (GET, POST, PATCH, DELETE)
└── tareas/route.ts     (POST, PATCH, DELETE)
```

### **Componentes**
```
/components/roadmap/
├── SimpleObjectiveModal.tsx  (Modal con edición + botones)
├── FormObjetivo.tsx          (Crear/Editar objetivos)
├── FormTarea.tsx             (Crear/Editar tareas)
├── TimelineSection.tsx       (Visualización timeline)
└── CacheBuster.tsx           (Utils)
```

### **Base de Datos (Prisma)**
```
/prisma/schema.prisma
├── RoadmapObjetivo      (Objetivos principales)
├── RoadmapGrupoTareas   (Grupos de tareas)
└── RoadmapTarea         (Tareas individuales)
```

### **Tipos TypeScript**
```
/lib/roadmap/types.ts
├── Objective
├── Task
├── TaskGroup
├── TaskStatus
├── Priority
└── Helpers (getAllTasksFromObjective, getObjectiveStats, etc)
```

---

## 🎯 **CÓMO USAR**

### **1. Modo LocalStorage (por defecto)**
- Toggle OFF: "📦 Local"
- Datos guardados en `localStorage`
- No requiere DB
- Ideal para testing rápido

### **2. Modo Database**
- Toggle ON: "💾 DB"
- Datos persistentes en SQLite (Prisma)
- Sincronización real
- Preparado para multi-usuario

### **3. Crear Objetivo**
1. Clic en "➕ Nuevo Objetivo"
2. Completar formulario
3. Guardar → Se crea en DB o localStorage

### **4. Editar Objetivo**
1. Abrir objetivo (clic en tarjeta)
2. Clic en "✏️ Editar Objetivo"
3. Modificar campos
4. Guardar → Actualiza en DB

### **5. Editar Tareas**
1. Abrir objetivo
2. Activar "✏️ Modo edición real"
3. Cambiar estados con dropdowns
4. Clic "💾 Guardar Cambios"
5. Progreso se recalcula automáticamente

### **6. Eliminar Objetivo**
1. Abrir objetivo
2. Clic en "🗑️ Eliminar"
3. Confirmar → Elimina objetivo + todas sus tareas

---

## 🔧 **ENDPOINTS API**

### **GET /api/roadmap/objetivos**
Obtiene todos los objetivos con tareas y grupos

### **POST /api/roadmap/objetivos**
Crea un nuevo objetivo
```json
{
  "titulo": "Implementar auth",
  "descripcion": "Sistema de autenticación",
  "prioridad": "ALTA",
  "targetWeeks": 2
}
```

### **PATCH /api/roadmap/objetivos**
Actualiza un objetivo existente
```json
{
  "id": "uuid",
  "titulo": "Nuevo título",
  "progreso": 75
}
```

### **DELETE /api/roadmap/objetivos?id=uuid**
Elimina un objetivo y todas sus tareas

### **POST /api/roadmap/tareas**
Crea una nueva tarea
```json
{
  "texto": "Configurar OAuth",
  "objetivoId": "uuid",
  "estado": "pending",
  "estimateHrs": 8
}
```

### **PATCH /api/roadmap/tareas**
Actualiza una tarea
```json
{
  "id": "uuid",
  "estado": "done",
  "done": true
}
```

### **DELETE /api/roadmap/tareas?id=uuid**
Elimina una tarea y recalcula progreso

---

## 📦 **SCHEMA PRISMA**

```prisma
model RoadmapObjetivo {
  id          String   @id @default(uuid())
  titulo      String
  descripcion String?
  prioridad   String   @default("MEDIA")
  estado      String   @default("pending")
  progreso    Float    @default(0)
  tareas      RoadmapTarea[]
  gruposTareas RoadmapGrupoTareas[]
}

model RoadmapTarea {
  id          String   @id @default(uuid())
  texto       String
  estado      String   @default("pending")
  done        Boolean  @default(false)
  estimateHrs Int?
  objetivoId  String?
  objetivo    RoadmapObjetivo?
}
```

---

## 🎨 **COLORES CORPORATIVOS APLICADOS**

- **Primario:** `#6c63ff` (Violeta GROWS)
- **Secundario:** `#1b263b` (Texto oscuro)
- **Fondo:** `#f8f9fc` (Gris claro)
- **Bordes:** `#e0e3eb` (Gris medio)
- **Acento secundario:** `#8c8fa3` (Texto secundario)

### **Estados de Tareas**
- 🔴 **Pendiente:** `text-red-500`
- 🟣 **En Curso:** `text-[#6c63ff]`
- ✅ **Completada:** `text-green-500`

---

## 🚀 **PRÓXIMOS PASOS (Post-MVP)**

1. ⏳ Asignación de responsables (usuarios reales)
2. ⏳ Notificaciones automáticas
3. ⏳ Comentarios por tarea
4. ⏳ Drag & drop para reordenar
5. ⏳ Filtros avanzados
6. ⏳ Exportar a PDF
7. ⏳ Tiempo real con Supabase Realtime

---

## 🆕 **NOVEDADES v0.3.0**

### **Nuevo Objetivo #17: Métricas & Rendimiento**
- 📊 Logs de errores con Sentry
- ⚡ Medición de Web Vitals
- 🔍 Monitoreo de uso de API
- 🚀 Optimización de queries Prisma

### **Objetivo #1 Ampliado: Modo Desarrollador**
- 🧩 Dev Access Layer para testing sin login
- 👻 Usuario fantasma (fake user context)
- 🔀 Toggle NEXT_PUBLIC_DEV_MODE
- 🐛 Debug panel opcional
- 📝 Documentación de uso

### **Mejoras Sugeridas Agregadas**
Cada objetivo ahora incluye sugerencias de mejora:
- Control de expiración de invitaciones
- Middleware de errores global
- Audit trail para trazabilidad
- Centro de notificaciones global
- Feedback widget in-app
- Y más de 15 mejoras adicionales

---

## 📌 **ESTADO ACTUAL**

✅ **MVP COMPLETO Y FUNCIONAL**

- Backend con API REST
- CRUD completo de objetivos y tareas
- Persistencia dual (LocalStorage + DB)
- UI corporativa GROWS
- Edición manual de estados
- Sincronización automática
- **17 objetivos** organizados en 4 categorías

**URL:** http://localhost:3000/roadmap (o puerto disponible)

---

## 📊 **RESUMEN DE OBJETIVOS**

| Categoría | Objetivos | Estado |
|-----------|-----------|--------|
| 🧩 Core del Sistema | 5 objetivos | 3 ✅ / 1 🟡 / 1 🔴 |
| 🧠 UX/UI Frontend | 6 objetivos | 5 ✅ / 1 🟡 |
| 🔄 Operativos | 4 objetivos | 1 🟡 / 3 🔴 |
| 🧠 Futuros | 2 objetivos | 2 🔴 |
| **TOTAL** | **17 objetivos** | **~60% progreso** |

---

**Última actualización:** 13 de octubre, 2025
**Versión:** 0.3.0 (Refinada)


