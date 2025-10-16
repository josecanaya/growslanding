#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para logs
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bold}${step}${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Función para leer variables de entorno desde .env
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('Archivo .env no encontrado en apps/web/');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

// Función para detectar si la URL usa pooler
function isPoolerUrl(databaseUrl) {
  return databaseUrl.includes('.pooler.');
}

// Función para convertir URL de pooler a conexión directa
function convertToDirectUrl(poolerUrl) {
  try {
    // Parsear la URL usando URL constructor
    const url = new URL(poolerUrl);
    
    // Extraer componentes
    const username = url.username;
    const password = url.password;
    const database = url.pathname.substring(1); // Remover el '/' inicial
    
    // Construir URL directa usando el host directo de Supabase
    // Usar el proyecto ID correcto obtenido de la API de Supabase
    const projectId = 'nchebzllolmxxcphswgb';
    const directHost = `db.${projectId}.supabase.co`;
    const directPort = '5432';
    
    // Usar el username correcto para el proyecto
    const directUsername = `postgres.${projectId}`;
    
    // Construir nueva URL solo con sslmode=require (sin pgbouncer ni connection_limit)
    const directUrl = `postgresql://${directUsername}:${password}@${directHost}:${directPort}/${database}?sslmode=require`;
    
    return directUrl;
  } catch (error) {
    throw new Error(`Error parseando URL: ${error.message}`);
  }
}

// Función para ejecutar comandos de Prisma
function runPrismaCommand(command, options = {}) {
  try {
    logInfo(`Ejecutando: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      ...options
    });
    return result;
  } catch (error) {
    logError(`Error ejecutando comando: ${command}`);
    logError(error.message);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    logStep('🔍 PASO 1', 'Detectando configuración de base de datos...');
    
    // Cargar variables de entorno
    const envVars = loadEnvFile();
    let databaseUrl = envVars.DATABASE_URL;
    
    // Remover comillas si las hay
    if (databaseUrl && typeof databaseUrl === 'string') {
      databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
    }
    
    if (!databaseUrl) {
      logError('DATABASE_URL no encontrada en el archivo .env');
      process.exit(1);
    }
    
    logInfo(`URL detectada: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
    
    // Verificar si usa pooler
    if (!isPoolerUrl(databaseUrl)) {
      logWarning('La URL no parece usar pooler de Supabase');
      logInfo('Ejecutando comandos de Prisma con URL original...');
      
      // Ejecutar comandos normales
      runPrismaCommand('npx prisma db pull --schema=prisma/schema.prisma');
      runPrismaCommand('npx prisma generate --schema=prisma/schema.prisma');
      
      logSuccess('Sincronización completada con URL original');
      return;
    }
    
    logStep('🔧 PASO 2', 'Convirtiendo a conexión directa temporal...');
    
    // Convertir a URL directa
    const directUrl = convertToDirectUrl(databaseUrl);
    logInfo(`URL directa creada: ${directUrl.replace(/:[^:@]*@/, ':***@')}`);
    
    logStep('📡 PASO 3', 'Ejecutando introspección con conexión directa...');
    
    // Ejecutar db pull con URL directa
    runPrismaCommand(`npx prisma db pull --schema=prisma/schema.prisma --url="${directUrl}"`);
    logSuccess('Introspección completada');
    
    logStep('⚙️  PASO 4', 'Regenerando Prisma Client...');
    
    // Ejecutar generate (no necesita URL específica)
    runPrismaCommand('npx prisma generate --schema=prisma/schema.prisma');
    logSuccess('Prisma Client regenerado');
    
    logStep('🎉 COMPLETADO', 'Sincronización exitosa');
    logSuccess('✅ Conexión directa temporal utilizada');
    logSuccess('✅ Introspección completada sin bloqueos');
    logSuccess('✅ Prisma Client regenerado');
    logInfo('La configuración del pooler permanece intacta en .env');
    
  } catch (error) {
    logError('Error durante la sincronización:');
    logError(error.message);
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    logError('Error fatal:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { main, convertToDirectUrl, isPoolerUrl };
