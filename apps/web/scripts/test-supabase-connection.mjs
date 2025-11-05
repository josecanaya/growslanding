import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno desde .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.warn('⚠️  No se pudo cargar .env.local, usando variables de entorno del sistema');
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Verifica que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en .env.local');
  process.exit(1);
}

console.log('🔌 Conectando a Supabase...');
console.log('   URL:', url);

const supabase = createClient(url, key);

try {
  const { data, error } = await supabase.from('obras').select('*').limit(1);

  if (error) {
    throw error;
  }

  console.log('✅ Conexión exitosa a Supabase');
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('📊 Datos encontrados:');
    console.log('   Primera obra:', JSON.stringify(data[0], null, 2));
    console.log(`   Total de obras: ${data.length} (limitado a 1 para prueba)`);
  } else {
    console.log('⚠️  La consulta fue exitosa pero no se encontraron obras en la base de datos.');
    console.log('   Esto es normal si la tabla está vacía.');
  }
} catch (error) {
  console.error('❌ Error de conexión a Supabase:');
  console.error('   Mensaje:', error instanceof Error ? error.message : error);
  
  if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
    console.error('\n💡 Sugerencia: La tabla "obras" no existe. Verifica tu esquema de base de datos.');
  } else if (error instanceof Error && error.message.includes('JWT')) {
    console.error('\n💡 Sugerencia: Verifica que las credenciales (SUPABASE_SERVICE_ROLE_KEY) sean correctas.');
  }
  
  process.exit(1);
}

