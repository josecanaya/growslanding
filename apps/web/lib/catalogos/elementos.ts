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
 * Función auxiliar para mapear una tarea (string o objeto) a fase basándose en su nombre
 */
function mapearTareaPorNombre(nombreTarea: string): 'estructura' | 'obra_gris' | 'terminaciones' {
  const tareaLower = nombreTarea.toLowerCase();
  
  // PRIMERO verificar tareas específicas de Terminaciones (antes de las genéricas)
  if (
    tareaLower.includes('grifería') ||
    tareaLower.includes('griferia') ||
    tareaLower.includes('colocación artefactos') ||
    tareaLower.includes('colocacion artefactos') ||
    tareaLower.includes('colocar artefactos') ||
    tareaLower.includes('montaje unidad interior') ||
    tareaLower.includes('montaje unidad exterior') ||
    tareaLower.includes('pintura') ||
    tareaLower.includes('terminación') ||
    tareaLower.includes('terminacion') ||
    tareaLower.includes('cerámica') ||
    tareaLower.includes('ceramica') ||
    tareaLower.includes('cerámicos') ||
    tareaLower.includes('ceramicos') ||
    tareaLower.includes('pegado cerámicos') ||
    tareaLower.includes('pegado ceramicos') ||
    tareaLower.includes('pegado adhesivo especial') ||
    tareaLower.includes('pegado adhesivo') ||
    tareaLower.includes('pulido') ||
    tareaLower.includes('pulido final') ||
    tareaLower.includes('colocación madera') ||
    tareaLower.includes('colocacion madera') ||
    tareaLower.includes('colocar madera') ||
    tareaLower.includes('rastreles') ||
    tareaLower.includes('rastrel') ||
    tareaLower.includes('lijado') ||
    tareaLower.includes('2da lijada') ||
    tareaLower.includes('segunda lijada') ||
    tareaLower.includes('barniz') ||
    tareaLower.includes('laca') ||
    tareaLower.includes('preparación superficie') ||
    tareaLower.includes('preparacion superficie') ||
    tareaLower.includes('pastinado') ||
    tareaLower.includes('limpieza') ||
    tareaLower.includes('nivelación cerámicos') ||
    tareaLower.includes('nivelacion ceramicos') ||
    tareaLower.includes('nivelación perfecta') ||
    tareaLower.includes('nivelacion perfecta') ||
    tareaLower.includes('nivelación superficie') ||
    tareaLower.includes('nivelacion superficie') ||
    tareaLower.includes('aislación acústica') ||
    tareaLower.includes('aislacion acustica') ||
    tareaLower.includes('colocación flotante') ||
    tareaLower.includes('colocacion flotante') ||
    tareaLower.includes('barrera humedad') ||
    tareaLower.includes('zócalos') ||
    tareaLower.includes('zocalos') ||
    tareaLower.includes('1ra capa base') ||
    tareaLower.includes('primera capa base') ||
    tareaLower.includes('2da capa base') ||
    tareaLower.includes('segunda capa base') ||
    tareaLower.includes('capa base') ||
    tareaLower.includes('preparación soporte') ||
    tareaLower.includes('preparacion soporte') ||
    tareaLower.includes('imprimación') ||
    tareaLower.includes('imprimacion') ||
    tareaLower.includes('capa micro') ||
    tareaLower.includes('sellador') ||
    tareaLower.includes('protección') ||
    tareaLower.includes('proteccion') ||
    tareaLower.includes('porcelanato') ||
    tareaLower.includes('revestimiento') ||
    tareaLower.includes('yeso') ||
    tareaLower.includes('masillado') ||
    tareaLower.includes('impermeabilización') ||
    tareaLower.includes('impermeabilizacion') ||
    tareaLower.includes('siding') ||
    tareaLower.includes('ladrillo visto') ||
    tareaLower.includes('canaletas') ||
    tareaLower.includes('canaleta') ||
    tareaLower.includes('babetas') ||
    tareaLower.includes('babeta')
  ) {
    return 'terminaciones';
  } else if (
    tareaLower.includes('replanteo') ||
    tareaLower.includes('excavación') ||
    tareaLower.includes('excavacion') ||
    tareaLower.includes('encofrado') ||
    tareaLower.includes('desencofrado') ||
    tareaLower.includes('armado') ||
    tareaLower.includes('armadura') ||
    tareaLower.includes('hormigonado') ||
    tareaLower.includes('hormigon') ||
    tareaLower.includes('columna') ||
    tareaLower.includes('viga') ||
    tareaLower.includes('vigueta') ||
    tareaLower.includes('losa') ||
    tareaLower.includes('bovedilla') ||
    tareaLower.includes('bóvedilla') ||
    tareaLower.includes('malla') ||
    tareaLower.includes('compresión') ||
    tareaLower.includes('compresion') ||
    tareaLower.includes('curado') ||
    tareaLower.includes('montaje') ||
    tareaLower.includes('colocación') ||
    tareaLower.includes('colocacion') ||
    tareaLower.includes('colocar') ||
    tareaLower.includes('colocación chapas') ||
    tareaLower.includes('colocacion chapas') ||
    tareaLower.includes('colocar chapas') ||
    tareaLower.includes('colocación tejas') ||
    tareaLower.includes('colocacion tejas') ||
    tareaLower.includes('colocar tejas') ||
    tareaLower.includes('estructura soporte') ||
    tareaLower.includes('correas') ||
    tareaLower.includes('caballete') ||
    tareaLower.includes('limahoyas') ||
    tareaLower.includes('limatesas') ||
    tareaLower.includes('listones') ||
    tareaLower.includes('aislación') ||
    tareaLower.includes('aislacion') ||
    tareaLower.includes('estructura metálica') ||
    tareaLower.includes('estructura metalica') ||
    tareaLower.includes('cerramiento') ||
    tareaLower.includes('iluminación cenital') ||
    tareaLower.includes('iluminacion cenital') ||
    tareaLower.includes('desagües') ||
    tareaLower.includes('desagues') ||
    tareaLower.includes('levantar muro') ||
    tareaLower.includes('base') ||
    tareaLower.includes('fundación') ||
    tareaLower.includes('fundacion') ||
    tareaLower.includes('montaje estructura') ||
    tareaLower.includes('demolición') ||
    tareaLower.includes('demolicion') ||
    tareaLower.includes('compactación') ||
    tareaLower.includes('compactacion') ||
    tareaLower.includes('retiro de basura') ||
    tareaLower.includes('retiro basura') ||
    tareaLower.includes('desmalezado') ||
    tareaLower.includes('carga en bolsines') ||
    tareaLower.includes('carga bolsines') ||
    tareaLower.includes('carga en volquete') ||
    tareaLower.includes('carga volquete') ||
    tareaLower.includes('colocación tablero') ||
    tareaLower.includes('colocacion tablero') ||
    tareaLower.includes('conexión pilar') ||
    tareaLower.includes('conexion pilar') ||
    tareaLower.includes('tablero provisorio') ||
    tareaLower.includes('pilar de obra') ||
    tareaLower.includes('electricidad provisoria') ||
    tareaLower.includes('luz inicial') ||
    tareaLower.includes('instalación provisoria') ||
    tareaLower.includes('instalacion provisoria') ||
    tareaLower.includes('colocación postes') ||
    tareaLower.includes('colocacion postes') ||
    tareaLower.includes('atado o fijación') ||
    tareaLower.includes('atado') ||
    tareaLower.includes('fijación') ||
    tareaLower.includes('fijacion') ||
    tareaLower.includes('tensado') ||
    tareaLower.includes('impresión cartel') ||
    tareaLower.includes('impresion cartel') ||
    tareaLower.includes('verificación') ||
    tareaLower.includes('verificacion') ||
    tareaLower.includes('mantenimiento') ||
    tareaLower.includes('retiro final') ||
    tareaLower.includes('colocación casilla') ||
    tareaLower.includes('colocacion casilla') ||
    tareaLower.includes('conexiones mínimas') ||
    tareaLower.includes('conexiones minimas') ||
    tareaLower.includes('retiro') ||
    tareaLower.includes('cercado') ||
    tareaLower.includes('cartel') ||
    tareaLower.includes('señalización') ||
    tareaLower.includes('senalizacion')
  ) {
    return 'estructura';
  } else if (
    tareaLower.includes('mampostería') ||
    tareaLower.includes('mamposteria') ||
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
    tareaLower.includes('carpeta') ||
    tareaLower.includes('nivelación') ||
    tareaLower.includes('nivelacion') ||
    tareaLower.includes('nivelación suelo') ||
    tareaLower.includes('nivelacion suelo') ||
    tareaLower.includes('nivelación contrapiso') ||
    tareaLower.includes('nivelacion contrapiso') ||
    tareaLower.includes('nivelación carpeta') ||
    tareaLower.includes('nivelacion carpeta')
  ) {
    return 'obra_gris';
  } else {
    // Por defecto, agregar a obra_gris si no se puede clasificar
    return 'obra_gris';
  }
}

