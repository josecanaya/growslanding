import { elementos } from '@/lib/elementos-vivienda';
import { tareasConstructivas } from '@/lib/tareas-construccion';

export interface ElementoSeleccionado {
  id: string;
  categoria: string;
  tipo: string;
  cantidad: number;
  unidad: 'm²' | 'm³' | 'unidad';
}

export interface TareaGenerada {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  coef_operativo: number;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
  tiempoEstimado: number;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  elementoOrigen: {
    categoria: string;
    tipo: string;
    cantidad: number;
    unidad: string;
  };
}

/**
 * Mapeo de códigos cortos (usados en elementos-vivienda.ts) a códigos largos (usados en tareas-construccion.ts)
 * R01 -> REP001, M27 -> MUR001, RV01 -> REV001, etc.
 */
const MAPEO_CODIGOS_TAREAS: Record<string, string> = {
  // Replanteos
  'R00': 'REP001', // Replanteo general de obra
  'R01': 'REP002', // Replanteo de columnas
  'R02': 'REP003', // Replanteo de vigas
  'R03': 'REP004', // Replanteo de losas
  
  // Demoliciones
  'D01': 'DEM001', // Demolición de paredes
  'D03': 'DEM002', // Demolición de losas
  
  // Hormigón
  'H01': 'HOR005', // Hormigón de columnas y vigas
  'H11': 'HOR001', // Hormigón de cimientos
  'H15': 'HOR005', // Hormigón de columnas y vigas
  'H16': 'HOR002', // Hormigón de losa maciza
  'H17': 'HOR005', // Hormigón de columnas y vigas
  
  // Mampostería
  'M01': 'MUR001', // Mampostería ladrillo común 15cm
  'M02': 'MUR002', // Mampostería ladrillo común 30cm
  'M25': 'MUR002', // Mampostería (alternativo)
  'M27': 'MUR001', // Mampostería ladrillo común 15cm (alternativo)
  
  // Revoques
  'RV01': 'REV001', // Revoque grueso exterior
  'RV02': 'REV002', // Revoque fino exterior
  'RV03': 'REV001', // Revoque grueso (alternativo)
  'RV04': 'REV002', // Revoque fino (alternativo)
  'RV05': 'TER001', // Pintura exterior (terminación)
  'RV06': 'TER002', // Pintura interior (terminación)
  
  // Electricidad
  'EL02': 'ELE001', // Instalación eléctrica (si existe, sino usar genérico)
  'EL03': 'ELE002', // Instalación eléctrica (si existe, sino usar genérico)
  
  // Terminaciones
  'TE30': 'TER001', // Pintura exterior
};

/**
 * Función para mapear código corto a código largo
 * Si no existe el mapeo, intenta buscar por prefijo o retorna el código original
 */
function mapearCodigoTarea(codigoCorto: string): string {
  // Si ya está mapeado, retornar directamente
  if (MAPEO_CODIGOS_TAREAS[codigoCorto]) {
    return MAPEO_CODIGOS_TAREAS[codigoCorto];
  }
  
  // Intentar buscar por prefijo
  const prefijo = codigoCorto.substring(0, 2);
  const numero = codigoCorto.substring(2);
  
  // Mapeo por prefijos comunes
  const mapeoPrefijos: Record<string, string> = {
    'R0': 'REP', // Replanteos
    'D': 'DEM', // Demoliciones
    'H': 'HOR', // Hormigón
    'M': 'MUR', // Mampostería
    'RV': 'REV', // Revoques
    'EL': 'ELE', // Electricidad
    'TE': 'TER', // Terminaciones
  };
  
  const prefijoLargo = mapeoPrefijos[prefijo] || prefijo;
  
  // Construir código largo: PREFIJO + número con ceros a la izquierda
  const numeroFormateado = numero.padStart(3, '0');
  const codigoLargo = `${prefijoLargo}${numeroFormateado}`;
  
  return codigoLargo;
}

