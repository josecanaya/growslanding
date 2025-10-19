#!/usr/bin/env node

/**
 * Script para generar el archivo de conocimiento de GROWS
 * Se ejecuta automáticamente cuando cambian los seeds de Prisma
 */

const fs = require('fs');
const path = require('path');

// Función para leer y procesar los seeds de Prisma
function generateKnowledgeFromSeeds() {
  const seedsDir = path.join(__dirname, 'prisma', 'seeds');
  const knowledgeFile = path.join(__dirname, 'knowledge', 'grows_context.json');
  
  console.log('🔄 Generando archivo de conocimiento de GROWS...');
  
  try {
    // Leer archivos de seeds
    const seedFiles = [
      'plantillas-elementos.ts',
      'plantillas-tareas.ts', 
      'suscripciones.ts',
      'usuarios.ts'
    ];
    
    let knowledge = {
      "descripcion_general": "GROWS es una plataforma B2B de gestión inteligente de obras que centraliza la planificación, ejecución y control de proyectos de construcción de pequeña y mediana escala.",
      "ultima_actualizacion": new Date().toISOString(),
      "version": "1.0.0",
      "seeds_procesados": [],
      "plantillas_elementos": [],
      "plantillas_tareas": [],
      "tipos_suscripcion": [],
      "roles_usuario": []
    };
    
    // Procesar cada archivo de seed
    seedFiles.forEach(file => {
      const filePath = path.join(seedsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Procesando: ${file}`);
        knowledge.seeds_procesados.push(file);
        
        // Leer contenido del archivo
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extraer información relevante según el tipo de archivo
        if (file.includes('elementos')) {
          knowledge.plantillas_elementos = extractElementos(content);
        } else if (file.includes('tareas')) {
          knowledge.plantillas_tareas = extractTareas(content);
        } else if (file.includes('suscripciones')) {
          knowledge.tipos_suscripcion = extractSuscripciones(content);
        } else if (file.includes('usuarios')) {
          knowledge.roles_usuario = extractUsuarios(content);
        }
      }
    });
    
    // Escribir archivo de conocimiento
    fs.writeFileSync(knowledgeFile, JSON.stringify(knowledge, null, 2));
    console.log('✅ Archivo de conocimiento generado:', knowledgeFile);
    
    return knowledge;
    
  } catch (error) {
    console.error('❌ Error generando conocimiento:', error);
    throw error;
  }
}

// Funciones para extraer información específica
function extractElementos(content) {
  // Extraer elementos de las plantillas
  const elementos = [];
  const regex = /nombre:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    elementos.push({
      nombre: match[1],
      tipo: 'elemento_constructivo'
    });
  }
  
  return elementos;
}

function extractTareas(content) {
  // Extraer tareas de las plantillas
  const tareas = [];
  const regex = /nombre:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    tareas.push({
      nombre: match[1],
      tipo: 'tarea_constructiva'
    });
  }
  
  return tareas;
}

function extractSuscripciones(content) {
  // Extraer tipos de suscripción
  const suscripciones = [];
  const regex = /nombre:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    suscripciones.push({
      nombre: match[1],
      tipo: 'plan_suscripcion'
    });
  }
  
  return suscripciones;
}

function extractUsuarios(content) {
  // Extraer roles de usuario
  const usuarios = [];
  const regex = /rol:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    usuarios.push({
      rol: match[1],
      tipo: 'rol_usuario'
    });
  }
  
  return usuarios;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateKnowledgeFromSeeds();
}

module.exports = { generateKnowledgeFromSeeds };
