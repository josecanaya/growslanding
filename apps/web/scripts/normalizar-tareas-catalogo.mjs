/**
 * Script para normalizar tareas del catálogo y vincularlas con tareas reales
 * 
 * Este script:
 * 1. Lee el catálogo JSON completo
 * 2. Extrae todas las tareas (strings) de cada elemento
 * 3. Normaliza los nombres
 * 4. Busca coincidencias en tareas-construccion.ts
 * 5. Crea nuevas tareas para las que no existen
 * 6. Genera archivos normalizados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de archivos (desde la raíz del proyecto)
const CATALOGO_PATH = path.join(__dirname, '../lib/catalogos/catalogo-elementos-constructivos.json');
const TAREAS_CONSTRUCCION_PATH = path.join(__dirname, '../lib/tareas-construccion.ts');
const OUTPUT_NORMALIZADO = path.join(__dirname, '../lib/catalogos/catalogo-elementos-constructivos-normalizado.json');
const OUTPUT_TAREAS_NUEVAS = path.join(__dirname, '../lib/tareas/tareas-generadas-nuevas.json');

// Asegurar que existe el directorio de salida
const outputDir = path.dirname(OUTPUT_TAREAS_NUEVAS);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Leer catálogo
const catalogo = JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf-8'));

// Leer tareas-construccion.ts y extraer el array manualmente
let tareasConstructivas = [];
try {
  const tareasFile = fs.readFileSync(TAREAS_CONSTRUCCION_PATH, 'utf-8');
  
  // Extraer el array usando regex más robusto
  // Buscar desde "export const tareasConstructivas" hasta el "];" final
  const startIndex = tareasFile.indexOf('export const tareasConstructivas');
  if (startIndex === -1) {
    throw new Error('No se encontró "export const tareasConstructivas"');
  }
  
  // Buscar el inicio del array "["
  let arrayStart = tareasFile.indexOf('[', startIndex);
  if (arrayStart === -1) {
    throw new Error('No se encontró el inicio del array');
  }
  
  // Buscar el final del array "];"
  let arrayEnd = tareasFile.lastIndexOf('];');
  if (arrayEnd === -1) {
    throw new Error('No se encontró el final del array');
  }
  
  // Extraer el contenido del array
  const arrayContent = tareasFile.substring(arrayStart, arrayEnd + 1);
  
  // Evaluar el array (cuidado con seguridad, pero es un archivo local confiable)
  // Reemplazar "fase" por "fase:" para que sea JSON válido
  const jsonContent = arrayContent
    .replace(/"fase":\s*"([^"]+)"/g, '"fase":"$1"')
    .replace(/'/g, '"'); // Reemplazar comillas simples por dobles
  
  tareasConstructivas = eval(`(${jsonContent})`);
  
  console.log(`📊 Tareas base encontradas: ${tareasConstructivas.length}`);
} catch (error) {
  console.error('Error leyendo tareas-construccion.ts:', error);
  process.exit(1);
}

// Función para normalizar nombres de tareas
function normalizarNombreTarea(nombre) {
  return nombre
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
    .trim();
}

// Función para calcular similitud entre dos strings
function calcularSimilitud(str1, str2) {
  const s1 = normalizarNombreTarea(str1);
  const s2 = normalizarNombreTarea(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Calcular distancia de Levenshtein simplificada
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0;
  
  let matches = 0;
  const minLen = Math.min(len1, len2);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / maxLen;
}

// Función para buscar tarea en tareasConstructivas
function buscarTareaEnBase(nombreTarea, categoria, subcategoria) {
  const nombreNormalizado = normalizarNombreTarea(nombreTarea);
  
  // 1. Búsqueda exacta (normalizada)
  let mejorMatch = tareasConstructivas.find(t => 
    normalizarNombreTarea(t.nombre) === nombreNormalizado
  );
  
  if (mejorMatch) {
    return { tarea: mejorMatch, similitud: 1.0, metodo: 'exacta' };
  }
  
  // 2. Búsqueda por inclusión
  mejorMatch = tareasConstructivas.find(t => {
    const tNormalizado = normalizarNombreTarea(t.nombre);
    return tNormalizado.includes(nombreNormalizado) || nombreNormalizado.includes(tNormalizado);
  });
  
  if (mejorMatch) {
    return { tarea: mejorMatch, similitud: 0.8, metodo: 'inclusion' };
  }
  
  // 3. Búsqueda por similitud (umbral 0.6)
  let mejorSimilitud = 0;
  let mejorTarea = null;
  
  tareasConstructivas.forEach(t => {
    const sim = calcularSimilitud(t.nombre, nombreTarea);
    if (sim > mejorSimilitud && sim >= 0.6) {
      mejorSimilitud = sim;
      mejorTarea = t;
    }
  });
  
  if (mejorTarea) {
    return { tarea: mejorTarea, similitud: mejorSimilitud, metodo: 'similitud' };
  }
  
  return null;
}

// Función para determinar fase desde nombre y contexto
function determinarFase(nombreTarea, categoria, subcategoria) {
  const nombreLower = nombreTarea.toLowerCase();
  
  // Terminaciones (prioridad alta)
  if (
    nombreLower.includes('pintura') ||
    nombreLower.includes('cerámica') ||
    nombreLower.includes('ceramica') ||
    nombreLower.includes('porcelanato') ||
    nombreLower.includes('grifería') ||
    nombreLower.includes('griferia') ||
    nombreLower.includes('artefactos') ||
    nombreLower.includes('pulido') ||
    nombreLower.includes('barniz') ||
    nombreLower.includes('laca') ||
    nombreLower.includes('lijado') ||
    nombreLower.includes('masillado') ||
    nombreLower.includes('canaletas') ||
    nombreLower.includes('babetas') ||
    nombreLower.includes('zócalos') ||
    nombreLower.includes('zocalos')
  ) {
    return 'terminaciones';
  }
  
  // Estructura
  if (
    nombreLower.includes('replanteo') ||
    nombreLower.includes('excavación') ||
    nombreLower.includes('excavacion') ||
    nombreLower.includes('hormigon') ||
    nombreLower.includes('hormigón') ||
    nombreLower.includes('columna') ||
    nombreLower.includes('viga') ||
    nombreLower.includes('losa') ||
    nombreLower.includes('demolición') ||
    nombreLower.includes('demolicion') ||
    nombreLower.includes('compactación') ||
    nombreLower.includes('compactacion') ||
    nombreLower.includes('estructura') ||
    nombreLower.includes('mampostería') ||
    nombreLower.includes('mamposteria') ||
    nombreLower.includes('fundación') ||
    nombreLower.includes('fundacion') ||
    nombreLower.includes('carga en volquete') ||
    nombreLower.includes('retiro de basura') ||
    nombreLower.includes('desmalezado') ||
    nombreLower.includes('colocación tablero') ||
    nombreLower.includes('conexión pilar') ||
    nombreLower.includes('colocación postes') ||
    nombreLower.includes('atado') ||
    nombreLower.includes('fijación') ||
    nombreLower.includes('tensado') ||
    nombreLower.includes('impresión cartel') ||
    nombreLower.includes('verificación') ||
    nombreLower.includes('colocación casilla') ||
    nombreLower.includes('cercado') ||
    nombreLower.includes('señalización') ||
    nombreLower.includes('senalizacion')
  ) {
    return 'estructura';
  }
  
  // Obra gris (por defecto si no es terminaciones ni estructura)
  return 'obra_gris';
}

// Función para generar código único para nueva tarea
function generarCodigoTarea(nombreTarea, categoria) {
  const nombreNormalizado = normalizarNombreTarea(nombreTarea);
  const palabras = nombreNormalizado.split(' ').filter(p => p.length > 2);
  
  // Intentar generar código basado en primeras letras
  let codigo = '';
  if (palabras.length >= 2) {
    codigo = palabras[0].substring(0, 3).toUpperCase() + palabras[1].substring(0, 2).toUpperCase();
  } else if (palabras.length === 1) {
    codigo = palabras[0].substring(0, 5).toUpperCase();
  } else {
    codigo = 'TAR' + Math.random().toString(36).substring(2, 5).toUpperCase();
  }
  
  // Verificar que no exista
  let codigoFinal = codigo + '001';
  let contador = 1;
  while (tareasConstructivas.find(t => t.id === codigoFinal)) {
    contador++;
    codigoFinal = codigo + String(contador).padStart(3, '0');
  }
  
  return codigoFinal;
}

// Función para estimar coef_operativo basado en tipo de tarea
function estimarCoefOperativo(nombreTarea, unidad) {
  const nombreLower = nombreTarea.toLowerCase();
  
  // Valores por tipo de tarea
  if (nombreLower.includes('replanteo')) return 8.0;
  if (nombreLower.includes('excavación') || nombreLower.includes('excavacion')) return 6.0;
  if (nombreLower.includes('hormigon') || nombreLower.includes('hormigón')) return 1.5;
  if (nombreLower.includes('mampostería') || nombreLower.includes('mamposteria')) return 2.5;
  if (nombreLower.includes('revoque')) return 0.8;
  if (nombreLower.includes('pintura')) return 0.4;
  if (nombreLower.includes('instalación') || nombreLower.includes('instalacion')) return 4.0;
  if (nombreLower.includes('compactación') || nombreLower.includes('compactacion')) return 0.3;
  if (nombreLower.includes('colocación') || nombreLower.includes('colocacion')) return 1.0;
  
  // Valores por unidad
  if (unidad === 'unidad') return 2.0;
  if (unidad === 'm²' || unidad === 'm2') return 0.5;
  if (unidad === 'm³' || unidad === 'm3') return 1.5;
  if (unidad === 'ml' || unidad === 'metro') return 0.8;
  
  return 1.0; // Por defecto
}

// Extraer todas las tareas del catálogo
const tareasDelCatalogo = new Map(); // Map<normalized_name, {original, categoria, subcategoria, elemento}>

catalogo.categorias.forEach(categoria => {
  categoria.subcategorias.forEach(subcategoria => {
    subcategoria.elementos.forEach(elemento => {
      if (elemento.tareas && Array.isArray(elemento.tareas)) {
        elemento.tareas.forEach(tareaNombre => {
          const normalized = normalizarNombreTarea(tareaNombre);
          if (!tareasDelCatalogo.has(normalized)) {
            tareasDelCatalogo.set(normalized, {
              original: tareaNombre,
              categoria: categoria.categoria,
              subcategoria: subcategoria.nombre,
              elemento: elemento.nombre,
              elementoId: elemento.id,
              unidad: elemento.unidad || 'unidad'
            });
          }
        });
      }
    });
  });
});

console.log(`📋 Tareas únicas en catálogo: ${tareasDelCatalogo.size}`);

// Procesar cada tarea del catálogo
const tareasMapeadas = new Map(); // Map<normalized_name, {task_id, nombre, fase, ...}>
const tareasNuevas = [];

tareasDelCatalogo.forEach((info, normalizedName) => {
  const match = buscarTareaEnBase(info.original, info.categoria, info.subcategoria);
  
  if (match && match.similitud >= 0.6) {
    // Tarea existe en base
    tareasMapeadas.set(normalizedName, {
      task_id: match.tarea.id, // Usar ID del código (REP001, etc.)
      nombre: match.tarea.nombre,
      fase: match.tarea.fase,
      unidad: match.tarea.unidad,
      coef_operativo: match.tarea.coef_operativo,
      codigo: match.tarea.id,
      metodo_match: match.metodo,
      similitud: match.similitud
    });
  } else {
    // Tarea NO existe, crear nueva
    const fase = determinarFase(info.original, info.categoria, info.subcategoria);
    const codigo = generarCodigoTarea(info.original, info.categoria);
    const coef = estimarCoefOperativo(info.original, info.unidad);
    
    const nuevaTarea = {
      id: codigo,
      nombre: info.original.charAt(0).toUpperCase() + info.original.slice(1), // Capitalizar primera letra
      descripcion: `${info.original} para ${info.elemento}`,
      fase: fase,
      unidad: info.unidad,
      coef_operativo: coef,
      codigo: codigo,
      categoria_origen: info.categoria,
      subcategoria_origen: info.subcategoria,
      elemento_origen: info.elemento
    };
    
    tareasNuevas.push(nuevaTarea);
    tareasConstructivas.push(nuevaTarea); // Agregar a la lista para evitar duplicados
    
    tareasMapeadas.set(normalizedName, {
      task_id: codigo,
      nombre: nuevaTarea.nombre,
      fase: fase,
      unidad: info.unidad,
      coef_operativo: coef,
      codigo: codigo,
      metodo_match: 'nueva',
      similitud: 0
    });
  }
});

console.log(`✅ Tareas mapeadas: ${tareasMapeadas.size}`);
console.log(`🆕 Tareas nuevas a crear: ${tareasNuevas.length}`);

// Validar duplicados
const duplicados = [];
const nombresVistos = new Map();
const codigosVistos = new Map();

tareasMapeadas.forEach((tarea, normalizedName) => {
  // Verificar duplicados por nombre
  if (nombresVistos.has(normalizedName)) {
    duplicados.push({
      tipo: 'nombre',
      nombre: normalizedName,
      tarea1: nombresVistos.get(normalizedName),
      tarea2: tarea
    });
  } else {
    nombresVistos.set(normalizedName, tarea);
  }
  
  // Verificar duplicados por código
  if (codigosVistos.has(tarea.codigo)) {
    duplicados.push({
      tipo: 'codigo',
      codigo: tarea.codigo,
      tarea1: codigosVistos.get(tarea.codigo),
      tarea2: tarea
    });
  } else {
    codigosVistos.set(tarea.codigo, tarea);
  }
});

if (duplicados.length > 0) {
  console.warn(`⚠️  Duplicados encontrados: ${duplicados.length}`);
  duplicados.forEach(dup => console.warn('  -', dup));
}

// Generar catálogo normalizado
const catalogoNormalizado = JSON.parse(JSON.stringify(catalogo)); // Deep clone

catalogoNormalizado.categorias.forEach(categoria => {
  categoria.subcategorias.forEach(subcategoria => {
    subcategoria.elementos.forEach(elemento => {
      if (elemento.tareas && Array.isArray(elemento.tareas)) {
        // Reemplazar array de strings por array de objetos con task_id
        elemento.tareas = elemento.tareas.map(tareaNombre => {
          const normalized = normalizarNombreTarea(tareaNombre);
          const mapeada = tareasMapeadas.get(normalized);
          
          if (mapeada) {
            return {
              task_id: mapeada.task_id,
              nombre: mapeada.nombre,
              fase: mapeada.fase
            };
          } else {
            console.warn(`⚠️  No se pudo mapear tarea: "${tareaNombre}"`);
            return {
              task_id: 'UNKNOWN',
              nombre: tareaNombre,
              fase: 'obra_gris'
            };
          }
        });
      }
    });
  });
});

// Guardar archivos
fs.writeFileSync(
  OUTPUT_NORMALIZADO,
  JSON.stringify(catalogoNormalizado, null, 2),
  'utf-8'
);

fs.writeFileSync(
  OUTPUT_TAREAS_NUEVAS,
  JSON.stringify(tareasNuevas, null, 2),
  'utf-8'
);

console.log(`\n✅ Archivos generados:`);
console.log(`   - ${OUTPUT_NORMALIZADO}`);
console.log(`   - ${OUTPUT_TAREAS_NUEVAS}`);
console.log(`\n📊 Resumen:`);
console.log(`   - Tareas procesadas: ${tareasDelCatalogo.size}`);
console.log(`   - Tareas mapeadas: ${tareasMapeadas.size}`);
console.log(`   - Tareas nuevas: ${tareasNuevas.length}`);
console.log(`   - Duplicados: ${duplicados.length}`);




