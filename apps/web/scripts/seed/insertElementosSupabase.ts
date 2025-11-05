/**
 * Script para cargar elementos en la tabla elementos de Supabase
 * 
 * Uso:
 *   npx tsx scripts/seed/insertElementosSupabase.ts
 * 
 * Requiere:
 *   - SUPABASE_URL en .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY en .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Database } from '../../lib/types/supabase.gen';

// ===========================================
// TIPOS Y VALIDACIÓN
// ===========================================

type ElementoInsert = {
  obra_id: string;
  nombre: string;
  categoria: string;
  subcategoria?: string | null;
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  unidad: 'm²' | 'm³' | 'ml' | 'unidad' | 'kg' | 'l';
  cantidad: number;
  costo_unitario?: number | null;
  duracion_estimada?: number | null;
  orden?: number | null;
  plantilla_elemento_id?: string | null;
  planta_id?: string | null;
  descripcion?: string | null;
};

// ===========================================
// VALIDACIÓN DE DATOS
// ===========================================

function validarElemento(elemento: any): { valido: boolean; error?: string } {
  // Validar obra_id
  if (!elemento.obra_id || typeof elemento.obra_id !== 'string') {
    return { valido: false, error: 'obra_id es requerido y debe ser un string (UUID)' };
  }

  // Validar UUID formato básico
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(elemento.obra_id)) {
    return { valido: false, error: 'obra_id debe ser un UUID válido' };
  }

  // Validar nombre
  if (!elemento.nombre || typeof elemento.nombre !== 'string' || elemento.nombre.trim().length < 2) {
    return { valido: false, error: 'nombre es requerido y debe tener al menos 2 caracteres' };
  }

  // Validar categoria
  if (!elemento.categoria || typeof elemento.categoria !== 'string') {
    return { valido: false, error: 'categoria es requerido y debe ser un string' };
  }

  // Validar etapa
  const etapasValidas = ['estructura', 'obra_gris', 'terminaciones'];
  let etapaNormalizada: string | null = null;

  if (elemento.etapa) {
    // Normalizar etapa a lowercase y snake_case
    const etapaLower = String(elemento.etapa).toLowerCase().trim();
    
    // Mapeo de variaciones comunes
    const mapeoEtapas: Record<string, string> = {
      'estructura': 'estructura',
      'estrutura': 'estructura',
      'obra_gris': 'obra_gris',
      'obra gris': 'obra_gris',
      'obragris': 'obra_gris',
      'terminaciones': 'terminaciones',
      'terminacion': 'terminaciones',
    };

    etapaNormalizada = mapeoEtapas[etapaLower] || etapaLower;
    
    if (!etapasValidas.includes(etapaNormalizada)) {
      return { 
        valido: false, 
        error: `etapa debe ser uno de: ${etapasValidas.join(', ')}. Recibido: ${elemento.etapa}` 
      };
    }
  } else {
    return { valido: false, error: 'etapa es requerido' };
  }

  // Validar unidad
  const unidadesValidas = ['m²', 'm³', 'ml', 'unidad', 'kg', 'l'];
  if (!elemento.unidad || !unidadesValidas.includes(elemento.unidad)) {
    return { 
      valido: false, 
      error: `unidad debe ser uno de: ${unidadesValidas.join(', ')}` 
    };
  }

  // Validar cantidad
  if (typeof elemento.cantidad !== 'number' || elemento.cantidad <= 0) {
    return { valido: false, error: 'cantidad debe ser un número positivo' };
  }

  // Validar costo_unitario (opcional)
  if (elemento.costo_unitario !== undefined && elemento.costo_unitario !== null) {
    if (typeof elemento.costo_unitario !== 'number' || elemento.costo_unitario < 0) {
      return { valido: false, error: 'costo_unitario debe ser un número positivo o null' };
    }
  }

  // Validar duracion_estimada (opcional)
  if (elemento.duracion_estimada !== undefined && elemento.duracion_estimada !== null) {
    if (typeof elemento.duracion_estimada !== 'number' || elemento.duracion_estimada < 0) {
      return { valido: false, error: 'duracion_estimada debe ser un número entero positivo o null' };
    }
  }

  // Validar orden (opcional)
  if (elemento.orden !== undefined && elemento.orden !== null) {
    if (typeof elemento.orden !== 'number' || elemento.orden < 0) {
      return { valido: false, error: 'orden debe ser un número entero positivo o null' };
    }
  }

  return { valido: true };
}

function normalizarElemento(elemento: any): ElementoInsert {
  // Normalizar etapa
  let etapaNormalizada: 'estructura' | 'obra_gris' | 'terminaciones' = 'estructura';
  
  if (elemento.etapa) {
    const etapaLower = String(elemento.etapa).toLowerCase().trim();
    const mapeoEtapas: Record<string, 'estructura' | 'obra_gris' | 'terminaciones'> = {
      'estructura': 'estructura',
      'estrutura': 'estructura',
      'obra_gris': 'obra_gris',
      'obra gris': 'obra_gris',
      'obragris': 'obra_gris',
      'terminaciones': 'terminaciones',
      'terminacion': 'terminaciones',
    };
    
    etapaNormalizada = mapeoEtapas[etapaLower] || 'estructura';
  }

  return {
    obra_id: elemento.obra_id.trim(),
    nombre: elemento.nombre.trim(),
    categoria: elemento.categoria.trim(),
    subcategoria: elemento.subcategoria?.trim() || null,
    etapa: etapaNormalizada,
    unidad: elemento.unidad,
    cantidad: Number(elemento.cantidad),
    costo_unitario: elemento.costo_unitario !== undefined ? Number(elemento.costo_unitario) : null,
    duracion_estimada: elemento.duracion_estimada !== undefined ? Math.floor(Number(elemento.duracion_estimada)) : null,
    orden: elemento.orden !== undefined ? Math.floor(Number(elemento.orden)) : null,
    plantilla_elemento_id: elemento.plantilla_elemento_id?.trim() || null,
    planta_id: elemento.planta_id?.trim() || null,
    descripcion: elemento.descripcion?.trim() || null,
  };
}

// ===========================================
// CARGA DE VARIABLES DE ENTORNO
// ===========================================

function cargarVariablesEntorno() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '..', '..', '.env.local');

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
    console.log('✅ Variables de entorno cargadas desde .env.local');
  } catch (error) {
    console.warn('⚠️  No se pudo cargar .env.local, usando variables de entorno del sistema');
  }
}

// ===========================================
// FUNCIÓN AUXILIAR: Obtener obra_id real
// ===========================================

async function obtenerObraIdReal(supabase: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('obras')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('⚠️  No se pudo obtener obra existente:', error.message);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.warn('⚠️  Error al buscar obra existente:', error);
    return null;
  }
}

// ===========================================
// FUNCIÓN PRINCIPAL
// ===========================================

async function insertarElementos(elementos: any[], obraIdForzado?: string) {
  // Cargar variables de entorno
  cargarVariablesEntorno();

  // Obtener credenciales
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Error: Faltan variables de entorno');
    console.error('   Verifica que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en .env.local');
    process.exit(1);
  }

  console.log('🔌 Conectando a Supabase...');
  console.log('   URL:', url);
  console.log('');

  // Crear cliente de Supabase
  const supabase = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Si se proporciona obraIdForzado, validar que existe
  if (obraIdForzado) {
    console.log(`🔍 Validando obra_id proporcionado: ${obraIdForzado}`);
    
    // Intentar con 'name' primero (formato real de Supabase)
    let { data: obraExiste, error: errorObra } = await supabase
      .from('obras')
      .select('id, name')
      .eq('id', obraIdForzado)
      .maybeSingle();
    
    // Si falla, intentar con 'nombre' (formato de tipos generados)
    if (errorObra && errorObra.code === '42703') {
      const { data: obraExiste2, error: errorObra2 } = await supabase
        .from('obras')
        .select('id, nombre')
        .eq('id', obraIdForzado)
        .maybeSingle();
      
      obraExiste = obraExiste2;
      errorObra = errorObra2;
    }
    
    if (errorObra || !obraExiste) {
      console.error(`❌ Error: La obra con ID ${obraIdForzado} no existe en la base de datos`);
      console.error('   Busca una obra existente o crea una nueva obra primero');
      if (errorObra) {
        console.error(`   Error técnico: ${errorObra.message}`);
      }
      process.exit(1);
    }
    
    const nombreObra = (obraExiste as any).name || (obraExiste as any).nombre || 'Sin nombre';
    console.log(`   ✅ Obra encontrada: ${nombreObra}`);
    console.log('');
  }

  // Validar y normalizar elementos
  console.log(`📋 Validando ${elementos.length} elemento(s)...`);
  const elementosValidados: ElementoInsert[] = [];
  const errores: Array<{ indice: number; elemento: any; error: string }> = [];

  // Si se proporciona obraIdForzado, reemplazar todos los obra_id
  const elementosParaValidar = obraIdForzado 
    ? elementos.map(el => ({ ...el, obra_id: obraIdForzado }))
    : elementos;

  elementosParaValidar.forEach((elemento, indice) => {
    const validacion = validarElemento(elemento);
    if (!validacion.valido) {
      errores.push({ indice: indice + 1, elemento, error: validacion.error || 'Error desconocido' });
    } else {
      elementosValidados.push(normalizarElemento(elemento));
    }
  });

  // Mostrar errores de validación
  if (errores.length > 0) {
    console.error(`❌ ${errores.length} elemento(s) con errores de validación:\n`);
    errores.forEach(({ indice, elemento, error }) => {
      console.error(`   Elemento ${indice}:`);
      console.error(`      Nombre: ${elemento.nombre || 'N/A'}`);
      console.error(`      Error: ${error}`);
      console.error('');
    });
  }

  if (elementosValidados.length === 0) {
    console.error('❌ No hay elementos válidos para insertar');
    process.exit(1);
  }

  console.log(`✅ ${elementosValidados.length} elemento(s) válido(s) para insertar`);
  console.log('');

  // Agrupar por obra_id para mostrar información
  const obrasUnicas = new Set(elementosValidados.map(e => e.obra_id));
  console.log(`📊 Obra(s) afectada(s): ${obrasUnicas.size}`);
  obrasUnicas.forEach(obraId => {
    const count = elementosValidados.filter(e => e.obra_id === obraId).length;
    console.log(`   - ${obraId}: ${count} elemento(s)`);
  });
  console.log('');

  // Insertar elementos
  console.log('💾 Insertando elementos en Supabase...');
  
  try {
    // Preparar datos para insertar (solo incluir campos que existen)
    // Primero intentar sin campos que pueden no existir (etapa, planta_id)
    const elementosParaInsertar = elementosValidados.map(el => {
      const elemento: any = {
        obra_id: el.obra_id,
        nombre: el.nombre,
        categoria: el.categoria,
        unidad: el.unidad,
        cantidad: el.cantidad,
      };
      
      // Campos opcionales - solo incluir si tienen valor y si existen en BD
      if (el.subcategoria) elemento.subcategoria = el.subcategoria;
      // ⚠️ etapa: No incluir por ahora (puede no existir en BD aún)
      // if (el.etapa) elemento.etapa = el.etapa;
      if (el.costo_unitario !== null && el.costo_unitario !== undefined) elemento.costo_unitario = el.costo_unitario;
      if (el.duracion_estimada !== null && el.duracion_estimada !== undefined) elemento.duracion_estimada = el.duracion_estimada;
      if (el.orden !== null && el.orden !== undefined) elemento.orden = el.orden;
      if (el.plantilla_elemento_id) elemento.plantilla_elemento_id = el.plantilla_elemento_id;
      // ⚠️ planta_id: No incluir por ahora (puede no existir en BD aún)
      // if (el.planta_id) elemento.planta_id = el.planta_id;
      if (el.descripcion) elemento.descripcion = el.descripcion;
      
      return elemento;
    });
    
    const { data, error } = await supabase
      .from('elementos')
      .insert(elementosParaInsertar)
      .select('id, nombre, categoria, cantidad, costo_unitario, created_at');

    if (error) {
      console.error('❌ Error al insertar elementos:');
      console.error('   Código:', error.code);
      console.error('   Mensaje:', error.message);
      console.error('   Detalles:', error.details);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('❌ No se insertaron elementos (respuesta vacía)');
      process.exit(1);
    }

    // Mostrar resultados
    console.log('');
    console.log('✅ Elementos insertados correctamente:');
    console.log('');

    data.forEach((elemento: any, indice) => {
      console.log(`   ${indice + 1}. ${elemento.nombre}`);
      console.log(`      ID: ${elemento.id}`);
      console.log(`      Categoría: ${elemento.categoria}`);
      if (elemento.etapa) {
        console.log(`      Etapa: ${elemento.etapa}`);
      }
      if (elemento.planta_id) {
        console.log(`      Planta: ${elemento.planta_id}`);
      }
      console.log(`      Cantidad: ${elemento.cantidad}`);
      if (elemento.costo_unitario) {
        console.log(`      Costo unitario: $${elemento.costo_unitario.toLocaleString()}`);
      }
      console.log(`      Creado: ${new Date(elemento.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log(`📊 Resumen:`);
    console.log(`   ✅ Insertados: ${data.length} elemento(s)`);
    if (errores.length > 0) {
      console.log(`   ❌ Errores: ${errores.length} elemento(s)`);
    }
    console.log('');

    // Verificar inserción
    console.log('🔍 Verificando inserción...');
    const obraId = elementosValidados[0]?.obra_id;
    if (obraId) {
      const { data: verificacion, error: errorVerificacion } = await supabase
        .from('elementos')
        .select('nombre, categoria, cantidad, costo_unitario')
        .eq('obra_id', obraId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!errorVerificacion && verificacion) {
        console.log(`   ✅ Verificación exitosa: ${verificacion.length} elemento(s) encontrado(s) en la obra ${obraId}`);
        console.log('');
      } else if (errorVerificacion) {
        console.log(`   ⚠️  Error al verificar (no crítico): ${errorVerificacion.message}`);
        console.log('');
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error inesperado al insertar elementos:');
    console.error('   ', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// ===========================================
// DATOS DE EJEMPLO
// ===========================================

const elementosEjemplo: any[] = [
  {
    obra_id: '550e8400-e29b-41d4-a716-446655440000',
    nombre: 'Muro de ladrillo hueco 18cm',
    categoria: 'Muros',
    subcategoria: 'Muro portante',
    etapa: 'estructura',
    unidad: 'm²',
    cantidad: 120,
    costo_unitario: 15000,
    duracion_estimada: 5,
    orden: 1,
    planta_id: 'PB',
    descripcion: 'Muro estructural de planta baja',
  },
  {
    obra_id: '550e8400-e29b-41d4-a716-446655440000',
    nombre: 'Revoque fino interior',
    categoria: 'Revestimientos',
    subcategoria: 'Paredes interiores',
    etapa: 'obra_gris',
    unidad: 'm²',
    cantidad: 200,
    costo_unitario: 2500,
    duracion_estimada: 3,
    orden: 2,
    planta_id: 'PB',
    descripcion: 'Revoque fino en paredes interiores de planta baja',
  },
  {
    obra_id: '550e8400-e29b-41d4-a716-446655440000',
    nombre: 'Instalación eléctrica',
    categoria: 'Instalaciones',
    subcategoria: 'Eléctrica',
    etapa: 'terminaciones',
    unidad: 'unidad',
    cantidad: 1,
    costo_unitario: 45000,
    duracion_estimada: 7,
    orden: 3,
    planta_id: 'PB',
    descripcion: 'Instalación eléctrica completa de planta baja',
  },
];

// ===========================================
// FUNCIÓN AUXILIAR: Cargar desde archivo JSON
// ===========================================

async function cargarElementosDesdeArchivo(rutaArchivo: string): Promise<any[]> {
  try {
    const contenido = readFileSync(rutaArchivo, 'utf-8');
    const elementos = JSON.parse(contenido);
    
    if (!Array.isArray(elementos)) {
      throw new Error('El archivo JSON debe contener un array de elementos');
    }
    
    return elementos;
  } catch (error) {
    console.error(`❌ Error al cargar archivo ${rutaArchivo}:`, error);
    throw error;
  }
}

// ===========================================
// EJECUCIÓN
// ===========================================

// Ejecutar solo si se llama directamente (no importado)
async function main() {
  console.log('🚀 Script de carga masiva de elementos');
  console.log('=====================================\n');
  
  // Determinar qué elementos cargar y obra_id
  let elementosACargar: any[] = elementosEjemplo;
  let obraIdForzado: string | undefined = undefined;
  
  // Analizar argumentos
  if (process.argv.length > 2) {
    const primerArg = process.argv[2];
    
    // Si es un UUID (tiene guiones), asumir que es obra_id
    if (primerArg.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      obraIdForzado = primerArg;
      console.log(`📋 Usando obra_id: ${obraIdForzado}`);
      
      // Si hay segundo argumento, es el archivo JSON
      if (process.argv.length > 3) {
        const rutaArchivo = process.argv[3];
        console.log(`📂 Cargando elementos desde archivo: ${rutaArchivo}\n`);
        elementosACargar = await cargarElementosDesdeArchivo(rutaArchivo);
      } else {
        console.log('📋 Usando elementos de ejemplo\n');
      }
    } else {
      // Es una ruta de archivo JSON
      console.log(`📂 Cargando elementos desde archivo: ${primerArg}\n`);
      elementosACargar = await cargarElementosDesdeArchivo(primerArg);
    }
  } else {
    console.log('📋 Usando elementos de ejemplo');
    console.log('');
    console.log('💡 Uso del script:');
    console.log('   npx tsx scripts/seed/insertElementosSupabase.ts [obra_id] [archivo.json]');
    console.log('');
    console.log('   Ejemplos:');
    console.log('     # Usar obra_id específico con elementos de ejemplo');
    console.log('     npx tsx scripts/seed/insertElementosSupabase.ts <obra-id-uuid>');
    console.log('');
    console.log('     # Cargar desde archivo JSON');
    console.log('     npx tsx scripts/seed/insertElementosSupabase.ts datos/elementos.json');
    console.log('');
    console.log('     # Usar obra_id específico con archivo JSON');
    console.log('     npx tsx scripts/seed/insertElementosSupabase.ts <obra-id-uuid> datos/elementos.json');
    console.log('');
  }
  
  try {
    const data = await insertarElementos(elementosACargar, obraIdForzado);
    console.log('✅ Proceso completado exitosamente');
    return data;
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar main solo si el script se ejecuta directamente
// Detectar si es ejecución directa (no import)
const esEjecucionDirecta = 
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.includes(process.argv[1]) ||
  process.argv[1]?.includes('insertElementosSupabase.ts');

if (esEjecucionDirecta || !import.meta.url.includes('node_modules')) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

// Exportar función para uso como módulo
export { insertarElementos, validarElemento, normalizarElemento };

