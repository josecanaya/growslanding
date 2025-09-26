# Componente ImagenFaseObra

Este componente muestra dinámicamente la imagen de fondo según la fase actual de la obra, manteniendo los íconos de subcategorías fijos.

## Características

- **Cambio dinámico**: Solo la imagen de fondo cambia según la fase
- **Íconos fijos**: Los íconos de subcategorías (R, M, H, PL, EL, etc.) no cambian
- **Fallback inteligente**: Si no existe la imagen específica, usa "Obra gris.png"
- **Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Optimizado**: Usa Next.js Image para mejor rendimiento

## Mapeo de Fases

| Fase | Imagen |
|------|---------|
| estructura | Estructura.png |
| obra_gris | Obra gris.png |
| terminaciones | Terminaciones.png |

## Uso

### ImagenFaseObra (Con contenedor)
```tsx
import { ImagenFaseObra } from './ImagenFaseObra';

<ImagenFaseObra 
  fase="estructura" 
  className="w-full max-w-md mx-auto"
  alt="Imagen de fase estructura"
/>
```

### ImagenFaseObraSimple (Sin contenedor)
```tsx
import { ImagenFaseObraSimple } from './ImagenFaseObra';

<ImagenFaseObraSimple 
  fase="obra_gris" 
  className="w-full h-48 object-cover rounded-lg"
/>
```

### Hook useImagenFase
```tsx
import { useImagenFase } from './ImagenFaseObra';

const { nombreImagen, rutaImagen, tieneImagenEspecifica } = useImagenFase('terminaciones');
```

## Props

### ImagenFaseObra
- `fase`: 'estructura' | 'obra_gris' | 'terminaciones' - Fase actual de la obra
- `className?`: string - Clases CSS adicionales
- `alt?`: string - Texto alternativo para la imagen

### ImagenFaseObraSimple
- `fase`: string - Fase actual de la obra
- `className?`: string - Clases CSS adicionales

## Diferencias con ImagenTarea

| Componente | Propósito | Cambia |
|------------|-----------|---------|
| `ImagenTarea` | Íconos de subcategorías | Íconos según código de tarea |
| `ImagenFaseObra` | Imagen de fondo de fase | Solo imagen de fondo según fase |

## Estructura de Archivos

```
public/images/
├── Estructura.png
├── Obra gris.png
└── Terminaciones.png
```

## Integración

El componente ya está integrado en:
- `SelectorTareasAvanzado`: Muestra la imagen de fase dinámicamente
- Los íconos de subcategorías siguen usando `ImagenTarea` y no cambian

## Ejemplo de Integración Completa

```tsx
function SelectorTareasCompleto() {
  const [faseActual, setFaseActual] = useState('estructura');
  
  return (
    <div>
      {/* Imagen de fase - CAMBIA dinámicamente */}
      <ImagenFaseObra fase={faseActual} />
      
      {/* Íconos de subcategorías - NO CAMBIAN */}
      <div className="grid grid-cols-4 gap-2">
        <IconoTarea codigoTarea="R01" /> {/* Replanteo */}
        <IconoTarea codigoTarea="M02" /> {/* Mampostería */}
        <IconoTarea codigoTarea="H03" /> {/* Hormigón */}
        <IconoTarea codigoTarea="PL05" /> {/* Plomería */}
      </div>
    </div>
  );
}
```

## Casos de Uso

1. **Selector de fases**: Cambiar entre Estructura, Obra Gris, Terminaciones
2. **Dashboard de obra**: Mostrar progreso visual de la fase actual
3. **Reportes**: Visualizar en qué fase se encuentra cada obra
4. **Planificación**: Ver qué fase corresponde a cada etapa del proyecto
