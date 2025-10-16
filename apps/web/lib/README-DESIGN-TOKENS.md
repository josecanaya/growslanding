# 🎨 GROWS Design System - Design Tokens

## 📋 **Resumen**

Se ha implementado un sistema de design tokens centralizado para GROWS con una **paleta verde-neutral profesional**, eliminando completamente el amarillo dorado y estableciendo una identidad visual coherente.

---

## 🎯 **Nueva Paleta de Colores**

### **Colores Principales**
```css
--grows-primary: #1B5E20      /* Verde oscuro corporativo */
--grows-secondary: #9CCC65    /* Verde claro acento */
--grows-background: #F5F7F5   /* Fondo gris verdoso suave */
--grows-surface: #FFFFFF      /* Superficie principal */
--grows-border: #E0E0E0       /* Líneas y separadores */
```

### **Colores de Texto**
```css
--grows-text-primary: #1A1A1A   /* Texto principal */
--grows-text-secondary: #444444 /* Texto secundario */
```

### **Colores Semánticos**
```css
--grows-error: #D32F2F        /* Error */
--grows-success: #388E3C      /* Éxito */
--grows-warning: #FBC02D      /* Advertencia puntual */
--grows-neutral: #F0F2F0      /* Neutral base */
```

---

## 🛠️ **Cómo Usar los Design Tokens**

### **1. Importar los Tokens**
```typescript
import { colors, radii, shadows, spacing, typography } from '@/lib/design-tokens';
```

### **2. Usar en Tailwind CSS**
```tsx
// Colores
<div className="bg-grows-primary text-grows-surface">
<div className="bg-grows-surface text-grows-text-primary border-grows-border">

// Sombras
<div className="shadow-grows-md">

// Bordes
<div className="rounded-grows-lg">

// Espaciado
<div className="p-grows-md m-grows-lg">
```

### **3. Usar Variables CSS Directas**
```css
.custom-component {
  background-color: var(--grows-primary);
  color: var(--grows-surface);
  border-radius: var(--grows-border-radius-lg);
  box-shadow: var(--grows-shadow-md);
}
```

### **4. Usar en JavaScript/TypeScript**
```typescript
import { colors } from '@/lib/design-tokens';

const primaryColor = colors.primary; // '#1B5E20'
const surfaceColor = colors.surface; // '#FFFFFF'
```

---

## 📐 **Sistema de Espaciado**

```css
--grows-spacing-xs: 0.25rem   /* 4px */
--grows-spacing-sm: 0.5rem    /* 8px */
--grows-spacing-md: 1rem      /* 16px */
--grows-spacing-lg: 1.5rem    /* 24px */
--grows-spacing-xl: 2rem      /* 32px */
```

### **Clases de Espaciado**
```tsx
<p className="p-grows-xs">Padding extra pequeño</p>
<div className="m-grows-lg">Margin grande</div>
<div className="gap-grows-md">Gap medio en flex/grid</div>
```

---

## 🎭 **Sistema de Sombras**

```css
--grows-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--grows-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
--grows-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15)
--grows-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2)
```

### **Clases de Sombras**
```tsx
<div className="shadow-grows-sm">Sombra pequeña</div>
<div className="shadow-grows-md">Sombra media</div>
<div className="shadow-grows-lg">Sombra grande</div>
```

---

## 🔤 **Tipografía**

```css
--grows-font-family: 'Inter, Rubik, sans-serif'
```

### **Tamaños de Fuente**
```css
--grows-font-size-sm: 0.875rem    /* 14px */
--grows-font-size-base: 1rem      /* 16px */
--grows-font-size-lg: 1.125rem    /* 18px */
--grows-font-size-xl: 1.25rem     /* 20px */
--grows-font-size-2xl: 1.5rem     /* 24px */
--grows-font-size-3xl: 1.875rem   /* 30px */
```

### **Pesos de Fuente**
```css
--grows-font-weight-normal: 400
--grows-font-weight-medium: 500
--grows-font-weight-semibold: 600
--grows-font-weight-bold: 700
```

---

## 🎨 **Bordes Redondeados**

```css
--grows-radius-sm: 0.25rem    /* 4px */
--grows-radius-md: 0.5rem     /* 8px */
--grows-radius-lg: 1rem       /* 16px */
--grows-radius-xl: 1.5rem     /* 24px */
--grows-radius-full: 9999px   /* Completo */
```

