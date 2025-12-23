# INFORME: DASHBOARD CLIENTE - RESPONSIVE MOBILE
**Fecha:** Diciembre 2024  
**Rol:** Frontend / UX Architect  
**Objetivo:** Hacer el dashboard cliente completamente usable en móvil, manteniendo funcionalidad en escritorio, inspirándose en la página de socio (mobile-first)

---

## 📊 ANÁLISIS DE SITUACIÓN ACTUAL

### Estructura Actual (Desktop)
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (220px fijo) │ Contenido principal (flex-1) │
│                      │                              │
│ - Home               │ - Header grande              │
│ - Obras              │ - Banner de estado           │
│ - Tareas             │ - Grid: Obras (3 cols)       │
│ - Cuadrillas         │ - Selector período           │
│ - Billetera          │ - Grid: Tareas + Presupuesto │
│ - Notificaciones     │ - Gráfico Actividad (full)   │
│ - Calendario         │ - Sidebar Actions (derecha)  │
│ - Cuenta             │                              │
└─────────────────────────────────────────────────────┘
```

### Problemas Identificados
1. **Sidebar fijo de 220px** - No funciona en móvil
2. **Layout de grid complejo** - `grid-cols-3`, `lg:grid-cols-[1fr_340px]`
3. **Gráficos grandes** - No adaptados a pantallas pequeñas
4. **Padding fijo** - `p-8` es demasiado grande en móvil
5. **Textos grandes** - `text-4xl`, `text-2xl` no escalan bien
6. **Cards de obras** - Grid de 3 columnas no legible en móvil
7. **Selector de período** - Layout horizontal no cabe
8. **Gráfico de presupuesto** - Doble ancho (`col-span-2`) no cabe
9. **No hay detección de dispositivo** - Mismo layout para todos

---

## 🎯 INSPIRACIÓN: PÁGINA SOCIO (Mobile-First)

### Características Clave
- ✅ Layout vertical simple (`min-h-screen bg-[#F7F7F7] pb-20`)
- ✅ Padding reducido en móvil (`p-4 pt-6`)
- ✅ Sin sidebar lateral en móvil (usa TabBar inferior)
- ✅ Contenido apilado verticalmente
- ✅ Cards grandes y táctiles (mín. 44x44px touch target)
- ✅ Textos más pequeños (`text-xl` vs `text-4xl`)
- ✅ Scroll vertical natural

---

## 🔧 CAMBIOS PROPUESTOS

### 1. DETECCIÓN DE DISPOSITIVO

#### 1.1 Crear Hook Personalizado: `useMediaQuery`

**Ubicación:** `lib/hooks/useMediaQuery.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

#### 1.2 Crear Hook: `useDeviceType`

**Ubicación:** `lib/hooks/useDeviceType.ts`

```typescript
'use client';

import { useMediaQuery } from './useMediaQuery';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}
```

#### 1.3 Breakpoints Definidos
- **Mobile:** `max-width: 768px` (< 768px)
- **Tablet:** `769px - 1024px`
- **Desktop:** `min-width: 1025px` (> 1024px)

---

### 2. CAMBIOS EN SIDEBAR Y NAVEGACIÓN

#### 2.1 Sidebar Desktop (Mantener)
- Mantener sidebar lateral fijo solo en desktop (`>= 1024px`)
- Expandible al hover (comportamiento actual)

#### 2.2 Navegación Mobile (Nuevo)
- **Ocultar sidebar** en móvil (`< 768px`)
- **TabBar inferior fijo** (similar a socio)
- TabBar con iconos grandes (44x44px mínimo)
- 5-6 items principales: Home, Obras, Tareas, Billetera, Notificaciones
- Badge de notificaciones no leídas

**Componente:** `components/cliente/TabBarMobile.tsx` (crear)

#### 2.3 Header Mobile (Nuevo)
- Header simple en la parte superior
- Botón hamburguesa para menú lateral deslizable (opcional)
- Título: "Dashboard" o nombre de obra seleccionada
- Badge de notificaciones

---

### 3. CAMBIOS EN LAYOUT PRINCIPAL

#### 3.1 Container Principal

**Antes:**
```tsx
<div className="ml-[220px] flex-1 p-8">{renderSection()}</div>
```

**Después:**
```tsx
<div className={`
  flex-1 
  ${isMobile ? 'ml-0 p-4' : 'ml-[220px] p-8'}
  ${isTablet ? 'ml-0 p-6' : ''}
`}>
  {renderSection()}
