# 🎨 GROWS Design System - Componentes Unificados

## 📋 Visión General

Este sistema de diseño unificado garantiza la coherencia visual en toda la plataforma GROWS, aplicando la identidad de marca consistente (azul petróleo + dorado elegante) y patrones de interacción uniformes.

## 🎨 Paleta de Colores

### Colores Principales
- **Azul Petróleo** (`#0C1D36`) - Color base principal
- **Dorado** (`#E8C547`) - Color de acento
- **Fondo** (`#F5F6F7`) - Fondo gris claro
- **Superficie** (`#FFFFFF`) - Superficie principal

### Estados Semánticos
- **Activa/Completada** → Dorado (`#E8C547`)
- **Pausada/Pendiente** → Dorado (`#E8C547`)
- **Finalizada** → Azul petróleo (`#0C1D36`)
- **Cancelada/Bloqueada** → Rojo apagado (`#A32A2A`)

## 🧩 Componentes Disponibles

### Card
Componente base para todas las tarjetas del sistema.

```tsx
<Card
  title="Título de la tarjeta"
  subtitle="Subtítulo descriptivo"
  status="activa"
  icon={<Building2 className="h-6 w-6" />}
  onClick={() => handleClick()}
>
  {/* Contenido de la tarjeta */}
</Card>
```

**Props:**
- `title?: string` - Título principal
- `subtitle?: string` - Subtítulo descriptivo
- `status?: string` - Estado visual (activa, pausada, etc.)
- `icon?: React.ReactNode` - Icono del header
- `footer?: React.ReactNode` - Contenido del footer
- `onClick?: () => void` - Función de click
- `children?: React.ReactNode` - Contenido principal

### Button
Botones con variantes coherentes.

```tsx
<Button variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
  Crear nuevo
</Button>
```

**Variantes:**
- `primary` - Fondo dorado, texto azul petróleo
- `secondary` - Borde dorado, fondo transparente
- `ghost` - Sin fondo, texto gris
- `danger` - Rojo apagado

### Badge
Badges para estados con colores semánticos.

```tsx
<Badge status="activa">Activa</Badge>
<Badge variant="success">Completada</Badge>
```

### EmptyState
Estado vacío consistente.

```tsx
<EmptyState
  title="No hay datos disponibles"
  description="Descripción del estado vacío"
  icon={<Building2 className="h-16 w-16" />}
  action={<Button variant="primary">Crear nuevo</Button>}
/>
```

### SectionLayout
Layout unificado para todas las secciones.

```tsx
<SectionLayout
  title="Gestión de Obras"
  subtitle="Administra todas las obras del proyecto"
>
  {/* Contenido de la sección */}
</SectionLayout>
```

## 🎯 Patrones de Uso

### Espaciado Unificado
- **Gap entre cards**: `gap-6`
- **Espaciado de secciones**: `space-y-6`
- **Margen superior**: `mt-10`
- **Padding interno**: `p-6`

### Tipografía Jerárquica
- **Títulos de sección**: `text-2xl font-semibold text-grows-primary`
- **Subtítulos**: `text-base text-grows-text-secondary`
- **Texto interno**: `text-sm text-grows-text-secondary`

### Microinteracciones
- **Transiciones**: `transition-all duration-200`
- **Hover en cards**: Elevación sutil (`hover:-translate-y-0.5`)
- **Animaciones de entrada**: `animate-fade-in`

## 🔧 Implementación

### Importación
```tsx
import { Card, Button, Badge, EmptyState, SectionLayout } from '@/components/ui/grows';
```

### Clases CSS Disponibles
```css
/* Colores */
bg-grows-primary, text-grows-primary
bg-grows-secondary, text-grows-secondary
bg-grows-background, bg-grows-surface
text-grows-text-primary, text-grows-text-secondary

/* Sombras */
shadow-grows-sm, shadow-grows-md, shadow-grows-lg

/* Radios */
rounded-grows-sm, rounded-grows-md, rounded-grows-lg

/* Animaciones */
animate-fade-in, animate-slide-in
```

## 📱 Responsive Design

Todos los componentes están optimizados para:
- **Mobile**: Layout de columna única
- **Tablet**: Grid de 2 columnas
- **Desktop**: Grid de 3+ columnas

## 🎨 Consistencia Visual

### Cards
- Fondo blanco con borde sutil
- Sombra suave que aumenta en hover
- Radio de esquinas consistente
- Padding interno uniforme

### Botones
- Altura mínima para accesibilidad
- Estados de hover y focus claros
- Iconos alineados correctamente

### Badges
- Tamaño fijo para consistencia
- Colores semánticos con transparencia
- Bordes suaves para elegancia

## 🚀 Beneficios

✅ **Coherencia Visual** - Todas las secciones comparten el mismo lenguaje visual
✅ **Mantenibilidad** - Cambios centralizados se propagan automáticamente
✅ **Accesibilidad** - Componentes optimizados para todos los usuarios
✅ **Performance** - Animaciones optimizadas y componentes ligeros
✅ **Escalabilidad** - Fácil agregar nuevos componentes siguiendo los patrones