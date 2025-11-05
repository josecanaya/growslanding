/**
 * Catálogo completo de elementos constructivos
 * 
 * Este archivo exporta el catálogo completo con todas las categorías requeridas:
 * 1. Fundación y Estructura (3 subcategorías)
 * 2. Muros y Cerramientos (2 subcategorías)
 * 3. Instalaciones (5 subcategorías)
 * 4. Cubiertas (3 subcategorías)
 * 5. Suelos / Pisos (3 subcategorías)
 * 6. Amenities (2 subcategorías)
 * 7. Parquizado (3 subcategorías)
 */

import catalogoCompletoJson from './catalogo-elementos-constructivos.json';

interface Fases {
  estructura: string[];
  obra_gris: string[];
  terminaciones: string[];
}

interface TipoElemento {
  nombre: string;
  fases: Fases;
}

interface Elemento {
  categoria: string;
  tipos: TipoElemento[];
}

/**
 * Mapea las tareas del JSON a las fases según el tipo de elemento
 */
function mapearTareasAFases(tareas: string[]): Fases {
  const fases: Fases = {
    estructura: [],
    obra_gris: [],
    terminaciones: []
  };

  tareas.forEach(tarea => {
    const tareaLower = tarea.toLowerCase();
    
    // Mapeo de tareas a fases
    if (
      tareaLower.includes('replanteo') ||
      tareaLower.includes('excavación') ||
      tareaLower.includes('excavacion') ||
      tareaLower.includes('encofrado') ||
      tareaLower.includes('armado') ||
      tareaLower.includes('armadura') ||
      tareaLower.includes('hormigonado') ||
      tareaLower.includes('hormigon') ||
      tareaLower.includes('columna') ||
      tareaLower.includes('viga') ||
      tareaLower.includes('losa') ||
      tareaLower.includes('base') ||
      tareaLower.includes('fundación') ||
      tareaLower.includes('fundacion') ||
      tareaLower.includes('montaje estructura') ||
      tareaLower.includes('demolición') ||
      tareaLower.includes('demolicion') ||
      tareaLower.includes('compactación') ||
      tareaLower.includes('compactacion')
    ) {
      fases.estructura.push(tarea);
    } else if (
      tareaLower.includes('mampostería') ||
      tareaLower.includes('mamposteria') ||
      tareaLower.includes('levantar muro') ||
      tareaLower.includes('tabique') ||
      tareaLower.includes('revoque grueso') ||
      tareaLower.includes('revoque fino') ||
      tareaLower.includes('instalación') ||
      tareaLower.includes('instalacion') ||
      tareaLower.includes('cañería') ||
      tareaLower.includes('caneria') ||
      tareaLower.includes('tablero') ||
      tareaLower.includes('circuito') ||
      tareaLower.includes('contrapiso') ||
      tareaLower.includes('base') ||
      tareaLower.includes('carpeta')
    ) {
      fases.obra_gris.push(tarea);
    } else if (
      tareaLower.includes('pintura') ||
      tareaLower.includes('terminación') ||
      tareaLower.includes('terminacion') ||
      tareaLower.includes('cerámica') ||
      tareaLower.includes('ceramica') ||
      tareaLower.includes('porcelanato') ||
      tareaLower.includes('revestimiento') ||
      tareaLower.includes('yeso') ||
      tareaLower.includes('masillado') ||
      tareaLower.includes('impermeabilización') ||
      tareaLower.includes('impermeabilizacion') ||
      tareaLower.includes('siding') ||
      tareaLower.includes('ladrillo visto') ||
      tareaLower.includes('nivelación') ||
      tareaLower.includes('nivelacion')
    ) {
      fases.terminaciones.push(tarea);
    } else {
      // Por defecto, agregar a obra_gris si no se puede clasificar
      fases.obra_gris.push(tarea);
    }
  });

  return fases;
}

/**
 * Convierte el catálogo JSON completo al formato esperado por los componentes
 */
function convertirCatalogoCompleto(): Elemento[] {
  const elementos: Elemento[] = [];

  catalogoCompletoJson.categorias.forEach(categoria => {
    // Agrupar elementos por subcategoría para mantener la estructura
    const tipos: TipoElemento[] = [];

    categoria.subcategorias.forEach(subcategoria => {
      subcategoria.elementos.forEach(elemento => {
        tipos.push({
          nombre: elemento.nombre,
          fases: mapearTareasAFases(elemento.tareas || [])
        });
      });
    });

    if (tipos.length > 0) {
      elementos.push({
        categoria: categoria.categoria,
        tipos
      });
    }
  });

  return elementos;
}

// Exportar el catálogo completo convertido
export const elementos: Elemento[] = convertirCatalogoCompleto();

// También exportar el catálogo completo en formato JSON para otros usos
export { catalogoCompletoJson };
