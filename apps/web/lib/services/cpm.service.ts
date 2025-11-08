import { PrismaClient } from '@prisma/client';
import { createServiceSupabaseClient } from '../supabase-server';

type PrismaWithCache = PrismaClient & {
  obraCache?: {
    upsert: (...args: any[]) => Promise<any>;
  };
};

const prisma = new PrismaClient() as PrismaWithCache;

interface TareaCPM {
  id: string;
  nombre: string;
  duracionEstimada: number;
  precedencias: string[];
  fechaInicioTemprana?: number;
  fechaFinTemprana?: number;
  fechaInicioTardia?: number;
  fechaFinTardia?: number;
  holguraTotal?: number;
  holguraLibre?: number;
  esCritica?: boolean;
}

type PrecedenciaRow = {
  tarea_id: string;
  depende_de: string;
  lag_dias?: number | null;
};

export class CPMService {
  /**
   * Calcula el camino crítico para una obra
   */
  static async calcularCaminoCritico(obraId: string): Promise<{
    caminoCritico: string[];
    tareas: TareaCPM[];
    duracionTotal: number;
  }> {
    // Obtener todas las tareas de la obra con sus precedencias
    const tareaDelegate = prisma.tarea as any;
    const tareas = await tareaDelegate.findMany({
      where: {
        elemento: {
          obraId,
        },
      },
      include: {
        precedencias: {
          include: {
            tareaPredecesora: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Convertir a formato CPM
    const tareasCPM: TareaCPM[] = tareas.map((tarea: any) => ({
      id: tarea.id,
      nombre: tarea.nombre,
      duracionEstimada: tarea.duracionEstimada || 1,
      precedencias: tarea.precedencias.map((p: any) => p.tareaPredecesora.id),
    }));

    // Calcular fechas tempranas (forward pass)
    this.calcularFechasTempranas(tareasCPM);

    // Calcular fechas tardías (backward pass)
    this.calcularFechasTardias(tareasCPM);

    // Calcular holguras
    this.calcularHolguras(tareasCPM);

    // Identificar camino crítico
    const caminoCritico = this.identificarCaminoCritico(tareasCPM);

    // Calcular duración total
    const duracionTotal = Math.max(...tareasCPM.map(t => t.fechaFinTemprana || 0));

    return {
      caminoCritico,
      tareas: tareasCPM,
      duracionTotal,
    };
  }

  /**
   * Calcula las fechas tempranas (forward pass)
   */
  private static calcularFechasTempranas(tareas: TareaCPM[]) {
    const tareasMap = new Map(tareas.map(t => [t.id, t]));

    // Ordenar tareas por dependencias (topological sort)
    const ordenadas = this.ordenarTopologicamente(tareas);

    for (const tarea of ordenadas) {
      if (tarea.precedencias.length === 0) {
        // Tarea sin precedencias
        tarea.fechaInicioTemprana = 0;
        tarea.fechaFinTemprana = tarea.duracionEstimada;
      } else {
        // Tarea con precedencias
        let fechaInicioTemprana = 0;
        
        for (const precedenciaId of tarea.precedencias) {
          const precedencia = tareasMap.get(precedenciaId);
          if (precedencia && precedencia.fechaFinTemprana) {
            fechaInicioTemprana = Math.max(fechaInicioTemprana, precedencia.fechaFinTemprana);
          }
        }
        
        tarea.fechaInicioTemprana = fechaInicioTemprana;
        tarea.fechaFinTemprana = fechaInicioTemprana + tarea.duracionEstimada;
      }
    }
  }

  /**
   * Calcula las fechas tardías (backward pass)
   */
  private static calcularFechasTardias(tareas: TareaCPM[]) {
    const tareasMap = new Map(tareas.map(t => [t.id, t]));

    // Encontrar la duración total del proyecto
    const duracionTotal = Math.max(...tareas.map(t => t.fechaFinTemprana || 0));

    // Ordenar tareas en orden inverso
    const ordenadas = this.ordenarTopologicamente(tareas).reverse();

    for (const tarea of ordenadas) {
      // Encontrar tareas que dependen de esta
      const dependientes = tareas.filter(t => t.precedencias.includes(tarea.id));

      if (dependientes.length === 0) {
        // Tarea final
        tarea.fechaFinTardia = duracionTotal;
        tarea.fechaInicioTardia = duracionTotal - tarea.duracionEstimada;
      } else {
        // Tarea con dependientes
        let fechaFinTardia = duracionTotal;
        
        for (const dependiente of dependientes) {
          if (dependiente.fechaInicioTardia !== undefined) {
            fechaFinTardia = Math.min(fechaFinTardia, dependiente.fechaInicioTardia);
          }
        }
        
        tarea.fechaFinTardia = fechaFinTardia;
        tarea.fechaInicioTardia = fechaFinTardia - tarea.duracionEstimada;
      }
    }
  }

  /**
   * Calcula las holguras
   */
  private static calcularHolguras(tareas: TareaCPM[]) {
    for (const tarea of tareas) {
      if (tarea.fechaInicioTemprana !== undefined && tarea.fechaInicioTardia !== undefined) {
        tarea.holguraTotal = tarea.fechaInicioTardia - tarea.fechaInicioTemprana;
        tarea.esCritica = tarea.holguraTotal === 0;
      }

      // Calcular holgura libre (simplificado)
      if (tarea.fechaFinTemprana !== undefined) {
        const dependientes = tareas.filter(t => t.precedencias.includes(tarea.id));
        if (dependientes.length > 0) {
          const fechaInicioMasTemprana = Math.min(
            ...dependientes.map(d => d.fechaInicioTemprana || Infinity)
          );
          tarea.holguraLibre = fechaInicioMasTemprana - tarea.fechaFinTemprana;
        } else {
          tarea.holguraLibre = 0;
        }
      }
    }
  }

  /**
   * Identifica el camino crítico
   */
  private static identificarCaminoCritico(tareas: TareaCPM[]): string[] {
    const caminoCritico: string[] = [];
    const tareasMap = new Map(tareas.map(t => [t.id, t]));

    // Encontrar tareas críticas
    const tareasCriticas = tareas.filter(t => t.esCritica);

    // Construir camino crítico desde el inicio
    const tareasInicio = tareasCriticas.filter(t => t.precedencias.length === 0);
    
    if (tareasInicio.length > 0) {
      const tareaInicio = tareasInicio[0];
      caminoCritico.push(tareaInicio.id);
      
      // Seguir el camino crítico
      let tareaActual = tareaInicio;
      while (true) {
        const dependientesCriticos = tareasCriticas.filter(t => 
          t.precedencias.includes(tareaActual.id) && t.esCritica
        );
        
        if (dependientesCriticos.length === 0) break;
        
        // Tomar el primer dependiente crítico
        tareaActual = dependientesCriticos[0];
        caminoCritico.push(tareaActual.id);
      }
    }

    return caminoCritico;
  }

  /**
   * Ordena las tareas topológicamente
   */
  private static ordenarTopologicamente(tareas: TareaCPM[]): TareaCPM[] {
    const resultado: TareaCPM[] = [];
    const visitados = new Set<string>();
    const enProceso = new Set<string>();

    const visitar = (tarea: TareaCPM) => {
      if (enProceso.has(tarea.id)) {
        throw new Error('Ciclo detectado en las dependencias');
      }
      
      if (visitados.has(tarea.id)) {
        return;
      }

      enProceso.add(tarea.id);

      // Visitar precedencias primero
      for (const precedenciaId of tarea.precedencias) {
        const precedencia = tareas.find(t => t.id === precedenciaId);
        if (precedencia) {
          visitar(precedencia);
        }
      }

      enProceso.delete(tarea.id);
      visitados.add(tarea.id);
      resultado.push(tarea);
    };

    for (const tarea of tareas) {
      if (!visitados.has(tarea.id)) {
        visitar(tarea);
      }
    }

    return resultado;
  }

  /**
   * Actualiza el cache de una obra con el camino crítico
   */
  static async actualizarCacheObra(obraId: string) {
    try {
      const resultado = await this.calcularCaminoCritico(obraId);
      const cacheDelegate = prisma.obraCache;

      if (cacheDelegate) {
        await cacheDelegate.upsert({
          where: { obraId },
          create: {
            obraId,
            caminoCritico: resultado.caminoCritico,
            duracionTotal: resultado.duracionTotal,
            ultimaActualizacion: new Date(),
          },
          update: {
            caminoCritico: resultado.caminoCritico,
            duracionTotal: resultado.duracionTotal,
            ultimaActualizacion: new Date(),
          },
        });
      }

      return resultado;
    } catch (error) {
      console.error('Error actualizando cache de obra:', error);
      throw error;
    }
  }

  /**
   * Valida que no haya ciclos en las dependencias
   */
  static async validarDependencias(obraId: string): Promise<boolean> {
    try {
      await this.calcularCaminoCritico(obraId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Ciclo detectado')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Calcula el CPM desde Supabase
   */
  static async calcularCPMDesdeSupabase(obraId: string): Promise<{
    caminoCritico: string[];
    tareasConHolguras: TareaCPM[];
    duracionTotal: number;
  }> {
    const supabase = createServiceSupabaseClient();

    // Obtener tareas de la obra
    const { data: tareas, error: tareasError } = await supabase
      .from('tareas')
      .select('id, title, fecha_inicio_estimada, fecha_fin_estimada, obra_id')
      .eq('obra_id', obraId);

    if (tareasError) {
      throw new Error(`Error obteniendo tareas: ${tareasError.message}`);
    }

    if (!tareas || tareas.length === 0) {
      return {
        caminoCritico: [],
        tareasConHolguras: [],
        duracionTotal: 0,
      };
    }

    // Calcular duración en días para cada tarea
    const tareasConDuracion = tareas.map(tarea => {
      let duracion = 1; // Default

      if (tarea.fecha_inicio_estimada && tarea.fecha_fin_estimada) {
        const inicio = new Date(tarea.fecha_inicio_estimada);
        const fin = new Date(tarea.fecha_fin_estimada);
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        duracion = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        duracion = Math.max(1, duracion); // Mínimo 1 día
      }

      return {
        ...tarea,
        duracion,
      };
    });

    // Obtener precedencias
    const tareaIds = tareasConDuracion.map(t => t.id);
    const { data: precedencias, error: precedenciasError } = await supabase
      .from('tarea_precedencias')
      .select('tarea_id, depende_de, lag_dias')
      .in('tarea_id', tareaIds);

    if (precedenciasError) {
      throw new Error(`Error obteniendo precedencias: ${precedenciasError.message}`);
    }

    // Construir mapa de precedencias
    const precedenciasMap = new Map<string, string[]>();
    const lagDiasMap = new Map<string, number>();

    const precedenciasRows = (precedencias as unknown as PrecedenciaRow[] | null) ?? [];

    precedenciasRows.forEach(prec => {
      if (!precedenciasMap.has(prec.tarea_id)) {
        precedenciasMap.set(prec.tarea_id, []);
      }
      precedenciasMap.get(prec.tarea_id)!.push(prec.depende_de);
      lagDiasMap.set(`${prec.tarea_id}-${prec.depende_de}`, prec.lag_dias || 0);
    });

    // Convertir a formato CPM
    const tareasCPM: TareaCPM[] = tareasConDuracion.map(tarea => ({
      id: tarea.id,
      nombre: tarea.title || 'Sin nombre',
      duracionEstimada: tarea.duracion,
      precedencias: precedenciasMap.get(tarea.id) || [],
    }));

    // Calcular fechas tempranas (forward pass)
    this.calcularFechasTempranas(tareasCPM);

    // Calcular fechas tardías (backward pass)
    this.calcularFechasTardias(tareasCPM);

    // Calcular holguras
    this.calcularHolguras(tareasCPM);

    // Identificar camino crítico
    const caminoCritico = this.identificarCaminoCritico(tareasCPM);

    // Calcular duración total
    const duracionTotal = Math.max(...tareasCPM.map(t => t.fechaFinTemprana || 0));

    return {
      caminoCritico,
      tareasConHolguras: tareasCPM,
      duracionTotal,
    };
  }
}
