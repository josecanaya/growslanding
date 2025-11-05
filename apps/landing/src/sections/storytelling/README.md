# StorytellingFlow Component

## Descripción
Componente de storytelling interactivo que muestra el flujo completo de GROWS a través de 6 etapas, combinando texto técnico, narrativa y imágenes en una experiencia inmersiva.

## Características

### 🎨 Diseño
- **Fondo**: Negro absoluto (`bg-black`)
- **Colores**: Dorado claro (`#F9D65C`) y gris suave (`#D6D6D6`)
- **Layout**: Responsivo con grid 2 columnas en desktop, stacked en móvil
- **Scroll**: Snap vertical con transiciones suaves

### 🖼️ Imágenes
Utiliza las siguientes imágenes desde `/public/images/`:
- `1Carga.png` - Inicio del proyecto
- `2Datos.png` - Definición técnica y base de datos
- `3coneccion.png` - Conexión del equipo
- `4ejecucion.png` - Ejecución en obra
- `5metricas.png` - Control y análisis en tiempo real
- `6final.png` - La obra se completa

### ✨ Animaciones
- **Framer Motion**: Fade in + scale up para cada etapa
- **Scroll Snap**: Transiciones suaves entre secciones
- **Hover Effects**: Escalado y efectos glow dorados
- **Viewport Detection**: Animaciones activadas al entrar en vista

### 📱 Responsividad
- **Móvil**: Imágenes full-width con texto debajo
- **Desktop**: Grid 2 columnas (imagen izquierda, texto derecha)
- **Tablet**: Adaptación automática del layout

## Estructura de Datos

Cada etapa contiene:
```typescript
{
  id: number,
  image: string,
  title: string,
  action: string,    // Acción del usuario
  response: string,  // Respuesta del sistema
  result: string    // Resultado final
}
```

## Uso

### Importación
```tsx
import { StorytellingFlow } from "../../sections/storytelling/StorytellingFlow";
```

### Implementación
```tsx
<StorytellingFlow />
```

### Integración en página
```tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <SolutionsSection />
        <HowItWorksSection />
        <UserProfiles />
        <StorytellingFlow />  {/* ← Aquí se integra */}
        <EcosystemSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
```

## Footer CTA

El componente incluye un footer con:
- **Mensaje**: "De la planificación a la realidad: GROWS transforma datos en construcción."
- **Botón**: "Probar GROWS" que enlaza a `#registro`
- **Estilo**: Fondo dorado tenue con efectos glow

## Dependencias

- `framer-motion`: Para animaciones
- `next/image`: Para optimización de imágenes
- `lucide-react`: Para iconos (ArrowRight)

## Personalización

### Cambiar colores
```tsx
// En el componente, modificar las clases Tailwind:
text-yellow-400  // Color dorado principal
text-gray-300    // Color gris suave
bg-yellow-400    // Fondo dorado para botones
```

### Modificar contenido
Editar el array `stages` en el componente para cambiar:
- Títulos de las etapas
- Textos de acción, respuesta y resultado
- Rutas de las imágenes

### Ajustar animaciones
```tsx
// Modificar las propiedades de motion:
initial={{ opacity: 0, y: 50 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: "easeOut" }}
```

## Notas Técnicas

- **Scroll Snap**: Requiere `snap-y snap-mandatory` en el contenedor
- **Viewport**: Usa `viewport={{ once: true }}` para animaciones únicas
- **Performance**: Imágenes con `priority={index < 2}` para las primeras 2 etapas
- **Accesibilidad**: Alt texts descriptivos para todas las imágenes
