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
  elementoOrigen: {
    categoria: string;
    tipo: string;
    cantidad: number;
    unidad: string;
  };
}

export class ExpansorElementos {
  static expandirElementos(elementosSeleccionados: ElementoSeleccionado[]): TareaGenerada[] {
    console.log('🔍 ExpansorElementos: Iniciando expansión de elementos');
    console.log('📦 Elementos seleccionados:', elementosSeleccionados);
    console.log('📋 Total tareas constructivas disponibles:', tareasConstructivas.length);
    
    const tareasGeneradas: TareaGenerada[] = [];

    elementosSeleccionados.forEach((elementoSeleccionado, index) => {
      console.log(`\n🔍 Procesando elemento ${index + 1}:`, elementoSeleccionado);
      
      // Buscar el elemento en la estructura existente
      const categoriaElemento = elementos.find(cat => cat.categoria === elementoSeleccionado.categoria);
      console.log('📁 Categoría encontrada:', categoriaElemento?.categoria || 'NO ENCONTRADA');
      
      const tipoElemento = categoriaElemento?.tipos.find(tipo => tipo.nombre === elementoSeleccionado.tipo);
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
          
          const tareaOriginal = tareasConstructivas.find(t => t.id === tareaId);
          console.log('  📋 Tarea encontrada:', tareaOriginal?.nombre || 'NO ENCONTRADA');
          
          if (tareaOriginal) {
            const tareaGenerada: TareaGenerada = {
              id: tareaOriginal.id,
              nombre: tareaOriginal.nombre,
              cantidad: elementoSeleccionado.cantidad,
              unidad: tareaOriginal.unidad,
              coef_operativo: tareaOriginal.coef_operativo,
              fase: tareaOriginal.fase,
              tiempoEstimado: this.calcularTiempoEstimado(tareaOriginal, elementoSeleccionado.cantidad, elementoSeleccionado.unidad),
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
    const coefOperativo = tareaOriginal.coef_operativo;
    
    // Factor de conversión basado en la unidad del elemento
    let factorCantidad = 1;
    
    switch (unidadElemento) {
      case 'm²':
        factorCantidad = cantidad / 10; // 10m² por día como referencia
        break;
      case 'm³':
        factorCantidad = cantidad / 5; // 5m³ por día como referencia
        break;
      case 'unidad':
        factorCantidad = cantidad / 2; // 2 unidades por día como referencia
        break;
    }
    
    // Tiempo base en días
    const tiempoBase = Math.max(1, Math.ceil(coefOperativo * factorCantidad));
    
    return tiempoBase;
  }
}



