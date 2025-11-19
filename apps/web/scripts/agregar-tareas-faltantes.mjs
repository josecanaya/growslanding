import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer tareas faltantes
const faltantesPath = path.join(__dirname, '../lib/tareas/tareas-faltantes.json');
const tareasFaltantes = JSON.parse(fs.readFileSync(faltantesPath, 'utf8'));

// Leer tareas existentes
const tareasPath = path.join(__dirname, '../lib/tareas-construccion.ts');
const tareasContent = fs.readFileSync(tareasPath, 'utf8');

// Función para determinar unidad y coef_operativo basándose en el nombre y fase
function determinarUnidadYCoef(nombre, fase) {
  const nombreLower = nombre.toLowerCase();
  
  // Patrones para unidades
  let unidad = 'unidad'; // default
  let coef_operativo = 1.0; // default
  
  // Determinar unidad
  if (nombreLower.includes('cañería') || nombreLower.includes('caneria') || 
      nombreLower.includes('cable') || nombreLower.includes('conduit') ||
      nombreLower.includes('zócalo') || nombreLower.includes('zocalo') ||
      nombreLower.includes('canaleta') || nombreLower.includes('babetas') ||
      nombreLower.includes('babeta')) {
    unidad = 'ml';
  } else if (nombreLower.includes('m²') || nombreLower.includes('m2') ||
             nombreLower.includes('revoque') || nombreLower.includes('pintura') ||
             nombreLower.includes('aislación') || nombreLower.includes('aislacion') ||
             nombreLower.includes('carpeta') || nombreLower.includes('contrapiso') ||
             nombreLower.includes('cerámico') || nombreLower.includes('ceramico') ||
             nombreLower.includes('pegado') || nombreLower.includes('masillado') ||
             nombreLower.includes('pulido') || nombreLower.includes('lijado') ||
             nombreLower.includes('barniz') || nombreLower.includes('laca') ||
             nombreLower.includes('superficie') || nombreLower.includes('nivelación') ||
             nombreLower.includes('nivelacion') || nombreLower.includes('preparación') ||
             nombreLower.includes('preparacion') || nombreLower.includes('imprimación') ||
             nombreLower.includes('imprimacion') || nombreLower.includes('sellador') ||
             nombreLower.includes('protección') || nombreLower.includes('proteccion') ||
             nombreLower.includes('capa') || nombreLower.includes('malla') ||
             nombreLower.includes('geotextil') || nombreLower.includes('tierra') ||
             nombreLower.includes('césped') || nombreLower.includes('cesped') ||
             nombreLower.includes('extendido') || nombreLower.includes('fratazado') ||
             nombreLower.includes('alisado') || nombreLower.includes('corte') ||
             nombreLower.includes('armado') || nombreLower.includes('armadura') ||
             nombreLower.includes('hormigonado') || nombreLower.includes('hormigon') ||
             nombreLower.includes('encofrado') || nombreLower.includes('curado') ||
             nombreLower.includes('vibrado') || nombreLower.includes('colocación') ||
             nombreLower.includes('colocacion') || nombreLower.includes('montaje') ||
             nombreLower.includes('estructura') || nombreLower.includes('cerramiento') ||
             nombreLower.includes('ventilación') || nombreLower.includes('ventilacion') ||
             nombreLower.includes('desagüe') || nombreLower.includes('desague') ||
             nombreLower.includes('placa') || nombreLower.includes('tabique') ||
             nombreLower.includes('mampostería') || nombreLower.includes('mamposteria')) {
    unidad = 'm2';
  } else if (nombreLower.includes('m³') || nombreLower.includes('m3') ||
             nombreLower.includes('hormigón') || nombreLower.includes('hormigon') ||
             nombreLower.includes('relleno') || nombreLower.includes('excavación') ||
             nombreLower.includes('excavacion') || nombreLower.includes('compactación') ||
             nombreLower.includes('compactacion') || nombreLower.includes('carga') ||
             nombreLower.includes('escombros') || nombreLower.includes('demolición') ||
             nombreLower.includes('demolicion')) {
    unidad = 'm3';
  }
  
  // Determinar coef_operativo basándose en el tipo de tarea
  if (fase === 'estructura') {
    if (nombreLower.includes('replanteo')) {
      coef_operativo = 8.0;
    } else if (nombreLower.includes('excavación') || nombreLower.includes('excavacion')) {
      coef_operativo = 2.5;
    } else if (nombreLower.includes('encofrado')) {
      coef_operativo = 1.2;
    } else if (nombreLower.includes('armado') || nombreLower.includes('armadura') || nombreLower.includes('colocación armadura') || nombreLower.includes('colocacion armadura')) {
      coef_operativo = 2.0;
    } else if (nombreLower.includes('hormigonado') || nombreLower.includes('hormigon')) {
      coef_operativo = 1.5;
    } else if (nombreLower.includes('mampostería') || nombreLower.includes('mamposteria')) {
      coef_operativo = 2.4;
    } else if (nombreLower.includes('montaje') || nombreLower.includes('estructura')) {
      coef_operativo = 2.0;
    } else if (nombreLower.includes('colocación') || nombreLower.includes('colocacion')) {
      coef_operativo = 1.5;
    } else {
      coef_operativo = 1.5;
    }
  } else if (fase === 'obra_gris') {
    if (nombreLower.includes('revoque')) {
      if (nombreLower.includes('grueso')) {
        coef_operativo = 0.8;
      } else if (nombreLower.includes('fino')) {
        coef_operativo = 0.6;
      } else {
        coef_operativo = 0.7;
      }
    } else if (nombreLower.includes('instalación') || nombreLower.includes('instalacion') || 
               nombreLower.includes('cañería') || nombreLower.includes('caneria') ||
               nombreLower.includes('conexión') || nombreLower.includes('conexion')) {
      coef_operativo = 1.2;
    } else if (nombreLower.includes('carpeta') || nombreLower.includes('contrapiso')) {
      coef_operativo = 1.0;
    } else if (nombreLower.includes('aislación') || nombreLower.includes('aislacion')) {
      coef_operativo = 0.8;
    } else if (nombreLower.includes('nivelación') || nombreLower.includes('nivelacion')) {
      coef_operativo = 0.5;
    } else if (nombreLower.includes('preparación') || nombreLower.includes('preparacion')) {
      coef_operativo = 0.4;
    } else if (nombreLower.includes('prueba') || nombreLower.includes('verificación') || nombreLower.includes('verificacion')) {
      coef_operativo = 0.3;
    } else if (nombreLower.includes('limpieza') || nombreLower.includes('carga') || nombreLower.includes('traslado')) {
      coef_operativo = 0.5;
    } else {
      coef_operativo = 1.0;
    }
  } else if (fase === 'terminaciones') {
    if (nombreLower.includes('pintura')) {
      coef_operativo = 0.4;
    } else if (nombreLower.includes('cerámico') || nombreLower.includes('ceramico') || nombreLower.includes('pegado')) {
      coef_operativo = 1.2;
    } else if (nombreLower.includes('grifería') || nombreLower.includes('griferia')) {
      coef_operativo = 0.8;
    } else if (nombreLower.includes('artefactos') || nombreLower.includes('colocación artefactos') || nombreLower.includes('colocacion artefactos')) {
      coef_operativo = 1.0;
    } else if (nombreLower.includes('masillado')) {
      coef_operativo = 0.6;
    } else if (nombreLower.includes('pulido') || nombreLower.includes('lijado')) {
      coef_operativo = 0.5;
    } else if (nombreLower.includes('barniz') || nombreLower.includes('laca')) {
      coef_operativo = 0.4;
    } else {
      coef_operativo = 0.8;
    }
  }
  
  return { unidad, coef_operativo };
}

