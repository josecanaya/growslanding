import catalogoData from '@/lib/catalogos/catalogo-elementos-constructivos.json';
import { tareasConstructivas } from '@/lib/tareas-construccion';

export interface ElementoSeleccionado {
  id: string;
  categoria: string;
  tipo: string;
  cantidad: number;
  unidad: 'm²' | 'm³' | 'unidad';
  nombre?: string; // Nombre del elemento (opcional, se puede inferir del id)
  opciones?: Record<string, string>; // Opciones seleccionadas (ej: { "Espesor": "30 cm", "terminacion_exterior": "ladrillo visto" })
  descripcion?: string; // Descripción que puede contener las opciones en formato texto
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
 * Busca un elemento en el catálogo por su id o nombre
 */
function encontrarElementoEnCatalogo(
  elementoSeleccionado: ElementoSeleccionado
): { elemento: any; categoria: any; subcategoria: any } | null {
  // Función para normalizar strings (eliminar acentos, espacios, etc.)
  const normalizar = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/\s+/g, ' '); // Normalizar espacios
  };

  // Buscar por ID exacto primero
  for (const categoria of catalogoData.categorias) {
    for (const subcategoria of categoria.subcategorias) {
      const elemento = subcategoria.elementos.find(
        (el) => el.id === elementoSeleccionado.id
      );
      if (elemento) {
        return { elemento, categoria, subcategoria };
      }
    }
  }

  // Si no se encontró por ID, buscar por nombre del elemento
  const nombreElemento = elementoSeleccionado.nombre || elementoSeleccionado.tipo;
  if (nombreElemento) {
    const nombreNormalizado = normalizar(nombreElemento);
    
    for (const categoria of catalogoData.categorias) {
      // Verificar si la categoría coincide
      const categoriaCoincide =
        normalizar(categoria.categoria) === normalizar(elementoSeleccionado.categoria) ||
        normalizar(categoria.categoria).includes(normalizar(elementoSeleccionado.categoria).split(' ')[0]) ||
        normalizar(elementoSeleccionado.categoria).includes(normalizar(categoria.categoria).split(' ')[0]);

      if (!categoriaCoincide && elementoSeleccionado.categoria) {
        continue; // Saltar si la categoría no coincide
      }

      for (const subcategoria of categoria.subcategorias) {
        for (const elemento of subcategoria.elementos) {
          const elementoNombreNormalizado = normalizar(elemento.nombre);
          
          // Match exacto
          if (elementoNombreNormalizado === nombreNormalizado) {
            return { elemento, categoria, subcategoria };
          }
          
          // Match por inclusión
          if (
            elementoNombreNormalizado.includes(nombreNormalizado) ||
            nombreNormalizado.includes(elementoNombreNormalizado)
          ) {
            return { elemento, categoria, subcategoria };
          }
          
          // Match por palabras clave
          const palabrasElemento = nombreNormalizado.split(' ');
          const palabrasCatalogo = elementoNombreNormalizado.split(' ');
          const palabrasComunes = palabrasElemento.filter((p) =>
            palabrasCatalogo.some((pc) => pc.includes(p) || p.includes(pc))
          );
          
          if (palabrasComunes.length >= 2) {
            return { elemento, categoria, subcategoria };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Evalúa una condición simple contra las opciones seleccionadas
 * Ejemplos:
 * - "espesor === '30 cm'" → true si opciones.espesor === "30 cm"
 * - "aislacion !== 'sin aislación'" → true si opciones.aislacion !== "sin aislación"
 * - "terminacion_exterior === 'ladrillo visto'" → true si opciones.terminacion_exterior === "ladrillo visto"
 */
function evaluarCondicion(condicion: string, opciones: Record<string, string>): boolean {
  try {
    // Normalizar claves (sin espacios, lowercase, reemplazar mayúsculas)
    const normalizarClave = (clave: string) => clave.toLowerCase().replace(/\s+/g, '_');
    const normalizarValor = (valor: string) => valor.trim().toLowerCase();
    
    // Crear mapa normalizado de opciones
    const opcionesNormalizadas: Record<string, string> = {};
    Object.keys(opciones).forEach(clave => {
      const claveNormalizada = normalizarClave(clave);
      opcionesNormalizadas[claveNormalizada] = normalizarValor(opciones[clave]);
    });

    console.log('  🔍 Evaluando condición:', condicion);
    console.log('  🔍 Opciones normalizadas:', opcionesNormalizadas);

    // Extraer la operación (===, !==, etc.) y los valores
    // Formato esperado: "clave === 'valor'" o "clave !== 'valor'"
    const match = condicion.match(/^(\w+)\s*(===|!==)\s*['"]([^'"]+)['"]$/);
    
    if (match) {
      const [, claveCondicion, operador, valorEsperado] = match;
      const claveNormalizada = normalizarClave(claveCondicion);
      const valorEsperadoNormalizado = normalizarValor(valorEsperado);
      const valorActual = opcionesNormalizadas[claveNormalizada];

      console.log(`  🔍 Comparando: "${valorActual}" ${operador} "${valorEsperadoNormalizado}"`);

      if (operador === '===') {
        const resultado = valorActual === valorEsperadoNormalizado;
        console.log(`  ${resultado ? '✅' : '❌'} Resultado: ${resultado}`);
        return resultado;
      } else if (operador === '!==') {
        const resultado = valorActual !== valorEsperadoNormalizado;
        console.log(`  ${resultado ? '✅' : '❌'} Resultado: ${resultado}`);
        return resultado;
      }
    }

    // Fallback: intentar evaluación directa (método anterior)
    let condicionFinal = condicion;
    const clavesEnCondicion = condicion.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g) || [];
    
    clavesEnCondicion.forEach(claveOriginal => {
      const claveNormalizada = normalizarClave(claveOriginal);
      if (opcionesNormalizadas[claveNormalizada]) {
        const valor = opcionesNormalizadas[claveNormalizada];
        // Reemplazar la clave con su valor entre comillas
        condicionFinal = condicionFinal.replace(
          new RegExp(`\\b${claveOriginal}\\b`, 'g'),
          `"${valor}"`
        );
      }
    });

    // Normalizar también los valores en la condición
    condicionFinal = condicionFinal.replace(/'([^']+)'/g, (match, valor) => {
      return `"${normalizarValor(valor)}"`;
    });

    console.log(`  🔍 Condición final: ${condicionFinal}`);
    const resultado = eval(condicionFinal);
    console.log(`  ${resultado ? '✅' : '❌'} Resultado: ${resultado}`);
    return Boolean(resultado);
  } catch (error) {
    console.warn(`⚠️  Error evaluando condición "${condicion}":`, error);
    // Si hay error, incluir la tarea por defecto (comportamiento conservador)
    return true;
  }
}

export class ExpansorElementos {
  static expandirElementos(elementosSeleccionados: ElementoSeleccionado[]): TareaGenerada[] {
    console.log('🔍 ExpansorElementos: Iniciando expansión de elementos');
    console.log('📦 Elementos seleccionados:', elementosSeleccionados);
    console.log('📋 Total tareas constructivas disponibles:', tareasConstructivas.length);
    
    const tareasGeneradas: TareaGenerada[] = [];

    elementosSeleccionados.forEach((elementoSeleccionado, index) => {
      console.log(`\n🔍 Procesando elemento ${index + 1}:`, elementoSeleccionado);
      
      // Buscar elemento en el catálogo
      const resultadoCatalogo = encontrarElementoEnCatalogo(elementoSeleccionado);
      
      if (!resultadoCatalogo) {
        console.error(
          `❌ ERROR: No se pudo encontrar elemento '${elementoSeleccionado.id}' o '${elementoSeleccionado.tipo}' en el catálogo`
        );
        console.log(
          `[ExpansorElementos] Categorías disponibles:`,
          catalogoData.categorias.map((c) => c.categoria).join(', ')
        );
        return; // Continuar con el siguiente elemento
      }

      const { elemento, categoria, subcategoria } = resultadoCatalogo;
      console.log('✅ Elemento encontrado en catálogo:', elemento.nombre);
      console.log('📁 Categoría:', categoria.categoria);
      console.log('📂 Subcategoría:', subcategoria.nombre);

      // Obtener tareas del elemento desde el catálogo
      const tareasDelElemento = elemento.tareas || [];
      
      if (!Array.isArray(tareasDelElemento) || tareasDelElemento.length === 0) {
        console.warn(`⚠️  El elemento '${elemento.nombre}' no tiene tareas definidas en el catálogo`);
        return; // Continuar con el siguiente elemento
      }

      console.log('📝 Tareas del elemento en catálogo:', tareasDelElemento.length);

      // Extraer opciones de la descripción si no vienen explícitas
      let opcionesSeleccionadas: Record<string, string> = elementoSeleccionado.opciones || {};
      
      if (Object.keys(opcionesSeleccionadas).length === 0 && elementoSeleccionado.descripcion) {
        // Intentar parsear opciones desde la descripción
        // Formato esperado: "Configuracion: simple | Aislacion: sin aislación | Terminacion Exterior: ladrillo visto | ..."
        const descripcion = elementoSeleccionado.descripcion;
        const partes = descripcion.split('|').map(p => p.trim());
        opcionesSeleccionadas = {};
        partes.forEach(parte => {
          const match = parte.match(/^([^:]+):\s*(.+)$/);
          if (match) {
            const clave = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            const valor = match[2].trim();
            opcionesSeleccionadas[clave] = valor;
          }
        });
      }

      console.log('🔧 Opciones seleccionadas:', opcionesSeleccionadas);

      // Procesar cada tarea del catálogo
      tareasDelElemento.forEach((tareaRef, tareaIndex) => {
        // El catálogo tiene tareas con estructura: { task_id, nombre, fase, condicion? }
        // Usamos task_id como el id técnico para buscar en tareas-construccion.ts
        const taskId = tareaRef.task_id || tareaRef.id;
        const nombreTareaCatalogo = tareaRef.nombre;
        const faseTareaCatalogo = tareaRef.fase;
        const condicion = tareaRef.condicion;

        // Evaluar condición si existe
        // IMPORTANTE: Si NO hay condición, la tarea se incluye SIEMPRE
        // Si hay condición, se evalúa contra las opciones
        if (condicion) {
          // Si hay condición pero no hay opciones, incluir la tarea por defecto (comportamiento conservador)
          if (Object.keys(opcionesSeleccionadas).length === 0) {
            console.log(`  ⚠️  Tarea ${nombreTareaCatalogo} tiene condición pero no hay opciones, incluyendo por defecto`);
          } else {
            const cumpleCondicion = evaluarCondicion(condicion, opcionesSeleccionadas);
            if (!cumpleCondicion) {
              console.log(`  ⏭️  Tarea ${nombreTareaCatalogo} no cumple condición: ${condicion}`);
              return; // Saltar esta tarea
            }
            console.log(`  ✅ Tarea ${nombreTareaCatalogo} cumple condición: ${condicion}`);
          }
        } else {
          console.log(`  ✅ Tarea ${nombreTareaCatalogo} sin condición, incluyendo siempre`);
        }

        if (!taskId) {
          console.warn(
            `⚠️  Tarea ${tareaIndex + 1} del elemento '${elemento.nombre}' no tiene task_id válido:`,
            tareaRef
          );
          return; // Saltar esta tarea
        }

        console.log(`\n  🔍 Buscando tarea ${tareaIndex + 1}: ${taskId} (${nombreTareaCatalogo})`);

        // Buscar la tarea completa en tareas-construccion.ts usando el task_id como id
        const tareaTecnica = tareasConstructivas.find((t) => t.id === taskId);

        if (!tareaTecnica) {
          console.warn(
            `⚠️  No se encontró la tarea técnica con id '${taskId}' en tareas-construccion.ts`
          );
        console.warn(
            `   Tarea del catálogo: ${nombreTareaCatalogo}, Fase: ${faseTareaCatalogo}`
          );
          return; // Saltar esta tarea si no existe en tareas-construccion.ts
        }

        console.log(`  ✅ Tarea técnica encontrada: ${tareaTecnica.nombre} (${tareaTecnica.id})`);

        // Calcular tiempo estimado
        const tiempoEstimado = this.calcularTiempoEstimado(
          tareaTecnica,
          elementoSeleccionado.cantidad,
          elementoSeleccionado.unidad
        );

        // Calcular fechas
            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + tiempoEstimado);
            
        // Generar tarea con la estructura exacta requerida
            const tareaGenerada: TareaGenerada = {
          id: tareaTecnica.id, // ID técnico (REP001, HOR003, etc.)
          nombre: tareaTecnica.nombre, // Nombre real de la tarea
              cantidad: elementoSeleccionado.cantidad,
          unidad: tareaTecnica.unidad,
          coef_operativo: tareaTecnica.coef_operativo,
          fase: tareaTecnica.fase, // Fase de la tarea técnica
              tiempoEstimado,
              fechaInicio,
              fechaFin,
              elementoOrigen: {
                categoria: elementoSeleccionado.categoria,
                tipo: elementoSeleccionado.tipo,
                cantidad: elementoSeleccionado.cantidad,
            unidad: elementoSeleccionado.unidad,
          },
        };

        console.log('  ✅ Tarea generada:', {
          id: tareaGenerada.id,
          nombre: tareaGenerada.nombre,
          fase: tareaGenerada.fase,
          unidad: tareaGenerada.unidad,
          coef_operativo: tareaGenerada.coef_operativo,
        });

        tareasGeneradas.push(tareaGenerada);
      });
    });

    console.log('\n🎯 Resultado final:');
    console.log('📊 Total tareas generadas:', tareasGeneradas.length);
    console.log('📋 Tareas generadas (primeras 5):', tareasGeneradas.slice(0, 5).map(t => ({
      id: t.id,
      nombre: t.nombre,
      fase: t.fase
    })));
    
    return tareasGeneradas;
  }

  private static calcularTiempoEstimado(
    tareaOriginal: { coef_operativo: number },
    cantidad: number,
    unidadElemento: string
  ): number {
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