### **Clases de Bordes**
```tsx
<div className="rounded-grows-sm">Borde pequeño</div>
<div className="rounded-grows-md">Borde medio</div>
<div className="rounded-grows-lg">Borde grande</div>
```

---

## 🎯 **Clases de Utilidad GROWS**

### **Colores de Fondo**
- `.bg-grows-primary`
- `.bg-grows-secondary`
- `.bg-grows-background`
- `.bg-grows-surface`
- `.bg-grows-neutral`
- `.bg-grows-error`
- `.bg-grows-success`
- `.bg-grows-warning`

### **Colores de Texto**
- `.text-grows-primary`
- `.text-grows-secondary`
- `.text-grows-text-primary`
- `.text-grows-text-secondary`
- `.text-grows-error`
- `.text-grows-success`
- `.text-grows-warning`

### **Bordes**
- `.border-grows-primary`
- `.border-grows-secondary`
- `.border-grows-border`

### **Sombras**
- `.shadow-grows-sm`
- `.shadow-grows-md`
- `.shadow-grows-lg`
- `.shadow-grows-xl`

### **Hover Effects**
- `.hover-grows-primary:hover`
- `.hover-grows-secondary:hover`
- `.hover-grows-shadow:hover`

---

## 📱 **Ejemplos de Uso**

### **Card Component**
```tsx
<div className="bg-grows-surface border border-grows-border rounded-grows-lg shadow-grows-md p-grows-lg">
  <h3 className="text-grows-text-primary font-semibold">Título</h3>
  <p className="text-grows-text-secondary">Contenido de la card</p>
  <button className="bg-grows-primary text-grows-surface hover-grows-primary px-grows-md py-grows-sm rounded-grows-md">
    Acción
  </button>
</div>
```

### **Sidebar Component**
```tsx
<aside className="bg-grows-primary text-grows-surface">
  <nav className="p-grows-lg">
    <ul className="space-y-grows-sm">
      <li className="bg-grows-secondary text-grows-primary rounded-grows-md p-grows-sm">
        Item activo
      </li>
    </ul>
  </nav>
</aside>
```

### **Form Component**
```tsx
<form className="bg-grows-surface border border-grows-border rounded-grows-lg p-grows-lg">
  <label className="text-grows-text-primary font-medium">Campo</label>
  <input 
    className="border border-grows-border rounded-grows-md p-grows-sm mt-grows-xs focus:border-grows-primary"
    type="text"
  />
  <button 
    type="submit"
    className="bg-grows-success text-grows-surface hover-grows-secondary px-grows-lg py-grows-sm rounded-grows-md mt-grows-md"
  >
    Enviar
  </button>
</form>
```

---

## 🔄 **Migración desde Colores Legacy**

### **Antes (Legacy)**
```tsx
<div className="bg-primario text-acento border-claro">
```

### **Después (GROWS)**
```tsx
<div className="bg-grows-primary text-grows-secondary border-grows-border">
```

### **Mapeo de Colores**
| Legacy | GROWS | Hex |
|--------|-------|-----|
| `bg-primario` | `bg-grows-primary` | `#1B5E20` |
| `text-acento` | `text-grows-secondary` | `#9CCC65` |
| `border-claro` | `border-grows-border` | `#E0E0E0` |
| `bg-acento` | `bg-grows-secondary` | `#9CCC65` |

---

## ✅ **Beneficios del Nuevo Sistema**

1. **Consistencia Visual**: Paleta unificada en toda la aplicación
2. **Mantenibilidad**: Cambios centralizados en un solo lugar
3. **Escalabilidad**: Fácil agregar nuevos tokens
4. **Profesionalismo**: Paleta verde-neutral más corporativa
5. **Accesibilidad**: Mejor contraste y legibilidad
6. **Developer Experience**: Sintaxis clara y predecible

---

## 🚀 **Próximos Pasos**

1. **Migrar componentes** existentes a usar clases `grows-*`
2. **Crear componentes base** con el nuevo sistema
3. **Documentar patrones** de uso en Storybook
4. **Implementar modo oscuro** con tokens GROWS
5. **Optimizar rendimiento** de CSS

---

Este sistema de design tokens establece una base sólida para la identidad visual de GROWS, proporcionando consistencia, mantenibilidad y una experiencia de desarrollo mejorada.