// Generar código TypeScript para las nuevas tareas
const nuevasTareas = tareasFaltantes.map(tarea => {
  const { unidad, coef_operativo } = determinarUnidadYCoef(tarea.nombre, tarea.fase);
  
  return `  {
    "id": "${tarea.id}",
    "nombre": "${tarea.nombre}",
    "unidad": "${unidad}",
    "coef_operativo": ${coef_operativo},
    "fase": "${tarea.fase}"
  }`;
});

// Insertar antes del cierre del array
const nuevoCodigo = nuevasTareas.join(',\n');

// Leer el archivo y encontrar dónde insertar
const lines = tareasContent.split('\n');
const ultimaLinea = lines.length - 1;

// Buscar la última tarea (antes del cierre del array)
let insertIndex = -1;
for (let i = ultimaLinea - 1; i >= 0; i--) {
  if (lines[i].trim() === ']') {
    insertIndex = i;
    break;
  }
}

if (insertIndex === -1) {
  console.error('❌ No se encontró el cierre del array');
  process.exit(1);
}

// Verificar si la última tarea tiene coma
const ultimaTareaIndex = insertIndex - 1;
if (ultimaTareaIndex >= 0 && !lines[ultimaTareaIndex].trim().endsWith(',')) {
  // Agregar coma a la última tarea existente
  lines[ultimaTareaIndex] = lines[ultimaTareaIndex].trim() + ',';
}

// Insertar las nuevas tareas (con coma al final de la última)
const codigoConComa = nuevoCodigo.replace(/(\n  \}$)/g, ',\n  }');
lines.splice(insertIndex, 0, codigoConComa);

const nuevoContenido = lines.join('\n');

// Guardar
fs.writeFileSync(tareasPath, nuevoContenido, 'utf8');

console.log(`✅ Agregadas ${nuevasTareas.length} tareas a tareas-construccion.ts`);
console.log(`\n📋 Resumen:`);
console.log(`   - Estructura: ${tareasFaltantes.filter(t => t.fase === 'estructura').length}`);
console.log(`   - Obra Gris: ${tareasFaltantes.filter(t => t.fase === 'obra_gris').length}`);
console.log(`   - Terminaciones: ${tareasFaltantes.filter(t => t.fase === 'terminaciones').length}`);

