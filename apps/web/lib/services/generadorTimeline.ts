import { TareaExpandidada, TimelineEvent } from '@/lib/types/elementos';

export class GeneradorTimeline {
  static generarTimeline(tareas: TareaExpandidada[]): TimelineEvent[] {
    // Ordenar tareas por fase y dependencias
    const tareasOrdenadas = this.ordenarTareasPorDependencias(tareas);
    
    const eventos: TimelineEvent[] = [];
    let fechaActual = new Date();
    
    // Agrupar tareas por fase para procesarlas en lotes
    const tareasPorFase = this.agruparPorFase(tareasOrdenadas);
    
    // Procesar cada fase
    Object.keys(tareasPorFase).forEach(fase => {
      const tareasFase = tareasPorFase[fase as keyof typeof tareasPorFase];
      const eventosFase = this.procesarFase(tareasFase, fechaActual);
      
      eventos.push(...eventosFase);
      
      // Actualizar fecha actual para la siguiente fase
      const ultimaFecha = Math.max(...eventosFase.map(e => e.fechaFin.getTime()));
      fechaActual = new Date(ultimaFecha);
    });
    
    return eventos;
  }

  private static ordenarTareasPorDependencias(tareas: TareaExpandidada[]): TareaExpandidada[] {
    const ordenadas: TareaExpandidada[] = [];
    const procesadas = new Set<string>();
    
    const procesarTarea = (tarea: TareaExpandidada) => {
      if (procesadas.has(tarea.id)) return;
      
      // Procesar dependencias primero
      tarea.dependencias.forEach(depId => {
        const dependencia = tareas.find(t => t.id.includes(depId));
        if (dependencia && !procesadas.has(dependencia.id)) {
          procesarTarea(dependencia);
        }
      });
      
      ordenadas.push(tarea);
      procesadas.add(tarea.id);
    };
    
    // Procesar todas las tareas
    tareas.forEach(procesarTarea);
    
    return ordenadas;
  }

  private static agruparPorFase(tareas: TareaExpandidada[]): Record<string, TareaExpandidada[]> {
    return tareas.reduce((acc, tarea) => {
      if (!acc[tarea.fase]) {
        acc[tarea.fase] = [];
      }
      acc[tarea.fase].push(tarea);
      return acc;
    }, {} as Record<string, TareaExpandidada[]>);
  }

  private static procesarFase(tareas: TareaExpandidada[], fechaInicio: Date): TimelineEvent[] {
    const eventos: TimelineEvent[] = [];
    let fechaActual = new Date(fechaInicio);
    
    // Identificar tareas que pueden ejecutarse en paralelo
    const tareasParalelas = this.identificarTareasParalelas(tareas);
    
    tareasParalelas.forEach(grupo => {
      const fechaInicioGrupo = new Date(fechaActual);
      let fechaFinMaxima = fechaInicioGrupo;
      
      grupo.forEach(tarea => {
        const fechaFin = new Date(fechaInicioGrupo);
        fechaFin.setDate(fechaFin.getDate() + tarea.tiempoEstimado);
        
        eventos.push({
          id: `timeline-${tarea.id}`,
          tarea,
          fechaInicio: new Date(fechaInicioGrupo),
          fechaFin,
          duracion: tarea.tiempoEstimado,
          fase: tarea.fase
        });
        
        if (fechaFin > fechaFinMaxima) {
          fechaFinMaxima = fechaFin;
        }
      });
      
      fechaActual = fechaFinMaxima;
    });
    
    return eventos;
  }

  private static identificarTareasParalelas(tareas: TareaExpandidada[]): TareaExpandidada[][] {
    const grupos: TareaExpandidada[][] = [];
    const procesadas = new Set<string>();
    
    tareas.forEach(tarea => {
      if (procesadas.has(tarea.id)) return;
      
      const grupo: TareaExpandidada[] = [tarea];
      procesadas.add(tarea.id);
      
      // Buscar tareas que pueden ejecutarse en paralelo (sin dependencias entre ellas)
      tareas.forEach(otraTarea => {
        if (procesadas.has(otraTarea.id)) return;
        
        // Verificar si pueden ejecutarse en paralelo
        if (this.puedenEjecutarseEnParalelo(tarea, otraTarea)) {
          grupo.push(otraTarea);
          procesadas.add(otraTarea.id);
        }
      });
      
      grupos.push(grupo);
    });
    
    return grupos;
  }

  private static puedenEjecutarseEnParalelo(tarea1: TareaExpandidada, tarea2: TareaExpandidada): boolean {
    // No pueden ejecutarse en paralelo si una depende de la otra
    if (tarea1.dependencias.includes(tarea2.id) || tarea2.dependencias.includes(tarea1.id)) {
      return false;
    }
    
    // Verificar dependencias cruzadas
    const tieneDependenciaComun = tarea1.dependencias.some(dep => 
      tarea2.dependencias.includes(dep)
    );
    
    return !tieneDependenciaComun;
  }
}
