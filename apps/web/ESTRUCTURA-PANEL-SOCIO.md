# 📱 Panel de Socio - Estructura Actual y Rediseño Móvil

## 🎯 **RUTA DE ACCESO AL PANEL DE SOCIO**

### **URL Principal:**
```
/panel
```

### **Estructura de Archivos:**
```
apps/web/app/panel/page.tsx                    # Página principal
apps/web/components/panel/
├── Sidebar.tsx                                # Navegación lateral
├── TopBar.tsx                                 # Barra superior
├── PanelViewer.tsx                            # Contenedor de secciones
├── FooterPanel.tsx                            # Pie de página
└── sections/
    ├── TareasEnCurso.tsx                      # Tareas en progreso
    ├── Obras.tsx                              # Obras asignadas
    ├── MiCuadrilla.tsx                        # Gestión de cuadrilla
    ├── Notificaciones.tsx                     # Centro de notificaciones
    ├── Calendario.tsx                         # Calendario de tareas
    ├── Presupuesto.tsx                        # Gestión de presupuestos
    └── Cuenta.tsx                             # Configuración de cuenta
```

## 📱 **SECCIONES ACTUALES DEL PANEL**

### **Navegación Lateral (Sidebar):**
1. **✅ Tareas en curso** - Tareas activas del socio
2. **🏗️ Obras** - Obras asignadas
3. **👥 Mi cuadrilla** - Gestión de integrantes
4. **🔔 Notificaciones** - Centro de notificaciones
5. **📅 Calendario** - Cronograma de tareas
6. **💰 Presupuesto** - Gestión económica
7. **👤 Cuenta** - Configuración personal

### **Estado Actual del Usuario:**
```typescript
{
  name: 'Juan Pérez',
  avatar: '👷‍♂️',
  rating: 4.8,
  level: 'Oro'
}
```

## 🎨 **PROBLEMAS DE COHERENCIA ESTÉTICA IDENTIFICADOS**

### **❌ Colores Inconsistentes:**
- **Amarillo**: Botones "Ver checklist", "En evaluación"
- **Verde**: Botones "Iniciar", "Disponible"
- **Rojo**: Botones "Pausar", "Desconectado"
- **Marrón/Naranja**: Botones "Subir evidencia"
- **Azul**: Tags "Próxima"
- **Gris**: Botones "Descanso", "Cerrar"

### **❌ Falta de Coherencia Visual:**
- Múltiples paletas de colores sin sistema
- Botones con estilos diferentes
- Inconsistencia en estados y acciones
- No hay jerarquía visual clara

## 📱 **REDISEÑO PARA MÓVIL EXCLUSIVO**

### **🎯 Objetivos del Rediseño:**
1. **Sistema de colores unificado** - Una paleta coherente
2. **Diseño mobile-first** - Optimizado para pantallas pequeñas
3. **Navegación táctil** - Botones grandes y accesibles
4. **Jerarquía visual clara** - Estados y acciones bien definidos
5. **Experiencia fluida** - Transiciones y micro-interacciones

### **🎨 Paleta de Colores Propuesta:**
```css
/* Colores Principales */
--primary: #2563eb;        /* Azul principal */
--primary-dark: #1d4ed8;   /* Azul oscuro */
--secondary: #64748b;      /* Gris neutro */
--accent: #f59e0b;         /* Amarillo/dorado */

/* Estados */
--success: #10b981;        /* Verde para éxito */
--warning: #f59e0b;        /* Amarillo para advertencia */
--error: #ef4444;          /* Rojo para error */
--info: #3b82f6;           /* Azul para información */

/* Neutros */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
```

### **📱 Estructura Móvil Propuesta:**
```
┌─────────────────────────────────┐
│ TopBar (Fijo)                   │
│ - Avatar + Info usuario         │
│ - Estado conexión               │
│ - Notificaciones               │
├─────────────────────────────────┤
│ Contenido Principal             │
│ (Scrolleable)                   │
│                                 │
│ ┌─ Tareas Activas ───────────┐ │
│ │ [Tarea 1] [Estado] [Acción] │ │
│ │ [Tarea 2] [Estado] [Acción] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Oportunidades ─────────────┐ │
│ │ [Obra 1] [Estado] [Acción]   │ │
│ │ [Obra 2] [Estado] [Acción]   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Bottom Navigation (Fijo)        │
│ [🏠] [📋] [💰] [👤]            │
└─────────────────────────────────┘
```

## 🚀 **PRÓXIMOS PASOS PARA EL REDISEÑO**

### **1. Actualizar Sistema de Colores**
- Implementar paleta unificada
- Crear variables CSS consistentes
- Aplicar en todos los componentes

### **2. Rediseñar Layout Móvil**
- TopBar compacto y funcional
- Bottom navigation para secciones principales
- Cards optimizadas para touch
- Botones grandes y accesibles

### **3. Mejorar UX Móvil**
- Gestos táctiles intuitivos
- Estados visuales claros
- Feedback inmediato en acciones
- Navegación fluida entre secciones

### **4. Optimizar Componentes**
- TareasEnCurso → Cards táctiles
- Obras → Lista vertical optimizada
- MiCuadrilla → Gestión simplificada
- Notificaciones → Centro unificado

## 📍 **ARCHIVOS A MODIFICAR**

### **Prioridad Alta:**
1. `apps/web/app/panel/page.tsx` - Layout principal
2. `apps/web/components/panel/Sidebar.tsx` - Navegación
3. `apps/web/components/panel/TopBar.tsx` - Header
4. `apps/web/components/panel/sections/TareasEnCurso.tsx` - Sección principal

### **Prioridad Media:**
5. `apps/web/components/panel/sections/Obras.tsx`
6. `apps/web/components/panel/sections/MiCuadrilla.tsx`
7. `apps/web/components/panel/PanelViewer.tsx`

### **Prioridad Baja:**
8. Resto de secciones y componentes

**¿Empezamos con el rediseño del panel de socio para móvil con coherencia estética?** 📱✨