/**
 * Mapea las tareas del JSON a las fases según el tipo de elemento
 * Ahora soporta tanto strings (legacy) como objetos {task_id, nombre, fase}
 */
export function mapearTareasAFases(tareas: (string | { task_id?: string; nombre: string; fase: string })[]): Fases {
  const fases: Fases = {
    estructura: [],
    obra_gris: [],
    terminaciones: []
  };

  tareas.forEach(tarea => {
    let nombreTarea: string;
    let faseTarea: 'estructura' | 'obra_gris' | 'terminaciones';

    // Si la tarea es un objeto, extraer nombre y fase
    if (typeof tarea === 'object' && tarea !== null && 'nombre' in tarea) {
      nombreTarea = tarea.nombre || '';
      
      // Si el objeto tiene fase válida, usarla directamente
      if (tarea.fase && typeof tarea.fase === 'string') {
        const faseLower = tarea.fase.toLowerCase().trim();
        if (faseLower === 'estructura') {
          faseTarea = 'estructura';
        } else if (faseLower === 'obra_gris' || faseLower === 'obra gris') {
          faseTarea = 'obra_gris';
        } else if (faseLower === 'terminaciones') {
          faseTarea = 'terminaciones';
        } else {
          // Si la fase no es reconocida, mapear por nombre
          faseTarea = mapearTareaPorNombre(nombreTarea);
        }
      } else {
        // Si no tiene fase, mapear por nombre
        faseTarea = mapearTareaPorNombre(nombreTarea);
      }
    } else {
      // Si la tarea es un string (compatibilidad legacy)
      nombreTarea = typeof tarea === 'string' ? tarea : String(tarea);
      faseTarea = mapearTareaPorNombre(nombreTarea);
    }

    // Agregar la tarea a la fase correspondiente
    fases[faseTarea].push(nombreTarea);
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
