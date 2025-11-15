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
    // coef_operativo = horas necesarias para ejecutar 1 unidad de la tarea
    const coefOperativo = tarea.coef_operativo || 1;
    
    // Horas por día de trabajo estándar
    const HORAS_POR_DIA = 8;
    
    // Calcular horas totales: coef_operativo (horas/unidad) × cantidad (unidades)
    const horasTotales = coefOperativo * cantidad;
    
    // Convertir horas a días (redondeando hacia arriba, mínimo 1 día)
    const dias = Math.max(1, Math.ceil(horasTotales / HORAS_POR_DIA));
    
    return dias;
  }
}
