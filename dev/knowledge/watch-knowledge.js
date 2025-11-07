#!/usr/bin/env node

/**
 * File Watcher para regenerar automáticamente el conocimiento de GROWS
 * Monitorea cambios en los archivos de seeds y regenera el conocimiento
 */

const fs = require('fs');
const path = require('path');
const { generateKnowledgeFromSeeds } = require('./generate-knowledge.js');

// Archivos a monitorear
const filesToWatch = [
  'prisma/seeds/plantillas-elementos.ts',
  'prisma/seeds/plantillas-tareas.ts',
  'prisma/seeds/suscripciones.ts',
  'prisma/seeds/usuarios.ts',
  'knowledge/grows_context.json'
];

// Configuración del watcher
const watchOptions = {
  persistent: true,
  recursive: false
};

console.log('👀 Iniciando monitoreo de archivos de conocimiento...');
console.log('📁 Archivos monitoreados:');
filesToWatch.forEach(file => {
  console.log(`   - ${file}`);
});
console.log('');

// Función para regenerar conocimiento
function regenerateKnowledge(changedFile) {
  console.log(`🔄 Archivo modificado: ${changedFile}`);
  console.log('🧠 Regenerando base de conocimiento...');
  
  try {
    generateKnowledgeFromSeeds();
    console.log('✅ Base de conocimiento regenerada exitosamente');
    console.log(`⏰ ${new Date().toLocaleString()}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error regenerando conocimiento:', error.message);
  }
}

// Configurar watchers para cada archivo
filesToWatch.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`👁️ Monitoreando: ${filePath}`);
    
    fs.watchFile(fullPath, watchOptions, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        regenerateKnowledge(filePath);
      }
    });
  } else {
    console.log(`⚠️ Archivo no encontrado: ${filePath}`);
  }
});

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo monitoreo de archivos...');
  
  // Limpiar watchers
  filesToWatch.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unwatchFile(fullPath);
    }
  });
  
  console.log('✅ Monitoreo detenido');
  process.exit(0);
});

console.log('🚀 Monitoreo activo. Presiona Ctrl+C para detener.');
console.log('');

// Regenerar conocimiento inicial
console.log('🔄 Regeneración inicial...');
try {
  generateKnowledgeFromSeeds();
  console.log('✅ Conocimiento inicial generado');
} catch (error) {
  console.error('❌ Error en regeneración inicial:', error.message);
}
