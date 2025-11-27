import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer catálogo
const catalogoPath = path.join(__dirname, '../lib/catalogos/catalogo-elementos-constructivos.json');
const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));

// Leer tareas existentes
const tareasPath = path.join(__dirname, '../lib/tareas-construccion.ts');
const tareasContent = fs.readFileSync(tareasPath, 'utf8');

// Extraer todos los IDs de tareas existentes
const idsExistentes = new Set();
const regexId = /"id":\s*"([^"]+)"/g;
let match;
while ((match = regexId.exec(tareasContent)) !== null) {
  idsExistentes.add(match[1]);
}

// Extraer tareas del catálogo
const tareasCatalogo = new Map();

catalogo.categorias.forEach(categoria => {
  categoria.subcategorias.forEach(subcategoria => {
    subcategoria.elementos.forEach(elemento => {
      if (elemento.tareas && Array.isArray(elemento.tareas)) {
        elemento.tareas.forEach(tarea => {
          if (tarea.task_id && typeof tarea === 'object') {
            const taskId = tarea.task_id;
            if (!tareasCatalogo.has(taskId)) {
              tareasCatalogo.set(taskId, {
                id: taskId,
                nombre: tarea.nombre || '',
                fase: tarea.fase || 'obra_gris'
              });
            }
          }
        });
      }
    });
  });
});

// Filtrar tareas que no existen
const tareasFaltantes = Array.from(tareasCatalogo.values())
  .filter(t => !idsExistentes.has(t.id))
  .sort((a, b) => a.id.localeCompare(b.id));

console.log(`\n📊 Total tareas en catálogo: ${tareasCatalogo.size}`);
console.log(`✅ Tareas existentes: ${idsExistentes.size}`);
console.log(`❌ Tareas faltantes: ${tareasFaltantes.length}\n`);

// Mostrar tareas faltantes
if (tareasFaltantes.length > 0) {
  console.log('Tareas faltantes:');
  tareasFaltantes.forEach(t => {
    console.log(`  ${t.id} | ${t.nombre} | ${t.fase}`);
  });
  
  // Guardar en archivo JSON
  const outputPath = path.join(__dirname, '../lib/tareas/tareas-faltantes.json');
  fs.writeFileSync(outputPath, JSON.stringify(tareasFaltantes, null, 2), 'utf8');
  console.log(`\n✅ Guardado en: ${outputPath}`);
} else {
  console.log('✅ Todas las tareas del catálogo ya existen en tareas-construccion.ts');
}