</div>
```

#### 3.2 Padding Responsive
- **Mobile:** `p-4` (16px)
- **Tablet:** `p-6` (24px)
- **Desktop:** `p-8` (32px)

---

### 4. CAMBIOS EN HEADER Y BANNER

#### 4.1 Header Principal

**Antes:**
```tsx
<div className="bg-blue-50/30 rounded-xl p-8 mb-6">
  <h1 className="text-4xl font-semibold">Bienvenido a Grows</h1>
  <p className="text-base">Desde acá gestionás...</p>
</div>
```

**Después:**
```tsx
<div className={`
  bg-blue-50/30 rounded-xl mb-6 border border-blue-100/50
  ${isMobile ? 'p-4' : 'p-8'}
`}>
  <h1 className={`
    font-semibold text-gray-900 mb-2 tracking-tight
    ${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-4xl'}
  `}>
    Bienvenido a Grows
  </h1>
  <p className={`
    text-gray-700 font-normal
    ${isMobile ? 'text-sm' : 'text-base'}
  `}>
    Desde acá gestionás tus obras, tareas y presupuesto
  </p>
</div>
```

#### 4.2 Banner de Estado

**Antes:**
```tsx
<div className="bg-emerald-50/60 border-l-2 border-emerald-400/60 pl-4 py-2.5">
  <p className="text-sm">Todo está bajo control...</p>
</div>
```

**Después:**
```tsx
<div className={`
  bg-emerald-50/60 border-l-2 border-emerald-400/60 rounded-r-lg
  ${isMobile ? 'pl-3 py-2' : 'pl-4 py-2.5'}
`}>
  <p className={`
    font-normal text-gray-700
    ${isMobile ? 'text-xs' : 'text-sm'}
  `}>
    Todo está bajo control · Última actividad hace 3 días
  </p>
</div>
```

---

### 5. CAMBIOS EN CARDS DE OBRAS

#### 5.1 Grid Responsive

**Antes:**
```tsx
<div className="grid grid-cols-3 gap-3">
```

**Después:**
```tsx
<div className={`
  grid gap-3
  ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}
`}>
```

#### 5.2 Cards de Obra - Tamaño Mínimo Touch

**Cambios:**
- Aumentar padding en móvil: `p-4` → `p-5` (mobile)
- Aumentar altura mínima: `min-h-[80px]` (mobile)
- Texto más legible: `text-xs` → `text-sm` (mobile)
- Botones más grandes para touch

---

### 6. CAMBIOS EN SELECTOR DE PERÍODO

#### 6.1 Layout Responsive

**Antes:**
```tsx
<div className="flex items-center justify-between">
  <div>
    <h4>Período de análisis</h4>
    <p>Afecta todos los gráficos...</p>
  </div>
  <PeriodSelector ... />
</div>
```

**Después:**
```tsx
<div className={`
  ${isMobile ? 'flex-col gap-3' : 'flex items-center justify-between'}
`}>
  <div className={isMobile ? 'w-full' : ''}>
    <h4 className={isMobile ? 'text-xs' : 'text-xs'}>Período de análisis</h4>
    <p className={isMobile ? 'text-[10px] mt-0.5' : 'text-xs'}>
      Afecta todos los gráficos del dashboard
    </p>
  </div>
  <PeriodSelector 
    className={isMobile ? 'w-full' : ''}
    size={isMobile ? 'small' : 'normal'}
    ... 
  />
</div>
```

#### 6.2 PeriodSelector - Modo Compacto

**Agregar prop `size`:**
- `small`: Botones más pequeños, texto `text-[10px]`
- `normal`: Tamaño actual

---

### 7. CAMBIOS EN GRÁFICO DE TAREAS (Donut)

#### 7.1 Layout Responsive

**Antes:**
```tsx
<div className="flex items-start gap-6">
  <div className="relative flex-shrink-0">
    {/* Donut 128x128 */}
  </div>
  <div className="flex-1">
    {/* Panel lateral */}
  </div>
