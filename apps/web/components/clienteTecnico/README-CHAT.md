# ChatSection - Estilo Gemini con Branding GROWS

## 🎯 Descripción

Componente de chat que reproduce fielmente el estilo de Gemini (Google) con branding GROWS. Diseño centrado, sutil y minimalista con paleta de colores azul petróleo y dorado.

## 🎨 Características Visuales

### Fondo y Layout
- **Fondo**: `bg-white` limpio sin cards ni sombras
- **Centrado**: Contenido completamente centrado vertical y horizontalmente
- **Ancho máximo**: 750px para la columna de foco
- **Estética**: Muy sutil, sin bordes visibles, mucho aire blanco

### Saludo Inicial (Estado Vacío) - Estilo Gemini Exacto
```tsx
// Centrado vertical y horizontalmente como Gemini
<div className="flex items-center justify-center min-h-screen px-6">
  <div className="text-center animate-fade-in">
    {/* Saludo principal centrado */}
    <h1 className="text-4xl md:text-5xl font-semibold text-[#0C1D36] mb-8">
      Hola, {userName}
    </h1>
  </div>
</div>
```

### Mensajes
- **Usuario**: Alineado a la derecha, `bg-[#0C1D36] text-white`
- **Bot**: Alineado a la izquierda, `bg-[#F7F8FA] text-[#0C1D36] border border-gray-100`
- **Ícono Bot**: Círculo dorado con "G" animado
- **Animaciones**: `animate-fade-in` en cada mensaje

### Input Inferior - Comportamiento Dual
- **Estado vacío**: `absolute bottom-12` centrado como Gemini
- **Durante conversación**: `fixed bottom-12` fijo en la parte inferior
- **Estilo**: `rounded-full border border-gray-200 shadow-sm`
- **Placeholder**: "Pregunta a GrowsBot" (vacío) / "Escribí tu mensaje..." (conversación)
- **Botón**: `bg-[#0C1D36] text-white` con hover `bg-[#132a52]`

## 🚀 Uso

### Básico
```tsx
import { ChatSection } from '@/components/clienteTecnico/ChatSection';

export default function MiChat() {
  return (
    <div className="min-h-screen bg-white">
      <ChatSection userName="Carlos Pérez" />
    </div>
  );
}
```

### Con Demo
```tsx
import { ChatDemo } from '@/components/ui/grows/ChatDemo';

export default function ChatDemoPage() {
  return <ChatDemo />;
}
```

## 🎭 Interacciones

### Auto-scroll
- Scroll automático al último mensaje con `scrollIntoView({ behavior: 'smooth' })`

### Indicador de Escritura
- Tres puntos parpadeando con `animate-pulse`
- Color dorado `text-[#E8C547]`
- Delay variable entre respuestas (1.5-2.5 segundos)

### Respuestas del Bot
- Respuestas contextuales sobre construcción
- Simulación de delay realista
- Variedad en las respuestas

## 📱 Responsive

### Móviles (< 768px)
- Contenedor: `max-w-[90%]`
- Margen superior: `pt-12` (menor)
- Input: `max-w-[95%]`

### Desktop
- Contenedor: `max-w-[750px]`
- Margen superior: `pt-12`
- Input: `max-w-[750px]`

## 🎨 Paleta de Colores GROWS

```css
/* Colores principales */
--grows-primary: #0C1D36;    /* Azul petróleo */
--grows-secondary: #E8C547;   /* Dorado */
--grows-background: #F5F6F7;  /* Fondo gris claro */
--grows-surface: #FFFFFF;     /* Superficie principal */

/* Colores de mensajes */
--user-message: #0C1D36;      /* Fondo azul petróleo */
--bot-message: #F7F8FA;       /* Fondo gris muy claro */
--bot-border: #E5E7EB;        /* Borde sutil */
```

## 🔧 Props

```tsx
interface ChatSectionProps {
  userName?: string; // Nombre del usuario (default: 'Usuario')
}
```

## 📋 Características Técnicas

- ✅ **Estado vacío**: Saludo centrado con animación fade-in
- ✅ **Mensajes**: Estructura diferenciada usuario/bot
- ✅ **Auto-scroll**: Scroll suave al último mensaje
- ✅ **Indicador de escritura**: Animación de puntos parpadeando
- ✅ **Responsive**: Adaptado para móviles y desktop
- ✅ **Accesibilidad**: Focus automático en input
- ✅ **Animaciones**: Fade-in sutiles en todos los elementos
- ✅ **Branding**: Colores GROWS consistentes

## 🎯 Objetivo Cumplido

Reproduce la sensación exacta de Gemini:
- ✅ Todo centrado y aireado
- ✅ Paleta minimalista blanco + azul petróleo + detalles dorados
- ✅ Sin recuadros, sin tarjetas, sin bloques pesados
- ✅ Tipografía moderna y espaciosa (Rubik)
- ✅ Input centrado con sombra ligera
- ✅ Ícono dorado distintivo de GrowsBot animado

## 📁 Archivos Relacionados

- `apps/web/components/clienteTecnico/ChatSection.tsx` - Componente principal
- `apps/web/components/ui/grows/ChatDemo.tsx` - Componente de demostración
- `apps/web/app/chat/page.tsx` - Página de ejemplo
- `apps/web/app/chat-demo/page.tsx` - Página de demostración