export class ExpansorElementos {
  static expandirElementos(elementosSeleccionados: ElementoSeleccionado[]): TareaGenerada[] {
    console.log('🔍 ExpansorElementos: Iniciando expansión de elementos');
    console.log('📦 Elementos seleccionados:', elementosSeleccionados);
    console.log('📋 Total tareas constructivas disponibles:', tareasConstructivas.length);
    
    const tareasGeneradas: TareaGenerada[] = [];

    elementosSeleccionados.forEach((elementoSeleccionado, index) => {
      console.log(`\n🔍 Procesando elemento ${index + 1}:`, elementoSeleccionado);
      
      // Función para normalizar y comparar categorías (maneja plurales, acentos, etc.)
      const normalizarCategoria = (cat: string): string => {
        return cat.toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
          .replace(/s$/g, '') // Eliminar plurales
          .replace(/\s+/g, ' '); // Normalizar espacios
      };
      
      // Matching flexible para categorías: primero exacto, luego normalizado
      let categoriaElemento = elementos.find(
        cat => cat.categoria.toLowerCase().trim() === elementoSeleccionado.categoria.toLowerCase().trim()
      );
      
      // Si no hay match exacto, buscar por normalización
      if (!categoriaElemento) {
        const categoriaNormalizada = normalizarCategoria(elementoSeleccionado.categoria);
        categoriaElemento = elementos.find(cat => {
          const catNormalizada = normalizarCategoria(cat.categoria);
          return catNormalizada === categoriaNormalizada ||
                 catNormalizada.includes(categoriaNormalizada.split(" ")[0]) ||
                 categoriaNormalizada.includes(catNormalizada.split(" ")[0]);
        });
        if (categoriaElemento) {
          console.log(`[ExpansorElementos] ✅ Categoría encontrada por normalización: '${elementoSeleccionado.categoria}' → '${categoriaElemento.categoria}'`);
        }
      }
      
      // Si aún no hay match, buscar por tipo en todas las categorías (más agresivo)
      if (!categoriaElemento) {
        console.warn(`[ExpansorElementos] ⚠️  Categoría '${elementoSeleccionado.categoria}' no encontrada, buscando por tipo en todas las categorías...`);
        // Buscar en todas las categorías por tipo con matching más flexible
        for (const cat of elementos) {
          // Extraer palabras clave del tipo del elemento
          const palabrasTipo = elementoSeleccionado.tipo.toLowerCase().split(/\s+/);
          const primeraPalabra = palabrasTipo[0];
          
          const tipoEncontrado = cat.tipos.find(t => {
            const nombreTipo = t.nombre.toLowerCase();
            const palabrasTipoCat = nombreTipo.split(/\s+/);
            
            // Match exacto
            if (nombreTipo === elementoSeleccionado.tipo.toLowerCase()) return true;
            
            // Match por primera palabra
            if (nombreTipo.includes(primeraPalabra) || elementoSeleccionado.tipo.toLowerCase().includes(palabrasTipoCat[0])) {
              return true;
            }
            
            // Match por palabras clave (excavación, fundación, muro, etc.)
            const palabrasClave = ['excavación', 'excavacion', 'fundación', 'fundacion', 'muro', 'columna', 'viga', 'losa', 'cimiento', 'base'];
            // Buscar si alguna palabra clave aparece en ambos
            const tienePalabraClave = palabrasClave.some(pc => 
              (nombreTipo.includes(pc) && elementoSeleccionado.tipo.toLowerCase().includes(pc)) ||
              // También buscar si alguna palabra del tipo aparece en el elemento
              palabrasTipoCat.some(p => elementoSeleccionado.tipo.toLowerCase().includes(p)) ||
              palabrasTipo.some(p => nombreTipo.includes(p))
            );
            if (tienePalabraClave) return true;
            
            return false;
          });
          
          if (tipoEncontrado) {
            categoriaElemento = cat;
            console.log(`[ExpansorElementos] ✅ Encontrada categoría por tipo: '${cat.categoria}' (tipo: '${tipoEncontrado.nombre}')`);
            break;
          }
        }
      }
      
      console.log('📁 Categoría encontrada:', categoriaElemento?.categoria || 'NO ENCONTRADA');
      
      if (!categoriaElemento || !categoriaElemento.tipos || categoriaElemento.tipos.length === 0) {
        console.error(`❌ ERROR: No se pudo encontrar categoría para '${elementoSeleccionado.categoria}' ni tipo '${elementoSeleccionado.tipo}'`);
        console.log(`[ExpansorElementos] Categorías disponibles:`, elementos.map(c => c.categoria).join(', '));
        return; // Salir de este elemento, continuar con el siguiente
      }

      // Matching flexible: primero exacto, luego por primera palabra, luego fallback
      const tipoExacto = categoriaElemento.tipos.find(
        (t) =>
          t.nombre.toLowerCase().trim() === elementoSeleccionado.tipo.toLowerCase().trim()
      );
      
      const tipoPorPalabra = tipoExacto || categoriaElemento.tipos.find(
        (t) =>
          elementoSeleccionado.tipo.toLowerCase().includes(t.nombre.split(" ")[0].toLowerCase()) ||
          t.nombre.toLowerCase().includes(elementoSeleccionado.tipo.split(" ")[0].toLowerCase())
      );
      
      // Si aún no hay match, buscar por palabras clave más flexible
      const tipoPorPalabrasClave = tipoPorPalabra || categoriaElemento.tipos.find(t => {
        const palabrasTipo = elementoSeleccionado.tipo.toLowerCase().split(/\s+/);
        const nombreTipo = t.nombre.toLowerCase();
        const palabrasTipoCat = nombreTipo.split(/\s+/);
        
        // Buscar palabras comunes
        const palabrasClave = ['excavación', 'excavacion', 'fundación', 'fundacion', 'cimiento', 'base', 'columna', 'viga', 'losa', 'muro'];
        return palabrasClave.some(pc => 
          (nombreTipo.includes(pc) && elementoSeleccionado.tipo.toLowerCase().includes(pc)) ||
          palabrasTipo.some(p => nombreTipo.includes(p)) ||
          palabrasTipoCat.some(p => elementoSeleccionado.tipo.toLowerCase().includes(p))
        );
      });
      
      const tipoEncontrado = tipoPorPalabrasClave || categoriaElemento.tipos[0]; // fallback: toma el primero del grupo si no hay coincidencia

      // Logging detallado del matching
      if (tipoExacto) {
        console.log(`[ExpansorElementos] ✅ Match exacto: '${elementoSeleccionado.tipo}' → '${tipoExacto.nombre}'`);
      } else if (tipoPorPalabra) {
        console.log(`[ExpansorElementos] ⚠️  Match por palabra clave: '${elementoSeleccionado.tipo}' → '${tipoPorPalabra.nombre}'`);
      } else if (tipoPorPalabrasClave) {
        console.log(`[ExpansorElementos] ⚠️  Match por palabras clave flexibles: '${elementoSeleccionado.tipo}' → '${tipoPorPalabrasClave.nombre}'`);
      } else {
        console.warn(
          `[ExpansorElementos] ⚠️  No se encontró tipo para '${elementoSeleccionado.tipo}', usando fallback: '${categoriaElemento.tipos[0]?.nombre}'`
        );
        console.log(`[ExpansorElementos] Tipos disponibles en '${categoriaElemento.categoria}':`, 
          categoriaElemento.tipos.map(t => t.nombre).slice(0, 5).join(', '));
      }

      const tipoElemento = tipoEncontrado;
      console.log('🏗️ Tipo encontrado:', tipoElemento?.nombre || 'NO ENCONTRADO');
      
      if (tipoElemento) {
        // Obtener TODAS las tareas del elemento (estructura + obra gris + terminaciones)
        const todasLasTareas = [
          ...tipoElemento.fases.estructura,
          ...tipoElemento.fases.obra_gris,
          ...tipoElemento.fases.terminaciones
        ];
        
        console.log('📝 Tareas del elemento:', todasLasTareas);
        console.log('📊 Total tareas a procesar:', todasLasTareas.length);

        // Generar tareas para cada código
        todasLasTareas.forEach((tareaId, tareaIndex) => {
          console.log(`\n  🔍 Buscando tarea ${tareaIndex + 1}: ${tareaId}`);
          
          // Mapear código corto a código largo
          const codigoMapeado = mapearCodigoTarea(tareaId);
          console.log(`  🔄 Código mapeado: ${tareaId} → ${codigoMapeado}`);
          
          // Buscar primero con el código mapeado, luego con el original
          let tareaOriginal = tareasConstructivas.find(t => t.id === codigoMapeado);
          if (!tareaOriginal && codigoMapeado !== tareaId) {
            // Si no se encontró con el código mapeado, intentar con el original
            tareaOriginal = tareasConstructivas.find(t => t.id === tareaId);
          }
          
          // Si aún no se encontró, buscar por prefijo (ej: R01 -> buscar REP001, REP002, etc.)
          if (!tareaOriginal) {
            const prefijo = tareaId.substring(0, 2);
            const mapeoPrefijos: Record<string, string> = {
              'R0': 'REP',
              'D': 'DEM',
              'H': 'HOR',
              'M': 'MUR',
              'RV': 'REV',
              'EL': 'ELE',
              'TE': 'TER',
            };
            const prefijoLargo = mapeoPrefijos[prefijo];
            if (prefijoLargo) {
              // Buscar cualquier tarea que comience con el prefijo largo
              tareaOriginal = tareasConstructivas.find(t => t.id.startsWith(prefijoLargo));
            }
          }
          
          console.log('  📋 Tarea encontrada:', tareaOriginal?.nombre || 'NO ENCONTRADA', 
            tareaOriginal ? `(ID: ${tareaOriginal.id})` : '');
          
          if (tareaOriginal) {
            const tiempoEstimado = this.calcularTiempoEstimado(tareaOriginal, elementoSeleccionado.cantidad, elementoSeleccionado.unidad);
            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + tiempoEstimado);
            
            const tareaGenerada: TareaGenerada = {
              id: tareaOriginal.id,
              nombre: tareaOriginal.nombre,
              cantidad: elementoSeleccionado.cantidad,
              unidad: tareaOriginal.unidad,
              coef_operativo: tareaOriginal.coef_operativo,
              fase: tareaOriginal.fase,
              tiempoEstimado,
              fechaInicio,
              fechaFin,
              elementoOrigen: {
                categoria: elementoSeleccionado.categoria,
                tipo: elementoSeleccionado.tipo,
                cantidad: elementoSeleccionado.cantidad,
                unidad: elementoSeleccionado.unidad
              }
            };
            
            console.log('  ✅ Tarea generada:', tareaGenerada);
            console.log('  🎯 Fase asignada:', tareaOriginal.fase);
            tareasGeneradas.push(tareaGenerada);
          } else {
            console.log('  ❌ ERROR: No se encontró la tarea con ID:', tareaId);
          }
        });
      } else {
        console.log('❌ ERROR: No se encontró el tipo de elemento');
      }
    });

    console.log('\n🎯 Resultado final:');
    console.log('📊 Total tareas generadas:', tareasGeneradas.length);
    console.log('📋 Tareas generadas:', tareasGeneradas);
    
    return tareasGeneradas;
  }

  private static calcularTiempoEstimado(tareaOriginal: any, cantidad: number, unidadElemento: string): number {
    // coef_operativo = horas necesarias para ejecutar 1 unidad de la tarea
    const coefOperativo = tareaOriginal.coef_operativo;
    
    // Horas por día de trabajo estándar
    const HORAS_POR_DIA = 8;
    
    // Calcular horas totales: coef_operativo (horas/unidad) × cantidad (unidades)
    const horasTotales = coefOperativo * cantidad;
    
    // Convertir horas a días (redondeando hacia arriba, mínimo 1 día)
    const dias = Math.max(1, Math.ceil(horasTotales / HORAS_POR_DIA));
    
    return dias;
  }
}



