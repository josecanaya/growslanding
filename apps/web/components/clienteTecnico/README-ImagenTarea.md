# Componente ImagenTarea

Este componente muestra imágenes específicas según el código de la tarea de construcción.

## Características

- **Mapeo automático**: Según el código de la tarea (R01, H03, PL05, etc.)
- **Fallback inteligente**: Si no existe la imagen específica, usa "Obra gris.png"
- **Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Optimizado**: Usa Next.js Image para mejor rendimiento

## Mapeo de Códigos

| Código | Subcategoría | Imagen |
|--------|-------------|---------|
| R | Replanteo | replanteo.png |
| F | Fundación | fundacion.png |
| M | Mampostería | mamposteria.png |
| H | Hormigón | hormigon.png |
| S | Suelo | suelo.png |
| C | Cubierta | cubierta.png |
| RV | Revoque | revoque.png |
| EL | Electricidad | electricidad.png |
| PL | Plomería | plomeria.png |
| TE | Terminaciones | terminaciones.png |

## Uso

### ImagenTarea (Imagen completa)
```tsx
import { ImagenTarea } from './ImagenTarea';

<ImagenTarea 
  codigoTarea="H03" 
  className="w-48 h-36"
  alt="Imagen de hormigón"
/>
```

### IconoTarea (Ícono pequeño)
```tsx
import { IconoTarea } from './ImagenTarea';

<IconoTarea 
  codigoTarea="PL05" 
  className="w-8 h-8"
/>
```

### Hook useImagenTarea
```tsx
import { useImagenTarea } from './ImagenTarea';

const { nombreImagen, rutaImagen, tieneImagenEspecifica } = useImagenTarea('EL04');
```

## Props

### ImagenTarea
- `codigoTarea`: string - Código de la tarea (ej: "R01", "H03")
- `className?`: string - Clases CSS adicionales
- `alt?`: string - Texto alternativo para la imagen

### IconoTarea
- `codigoTarea`: string - Código de la tarea
- `className?`: string - Clases CSS adicionales

## Estructura de Archivos

```
public/images/
├── Replanteo.png
├── Fundacion.png
├── Mamposteria.png
├── Hormigon.png
├── Suelo.png
├── Cubierta.png
├── Revoque.png
├── Electricidad.png
├── Plomeria.png
├── Terminaciones.png
└── Obra gris.png (fallback)
```

## Integración

El componente ya está integrado en:
- `SelectorTareasAvanzado`: Muestra íconos en subgrupos e imagen cuando se selecciona una tarea
- `DetalleObra`: Puede mostrar imágenes de tareas específicas
- `ModalCrearTarea`: Muestra la imagen de la tarea seleccionada