</div>
```

**Después:**
```tsx
<div className={`
  ${isMobile ? 'flex-col items-center gap-4' : 'flex items-start gap-6'}
`}>
  <div className={`
    relative flex-shrink-0
    ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}
  `}>
    {/* Donut responsive */}
  </div>
  <div className={`
    ${isMobile ? 'w-full' : 'flex-1'}
  `}>
    {/* Panel lateral - full width en mobile */}
  </div>
</div>
```

#### 7.2 Donut SVG - Escalado

**Cambios:**
- ViewBox mantener `128x128`
- Width/Height dinámicos según breakpoint
- Texto central ajustado: `text-lg` (mobile) vs `text-xl` (desktop)

---

### 8. CAMBIOS EN GRÁFICO DE PRESUPUESTO

#### 8.1 Grid Responsive

**Antes:**
```tsx
<div className="grid grid-cols-3 gap-5">
  <div className="col-span-1">{/* Tareas */}</div>
  <div className="col-span-2">{/* Presupuesto */}</div>
</div>
```

**Después:**
```tsx
<div className={`
  grid gap-5
  ${isMobile 
    ? 'grid-cols-1' 
    : isTablet 
      ? 'grid-cols-1' 
      : 'grid-cols-3'
  }
`}>
  <div className={`
    ${isMobile ? 'col-span-1' : isTablet ? 'col-span-1' : 'col-span-1'}
  `}>
    {/* Tareas */}
  </div>
  <div className={`
    ${isMobile ? 'col-span-1' : isTablet ? 'col-span-1' : 'col-span-2'}
  `}>
    {/* Presupuesto */}
  </div>
</div>
```

#### 8.2 Gráfico de Barras - Ajustes Mobile

**Cambios:**
- Alto máximo: `h-32` (mobile) vs `h-40` (desktop)
- Padding reducido: `px-2` (mobile) vs `px-4` (desktop)
- Barras más finas: `barSize={12}` (mobile) vs `barSize={16}` (desktop)
- Scroll horizontal en chart area si necesario
- Tooltips más pequeños: `text-xs` (mobile)

---

### 9. CAMBIOS EN GRÁFICO DE ACTIVIDAD

#### 9.1 Container Responsive

**Antes:**
```tsx
<div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm w-full">
```

**Después:**
```tsx
<div className={`
  bg-white rounded-2xl border border-gray-200 shadow-sm w-full
  ${isMobile ? 'p-4' : 'p-6'}
`}>
```

#### 9.2 Header del Gráfico

**Antes:**
```tsx
<div className="flex items-center justify-between mb-4">
  <div>
    <h3>Actividad de la obra</h3>
    <p>Evolución del avance...</p>
  </div>
  <div className="flex items-center gap-4">
    {/* Indicador + Badge */}
  </div>
</div>
```

**Después:**
```tsx
<div className={`
  ${isMobile ? 'flex-col gap-3 mb-3' : 'flex items-center justify-between mb-4'}
`}>
  <div className={isMobile ? 'w-full' : ''}>
    <h3 className={isMobile ? 'text-xs' : 'text-sm'}>Actividad de la obra</h3>
    <p className={isMobile ? 'text-[10px] mt-0.5' : 'text-xs mt-0.5'}>
      Evolución del avance real vs planificado
    </p>
  </div>
  <div className={`
    ${isMobile ? 'w-full flex justify-between items-start' : 'flex items-center gap-4'}
  `}>
    {/* Indicador + Badge apilados en mobile */}
  </div>
</div>
```

#### 9.3 SVG del Gráfico - Escalado

**Cambios:**
- ViewBox mantener proporción
- Altura: `h-48` (mobile) vs `h-64` (desktop)
- Padding interno reducido
- Ticks del eje X menos frecuentes (cada 4 semanas en mobile)
- Texto de ejes más pequeño: `text-[8px]` (mobile)

---

### 10. CAMBIOS EN SIDEBAR ACTIONS

#### 10.1 Layout Responsive

**Antes:**
```tsx
<div className="lg:sticky lg:top-8 h-fit space-y-3">
  <SidebarActions ... />
