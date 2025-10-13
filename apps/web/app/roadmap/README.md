# 🚀 Roadmap Interactivo (v0.3.0)

Módulo independiente de gestión de roadmaps de proyectos con persistencia local.

## 🆕 Novedades v0.3.0

- ✅ **17 objetivos** organizados en 4 categorías (Core, UX/UI, Operativos, Futuros)
- ✅ **Objetivo #17 nuevo**: Métricas & Rendimiento
- ✅ **Objetivo #1 ampliado**: Modo Desarrollador (Dev Access Layer)
- ✅ **Mejoras sugeridas** agregadas a cada objetivo
- ✅ Categorización visual por tipo de objetivo

## 📁 Archivos Creados

```
apps/web/
├── app/roadmap/
│   ├── page.tsx           # Página principal (client component)
│   └── README.md          # Esta documentación
├── lib/roadmap/
│   └── types.ts           # Tipos TypeScript
├── data/
│   └── roadmap.initial.json  # Datos iniciales (seed)
└── components/ui/
    ├── progress.tsx       # Componente Progress
    ├── checkbox.tsx       # Componente Checkbox
    └── badge.tsx          # Componente Badge
```

## ✨ Funcionalidades

### Gestión de Proyectos
- ✅ Selector de proyectos (GROWS, OTRO_MVP, + personalizados)
- ✅ Crear nuevos proyectos
- ✅ Persistencia automática en localStorage por proyecto
- ✅ Exportar/Importar JSON
- ✅ Resetear al estado inicial (seed)

### Objetivos y Tareas
- ✅ Checklists interactivas por objetivo
- ✅ Agregar/Eliminar tareas inline
- ✅ Cálculo automático de progreso (% por objetivo y total)
- ✅ Estado automático (PENDIENTE → EN_CURSO → COMPLETO)
- ✅ Duplicar objetivos
- ✅ Eliminar objetivos

### Filtros y Búsqueda
- ✅ Búsqueda por texto (títulos de objetivos y tareas)
- ✅ Filtro por estado (Pendiente/En Curso/Completo)
- ✅ Filtro por prioridad (Alta/Media/Baja)
- ✅ Ordenamiento por:
  - Prioridad (Alta → Baja)
  - Progreso ascendente
  - Progreso descendente

### KPIs y Métricas
- ✅ Progreso total del proyecto
- ✅ Tareas completadas vs totales
- ✅ Total de objetivos
- ✅ Horas estimadas (si están definidas)

## 🎨 UI/UX

- **Responsive**: Mobile-first, adaptado a tablets y desktop
- **Accesible**: Labels ARIA, navegación por teclado, roles semánticos
- **Modo claro**: Respeta el tema global si existe
- **Paleta consistente**: Usa variables Tailwind del proyecto

## 🔄 Persistencia

**Storage Key Pattern**: `roadmap:<projectName>`

**Auto-save**: Cualquier cambio (marcar tarea, agregar/eliminar) se guarda automáticamente.

**Manual Save**: Botón "Guardar" disponible para confirmación visual.

## 📊 Modelo de Datos

### Status Calculation
```typescript
0% de tareas completadas    → PENDIENTE
100% de tareas completadas  → COMPLETO
Cualquier otro %            → EN_CURSO
```

### Progress Calculation
```typescript
Objetivo:  (tareas.done / tareas.total) * 100
Proyecto:  Promedio ponderado por cantidad de tareas
```

## 🚀 Uso

### Acceso
```
http://localhost:3000/roadmap
```

### Proyectos Incluidos

**1. GROWS** (17 objetivos, ~150+ tareas)

**🧩 Core del Sistema** (5 objetivos)
- Autenticación y Organización (+ Modo Desarrollador)
- Backend Core y Lógica de Negocio
- API Routes Funcionales
- Catálogos y Base de Datos
- Pagos & Suscripciones

**🧠 UX/UI Frontend** (6 objetivos)
- Frontend - Interfaces Funcionales
- Panel de Socio (móvil)
- Gestión de Cuadrillas
- Wizard de Obras
- Configuración de Cuenta
- UI/UX y Componentes Globales

**🔄 Operativos** (4 objetivos)
- Comunicación & Coordinación Operativa
- Documentación Interna
- Testing & Documentación API
- Deploy & Beta Pública

**🧠 Futuros** (2 objetivos)
- BIM: Importación & 3D (opcional)
- Métricas & Rendimiento (nuevo)

**2. OTRO_MVP** (3 objetivos, plantilla)
- Definición de Alcance
- Implementación Core
- Validación & Lanzamiento

### Crear Nuevo Proyecto
1. Click en "+ Nuevo Proyecto"
2. Ingresar nombre
3. Empezar a agregar objetivos

### Import/Export
**Exportar**: Descarga JSON del proyecto actual
**Importar**: Sube JSON y reemplaza proyecto actual

### Resetear
Click en "Resetear" para volver al estado inicial del seed (requiere confirmación).

## 🔧 Extensiones Futuras

- [x] Agregar nuevos objetivos desde UI ✅
- [x] Editar objetivos inline ✅
- [ ] Asignar fechas límite (parcial)
- [ ] Notificaciones de vencimientos
- [x] Integración con backend ✅
- [ ] Colaboración en tiempo real
- [ ] Historial de cambios
- [ ] Filtros por categoría (Core, UX/UI, Operativos, Futuros)
- [ ] Vista Kanban por categoría
- [ ] Exportar roadmap a formato Gantt

## 📝 Notas Técnicas

- **No requiere backend**: 100% frontend con localStorage
- **No modifica configuraciones globales**: Módulo independiente
- **Compatible con Next.js 15**: Usa App Router y client components
- **Type-safe**: TypeScript completo con tipos exportados

## 🎯 Criterios de Aceptación

- [x] Cambiar entre proyectos sin errores
- [x] Marcar/desmarcar tareas actualiza progreso
- [x] Status se calcula automáticamente
- [x] Búsqueda y filtros funcionan correctamente
- [x] Ordenamiento funciona en todas las opciones
- [x] Export/Import preserva datos
- [x] Resetear restaura seed
- [x] Persistencia en localStorage funciona
- [x] UI responsive y accesible
- [x] Usa paleta del proyecto

---

**✅ Implementación completa y lista para usar**

