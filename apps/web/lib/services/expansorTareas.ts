import { TareaExpandidada } from '@/lib/types/elementos';
import { tareasConstructivas } from '@/lib/tareas-construccion';
import { ElementoSeleccionado } from '@/lib/types/elementos';

export class ExpansorTareas {
  static expandirElementos(elementos: ElementoSeleccionado[]): any[] {
    const tareasExpandidadas: any[] = [];

    elementos.forEach(elemento => {
      // Obtener todas las tareas del elemento (todas las fases juntas)
      const todasLasTareas = [
        ...elemento.fases.estructura,
        ...elemento.fases.obra_gris,
        ...elemento.fases.terminaciones
      ];

      // Procesar cada tarea
      todasLasTareas.forEach(tareaId => {
        const tareaOriginal = tareasConstructivas.find(t => t.id === tareaId);
        if (tareaOriginal) {
          const tareaExpandida = {
            id: tareaId, // Usar el ID original de la tarea
            nombre: tareaOriginal.nombre,
            cantidad: elemento.cantidad,
            unidad: tareaOriginal.unidad,
            coef_operativo: tareaOriginal.coef_operativo,
            fase: tareaOriginal.fase,
            tiempoEstimado: this.calcularTiempoEstimado(tareaOriginal, elemento.cantidad, elemento.unidad),
            elementoOrigen: {
              categoria: elemento.categoria,
              tipo: elemento.tipo,
              cantidad: elemento.cantidad,
              unidad: elemento.unidad
            }
          };
          
          tareasExpandidadas.push(tareaExpandida);
        }
      });
    });

    return tareasExpandidadas;
  }

  private static calcularTiempoEstimado(tarea: any, cantidad: number, unidadElemento: string): number {
    // Cálculo de tiempo basado en coeficiente operativo y cantidad
    const coefOperativo = tarea.coef_operativo || 1;
    
    // Factor de conversión basado en la unidad del elemento
    let factorCantidad = 1;
    
    switch (unidadElemento) {
      case 'm²':
        // Para elementos en m², el tiempo se calcula proporcionalmente
        factorCantidad = cantidad / 10; // 10m² por día como referencia
        break;
      case 'm³':
        // Para elementos en m³ (como cimientos, hormigón)
        factorCantidad = cantidad / 5; // 5m³ por día como referencia
        break;
      case 'unidad':
        // Para elementos unitarios (puertas, ventanas, etc.)
        factorCantidad = cantidad / 2; // 2 unidades por día como referencia
        break;
    }
    
    // Tiempo base en días
    const tiempoBase = Math.max(1, Math.ceil(coefOperativo * factorCantidad));
    
    return tiempoBase;
  }
}