</div>
```

**Después:**
```tsx
{!isMobile && (
  <div className="lg:sticky lg:top-8 h-fit space-y-3">
    <SidebarActions ... />
  </div>
)}
```

#### 10.2 Actions en Mobile (Nuevo)
- Mostrar como cards apiladas al final del contenido
- O en un menú deslizable desde abajo
- O integrar en TabBar inferior

---

### 11. CAMBIOS EN PERIODSELECTOR

#### 11.1 Botones Responsive

**Cambios en componente:**
```tsx
// Agregar prop size
interface PeriodSelectorProps {
  size?: 'small' | 'normal';
  // ... otros props
}

// Uso:
<button
  className={`
    rounded-md transition-colors font-medium
    ${size === 'small' 
      ? 'px-2 py-1 text-[10px]' 
      : 'px-3 py-1.5 text-xs'
    }
  `}
>
```

#### 11.2 Layout Mobile
- Botones más pequeños
- Gap reducido: `gap-1` (mobile) vs `gap-1` (desktop)
- Pills más compactas

---

### 12. CAMBIOS EN TOOLTIPS

#### 12.1 Tooltips Responsive

**Cambios:**
- En mobile, tooltips más pequeños: `text-[10px]`
- Posicionamiento ajustado (evitar cortes en bordes)
- Z-index alto: `z-50`
- Padding reducido: `px-2 py-1` (mobile)

---

### 13. CAMBIOS EN BADGES Y TEXTOS

#### 13.1 Textos Responsive

**Sistema de tamaños:**
- Mobile:
  - Títulos: `text-xs` / `text-sm`
  - Subtítulos: `text-[10px]`
  - Badges: `text-[10px]`
- Desktop:
  - Títulos: `text-sm` / `text-base`
  - Subtítulos: `text-xs`
  - Badges: `text-xs`

---

### 14. CAMBIOS EN SPACING Y GAPS

#### 14.1 Espaciado Responsive

**Gaps:**
- Mobile: `gap-3` / `gap-4`
- Tablet: `gap-4` / `gap-5`
- Desktop: `gap-5` / `gap-6`

**Márgenes:**
- Mobile: `mb-4` / `mb-5`
- Desktop: `mb-6` / `mb-8`

---

### 15. COMPONENTE TABBAR MOBILE (NUEVO)

**Ubicación:** `components/cliente/TabBarMobile.tsx`

**Características:**
- Fijo en la parte inferior (`fixed bottom-0`)
- Altura: `h-16` (64px)
- Fondo: Blanco con sombra superior
- Grid de 5 items: Home, Obras, Tareas, Billetera, Notificaciones
- Iconos: 24x24px
- Texto: `text-[10px]` debajo de iconos
- Badge de notificaciones en icono
- Touch target mínimo: 44x44px

**Implementación:**
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Home, Building2, ClipboardList, Wallet, Bell } from 'lucide-react';
import { useDeviceType } from '@/lib/hooks/useDeviceType';

export function TabBarMobile({ activeSection }: { activeSection: string }) {
  const router = useRouter();
  const deviceType = useDeviceType();
  
  if (deviceType !== 'mobile') return null;

  const items = [
    { id: 'home', label: 'Home', icon: Home, href: '/cliente/dashboard' },
    { id: 'obras', label: 'Obras', icon: Building2, href: '/cliente/dashboard?section=obras' },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList, href: '/cliente/dashboard?section=tareas' },
    { id: 'billetera', label: 'Billetera', icon: Wallet, href: '/cliente/dashboard?section=billetera' },
    { id: 'notificaciones', label: 'Notif.', icon: Bell, href: '/cliente/dashboard?section=notificaciones' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] z-50">
      <div className="grid grid-cols-5 h-full">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-colors
                ${isActive ? 'text-blue-600' : 'text-gray-500'}
              `}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 16. CAMBIOS EN COMPONENTE PRINCIPAL

