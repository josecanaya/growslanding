# Catálogo de Elementos Constructivos

## Descripción

Este catálogo contiene una biblioteca completa de elementos constructivos para la gestión de obras de construcción. Está estructurado jerárquicamente con categorías, subcategorías y elementos individuales.

## Estructura del Catálogo

### Formato JSON

```json
{
  "catalogo": "Elementos Constructivos - GROWS",
  "version": "1.0.0",
  "categorias": [
    {
      "id": "...",
      "categoria": "Nombre de la Categoría",
      "subcategorias": [
        {
          "id": "...",
          "nombre": "Nombre de la Subcategoría",
          "elementos": [
            {
              "id": "elemento_id",
              "nombre": "Nombre del Elemento",
              "unidad": "m²|m³|m|unidad",
              "opciones": {
                "configuracion": [...],
                "aislacion": [...],
                "terminacion": [...]
              },
              "tareas": ["tarea 1", "tarea 2", ...]
            }
          ]
        }
      ]
    }
  ]
}
```

## Categorías Principales

### 1. Fundación y Estructura
- **Excavación**: manual y mecánica
- **Fundaciones**: platea, zapatas, vigas
- **Hormigón Armado**: bases, columnas, vigas, losas (maciza, alivianada, pretensada)

### 2. Muros y Cerramientos
- **Muros Exteriores**: ladrillo, bloques, retak, paneles, muro cortina
- **Muros Interiores**: tabiques de ladrillo, durlock (simple, doble, acústico), retak

### 3. Instalaciones
- **Sanitaria**: baños, cocina, lavadero, tanques, cisternas, bombas
- **Eléctrica**: tableros, circuitos, iluminación, previsiones
- **Gas**: natural, envasado, artefactos
- **Pluvial**: canaletas, desagües
- **Climatización**: radiadores, piso radiante, splits

### 4. Cubiertas
- **Planas**: hormigón impermeabilizado, cubierta invertida
- **Inclinadas**: 2 y 4 aguas (teja cerámica, hormigón, chapa)
- **Especiales**: diente de sierra, policarbonato, vidrio

### 5. Suelos / Pisos
- **Base**: contrapiso, carpeta
- **Interiores**: cerámico, porcelanato, madera, flotante, microcemento, hormigón alisado
- **Exteriores**: antideslizante, deck (madera, WPC)

### 6. Amenities
- **Parrilla y Quincho**: parrillas (refractaria, metálica), quincho/galería
- **Pileta**: hormigón, fibra, solárium

### 7. Parquizado
- **Césped y Vegetación**: césped natural/sintético, árboles, arbustos
- **Senderos**: piedra, hormigón, deck
- **Iluminación y Riego**: balizas, reflectores, riego por aspersión/goteo

## Uso en la Aplicación

### Importar el Catálogo

```typescript
import catalogoData from '../../lib/catalogos/catalogo-elementos-constructivos.json';
```

### Procesar los Datos

```typescript
// Aplanar el catálogo para búsqueda
const elementosPlanos: any[] = [];

catalogoData.categorias.forEach(categoria => {
  categoria.subcategorias.forEach(subcategoria => {
    subcategoria.elementos.forEach(elemento => {
      elementosPlanos.push({
        id: elemento.id,
        nombre: elemento.nombre,
        categoria: categoria.categoria,
        subcategoria: subcategoria.nombre,
        unidad: elemento.unidad,
        opciones: elemento.opciones,
        tareas: elemento.tareas
      });
    });
  });
});
```

### Filtrar Elementos

```typescript
// Por categoría
const elementosFundacion = elementosPlanos.filter(
  el => el.categoria === 'Fundación y Estructura'
);

// Por subcategoría
const murosExteriores = elementosPlanos.filter(
  el => el.subcategoria === 'Muros Exteriores'
);

// Por búsqueda
const resultados = elementosPlanos.filter(
  el => el.nombre.toLowerCase().includes(termino.toLowerCase())
);
```

## Propiedades de los Elementos

### Obligatorias
- `id`: Identificador único (string, snake_case)
- `nombre`: Nombre descriptivo del elemento
- `unidad`: Unidad de medida (m², m³, m, kg, unidad)

### Opcionales
- `opciones`: Objeto con variantes y configuraciones disponibles
  - `configuracion`: Opciones de configuración
  - `aislacion`: Tipos de aislación disponibles
  - `terminacion`: Acabados y terminaciones
  - `color`: Colores disponibles
  - etc.
- `tareas`: Array de strings con las tareas asociadas

## Extensión del Catálogo

Para agregar nuevos elementos:

1. Ubicar la categoría y subcategoría correspondiente
2. Agregar el nuevo elemento siguiendo la estructura:

```json
{
  "id": "nuevo_elemento_id",
  "nombre": "Nombre del Nuevo Elemento",
  "unidad": "m²",
  "opciones": {
    "tipo": ["opción 1", "opción 2"],
    "terminacion": ["opción A", "opción B"]
  },
  "tareas": ["tarea 1", "tarea 2", "tarea 3"]
}
```

## Notas Importantes

- Los IDs deben ser únicos en todo el catálogo
- Usar snake_case para los IDs (ejemplo: `muro_ladrillo_comun_15`)
- Las unidades deben seguir el sistema métrico
- Las opciones deben ser arrays de strings para facilitar el procesamiento
- Las tareas deben listarse en orden lógico de ejecución

## Versión

**v1.0.0** - Catálogo inicial completo con 7 categorías principales y más de 100 elementos constructivos.

## Mantenimiento

Este catálogo debe actualizarse cuando:
- Se agreguen nuevos tipos de elementos constructivos
- Cambien las normativas o estándares de construcción
- Se requieran nuevas opciones o variantes
- Se identifiquen elementos faltantes

---

**Última actualización**: Octubre 2025