#### 16.1 DashboardFinal - Agregar Device Detection

```tsx
function DashboardFinal({ mockData, formatCurrency, router, handleCrearObra, handleCrearTarea }: any) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  
  // ... resto del código con clases condicionales
}
```

#### 16.2 ClienteDashboardPage - Integrar TabBar

```tsx
export default function ClienteDashboardPage() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  
  return (
    <div className="flex min-h-screen bg-secundario">
      {/* Sidebar solo en desktop */}
      {!isMobile && (
        <SidebarClienteTecnico
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}

      <div className={`
        flex-1
        ${isMobile ? 'ml-0 p-4 pb-20' : 'ml-[220px] p-8'}
      `}>
        {renderSection()}
      </div>

      {/* TabBar solo en mobile */}
      <TabBarMobile activeSection={activeSection} />
    </div>
  );
}
```

---

## 📱 ORDEN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura
1. ✅ Crear `lib/hooks/useMediaQuery.ts`
2. ✅ Crear `lib/hooks/useDeviceType.ts`
3. ✅ Crear `components/cliente/TabBarMobile.tsx`

### Fase 2: Layout Principal
4. ✅ Modificar `ClienteDashboardPage` para usar device detection
5. ✅ Ocultar sidebar en mobile
6. ✅ Integrar TabBar mobile
7. ✅ Ajustar padding y márgenes

### Fase 3: Componentes Principales
8. ✅ Modificar header y banner (tamaños de texto)
9. ✅ Ajustar cards de obras (grid responsive)
10. ✅ Modificar selector de período (layout vertical en mobile)

### Fase 4: Gráficos
11. ✅ Gráfico de Tareas (Donut) - layout vertical en mobile
12. ✅ Gráfico de Presupuesto - full width en mobile
13. ✅ Gráfico de Actividad - ajustes de tamaño y texto

### Fase 5: Detalles
14. ✅ Ajustar tooltips (tamaños y posicionamiento)
15. ✅ Ajustar badges y textos pequeños
16. ✅ Ajustar spacing y gaps
17. ✅ Testing en diferentes dispositivos

---

## 🧪 TESTING

### Dispositivos a Probar
- **Mobile:**
  - iPhone SE (375px)
  - iPhone 12/13 (390px)
  - iPhone 14 Pro Max (430px)
  - Android pequeño (360px)
  - Android grande (412px)

- **Tablet:**
  - iPad Mini (768px)
  - iPad (820px)
  - iPad Pro (1024px)

- **Desktop:**
  - 1280px
  - 1440px
  - 1920px

### Verificaciones
- ✅ Todo el contenido es accesible (sin scroll horizontal)
- ✅ Touch targets mínimo 44x44px
- ✅ Textos legibles sin zoom
- ✅ Gráficos se ven completos
- ✅ Navegación funcional
- ✅ Tooltips no se cortan
- ✅ No hay overlap de elementos

---

## 📝 NOTAS ADICIONALES

### Consideraciones de Performance
- Usar `useMemo` para cálculos costosos en gráficos
- Lazy load de gráficos si es necesario
- Optimizar renders condicionales

### Accesibilidad
- Mantener contraste suficiente en todos los tamaños
- Asegurar navegación por teclado
- Labels descriptivos en botones

### Consistencia
- Mantener paleta de colores en todos los breakpoints
- Mantener espaciado proporcional
- Mantener jerarquía visual clara

---

## ✅ CHECKLIST FINAL

- [ ] Hooks de device detection creados
- [ ] TabBar mobile creado
- [ ] Sidebar oculto en mobile
- [ ] Layout principal responsive
- [ ] Header y banner responsive
- [ ] Cards de obras responsive
- [ ] Selector de período responsive
- [ ] Gráfico de Tareas responsive
- [ ] Gráfico de Presupuesto responsive
- [ ] Gráfico de Actividad responsive
- [ ] Sidebar actions oculto en mobile
- [ ] Tooltips ajustados
- [ ] Badges y textos ajustados
- [ ] Spacing consistente
- [ ] Testing completado
- [ ] Sin errores de consola
- [ ] Performance optimizado

---

**Fin del Informe**

