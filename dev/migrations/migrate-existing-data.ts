import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

// Clientes
const prisma = new PrismaClient();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Interfaces para los datos existentes
interface ObraExistente {
  id: string;
  org_id: string;
  nombre: string;
  cliente?: string;
  localizacion?: string;
  tipo_obra: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  presupuesto_total?: number;
  numero_permiso?: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

interface TareaExistente {
  id: string;
  obra_id: string;
  tipo: string;
  descripcion: string;
  referente_id?: string;
  socio_ids: string[];
  precedencias: string[];
  created_at: string;
  updated_at: string;
}

interface SocioExistente {
  id: string;
  org_id: string;
  nombre: string;
  email: string;
  telefono?: string;
  created_at: string;
}

// Estadísticas de migración
interface MigracionStats {
  organizacionesCreadas: number;
  usuariosCreados: number;
  obrasMigradas: number;
  elementosCreados: number;
  tareasMigradas: number;
  estadosCreados: number;
  precedenciasCreadas: number;
  errores: string[];
}

async function main() {
  console.log('🚀 Iniciando migración de datos de Supabase a Prisma...');
  
  const stats: MigracionStats = {
    organizacionesCreadas: 0,
    usuariosCreados: 0,
    obrasMigradas: 0,
    elementosCreados: 0,
    tareasMigradas: 0,
    estadosCreados: 0,
    precedenciasCreadas: 0,
    errores: []
  };

  try {
    // 1. Leer datos existentes de Supabase
    console.log('📥 Leyendo datos existentes de Supabase...');
    
    const { data: obrasExistentes, error: obrasError } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: true });

    if (obrasError) {
      throw new Error(`Error al leer obras: ${obrasError.message}`);
    }

    const { data: tareasExistentes, error: tareasError } = await supabase
      .from('tareas')
      .select('*')
      .order('created_at', { ascending: true });

    if (tareasError) {
      throw new Error(`Error al leer tareas: ${tareasError.message}`);
    }

    const { data: sociosExistentes, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .order('created_at', { ascending: true });

    if (sociosError) {
      console.warn('⚠️ No se pudieron leer socios:', sociosError.message);
    }

    console.log(`✅ Datos leídos: ${obrasExistentes?.length || 0} obras, ${tareasExistentes?.length || 0} tareas, ${sociosExistentes?.length || 0} socios`);

    // 2. Crear mapas de IDs para evitar duplicados
    const mapaOrgIds = new Map<string, string>();
    const mapaUsuarioIds = new Map<string, string>();
    const mapaObraIds = new Map<string, string>();
    const mapaTareaIds = new Map<string, string>();

    // 3. Migrar organizaciones y usuarios
    console.log('🏢 Migrando organizaciones y usuarios...');
    
    const orgIdsUnicos = [...new Set([
      ...(obrasExistentes || []).map(o => o.org_id),
      ...(sociosExistentes || []).map(s => s.org_id)
    ])];

    for (const orgId of orgIdsUnicos) {
      try {
        // Crear organización
        const organizacion = await prisma.organizacion.create({
          data: {
            nombre: `Organización ${orgId}`,
            plan: 'basico',
            limiteObras: 50,
            limiteTareas: 500
          }
        });

        mapaOrgIds.set(orgId, organizacion.id);
        stats.organizacionesCreadas++;

        // Crear usuario cliente técnico para la organización
        const clienteTecnico = await prisma.usuario.create({
          data: {
            nombre: `Cliente Técnico ${orgId}`,
            email: `cliente-${orgId}@grows.local`,
            rol: 'CLIENTE_TECNICO'
          }
        });

        // Asociar usuario a organización
        await prisma.organizacionUsuario.create({
          data: {
            organizacionId: organizacion.id,
            usuarioId: clienteTecnico.id,
            rol: 'CLIENTE_TECNICO'
          }
        });

        mapaUsuarioIds.set(`cliente-${orgId}`, clienteTecnico.id);
        stats.usuariosCreados++;

        console.log(`✅ Organización ${orgId} migrada como ${organizacion.id}`);
      } catch (error) {
        const mensaje = `Error al migrar organización ${orgId}: ${error}`;
        console.error(`❌ ${mensaje}`);
        stats.errores.push(mensaje);
      }
    }

    // 4. Migrar socios como usuarios
    console.log('👷 Migrando socios como usuarios...');
    
    for (const socio of sociosExistentes || []) {
      try {
        const organizacionId = mapaOrgIds.get(socio.org_id);
        if (!organizacionId) {
          throw new Error(`Organización ${socio.org_id} no encontrada`);
        }

        const usuario = await prisma.usuario.create({
          data: {
            nombre: socio.nombre,
            email: socio.email,
            rol: 'SOCIO_CONSTRUCTOR'
          }
        });

        // Asociar usuario a organización
        await prisma.organizacionUsuario.create({
          data: {
            organizacionId: organizacionId,
            usuarioId: usuario.id,
            rol: 'SOCIO_CONSTRUCTOR'
          }
        });

        mapaUsuarioIds.set(socio.id, usuario.id);
        stats.usuariosCreados++;

        console.log(`✅ Socio ${socio.nombre} migrado como usuario ${usuario.id}`);
      } catch (error) {
        const mensaje = `Error al migrar socio ${socio.id}: ${error}`;
        console.error(`❌ ${mensaje}`);
        stats.errores.push(mensaje);
      }
    }

    // 5. Migrar obras
    console.log('🏗️ Migrando obras...');
    
    for (const obra of obrasExistentes || []) {
      try {
        const organizacionId = mapaOrgIds.get(obra.org_id);
        const clienteId = mapaUsuarioIds.get(`cliente-${obra.org_id}`);
        
        if (!organizacionId || !clienteId) {
          throw new Error(`Datos faltantes para obra ${obra.id}`);
        }

        const obraMigrada = await prisma.obra.create({
          data: {
            organizacionId: organizacionId,
            clienteId: clienteId,
            nombre: obra.nombre,
            localizacion: obra.localizacion || null,
            tipo: mapearTipoObra(obra.tipo_obra),
            fechaInicio: obra.fecha_inicio ? new Date(obra.fecha_inicio) : null,
            fechaFinEstimada: obra.fecha_fin_estimada ? new Date(obra.fecha_fin_estimada) : null,
            presupuestoTotal: obra.presupuesto_total ? obra.presupuesto_total : null,
            numeroPermiso: obra.numero_permiso || null,
            descripcion: obra.descripcion || `Obra migrada: ${obra.nombre}`
          }
        });

        mapaObraIds.set(obra.id, obraMigrada.id);
        stats.obrasMigradas++;

        // Crear elemento genérico para la obra
        const elemento = await prisma.elementoObra.create({
          data: {
            obraId: obraMigrada.id,
            nombre: 'Elemento Migrado',
            categoria: 'General',
            cantidad: 1,
            unidad: 'unidad',
            etapa: 'ESTRUCTURA',
            descripcion: 'Elemento creado durante la migración'
          }
        });

        stats.elementosCreados++;
        console.log(`✅ Obra ${obra.nombre} migrada como ${obraMigrada.id}`);
      } catch (error) {
        const mensaje = `Error al migrar obra ${obra.id}: ${error}`;
        console.error(`❌ ${mensaje}`);
        stats.errores.push(mensaje);
      }
    }

    // 6. Migrar tareas
    console.log('📋 Migrando tareas...');
    
    for (const tarea of tareasExistentes || []) {
      try {
        const obraId = mapaObraIds.get(tarea.obra_id);
        if (!obraId) {
          throw new Error(`Obra ${tarea.obra_id} no encontrada`);
        }

        // Buscar el elemento genérico de la obra
        const elemento = await prisma.elementoObra.findFirst({
          where: { obraId: obraId }
        });

        if (!elemento) {
          throw new Error(`Elemento para obra ${obraId} no encontrado`);
        }

        // Mapear socio si existe
        let socioId: string | undefined;
        if (tarea.socio_ids && tarea.socio_ids.length > 0) {
          const socioOriginalId = tarea.socio_ids[0]; // Tomar el primer socio
          socioId = mapaUsuarioIds.get(socioOriginalId);
        }

        const tareaMigrada = await prisma.tarea.create({
          data: {
            elementoId: elemento.id,
            socioId: socioId,
            nombre: tarea.tipo,
            descripcion: tarea.descripcion || `Tarea migrada: ${tarea.tipo}`,
            estado: 'RECIBIDO', // Estado inicial
            prioridad: 'NORMAL'
          }
        });

        mapaTareaIds.set(tarea.id, tareaMigrada.id);
        stats.tareasMigradas++;

        // Crear estado inicial
        await prisma.tareaEstado.create({
          data: {
            tareaId: tareaMigrada.id,
            estadoNuevo: 'RECIBIDO',
            actorId: mapaUsuarioIds.get(`cliente-${tarea.obra_id}`) || '',
            actorTipo: 'CLIENTE_TECNICO',
            comentarios: 'Estado inicial creado durante la migración'
          }
        });

        stats.estadosCreados++;

        console.log(`✅ Tarea ${tarea.tipo} migrada como ${tareaMigrada.id}`);
      } catch (error) {
        const mensaje = `Error al migrar tarea ${tarea.id}: ${error}`;
        console.error(`❌ ${mensaje}`);
        stats.errores.push(mensaje);
      }
    }

    // 7. Migrar precedencias
    console.log('🔗 Migrando precedencias...');
    
    for (const tarea of tareasExistentes || []) {
      if (tarea.precedencias && tarea.precedencias.length > 0) {
        try {
          const tareaId = mapaTareaIds.get(tarea.id);
          if (!tareaId) continue;

          for (const precedenciaId of tarea.precedencias) {
            const tareaPredecesoraId = mapaTareaIds.get(precedenciaId);
            if (!tareaPredecesoraId) continue;

            await prisma.tareaPrecedencia.create({
              data: {
                tareaId: tareaId,
                tareaPredecesoraId: tareaPredecesoraId,
                tipoDependencia: 'FINISH_TO_START',
                lagDias: 0
              }
            });

            stats.precedenciasCreadas++;
          }
        } catch (error) {
          const mensaje = `Error al migrar precedencias de tarea ${tarea.id}: ${error}`;
          console.error(`❌ ${mensaje}`);
          stats.errores.push(mensaje);
        }
      }
    }

    // 8. Mostrar resumen final
    console.log('\n🎉 Migración completada!');
    console.log('📊 Resumen de migración:');
    console.log(`   • Organizaciones creadas: ${stats.organizacionesCreadas}`);
    console.log(`   • Usuarios creados: ${stats.usuariosCreados}`);
    console.log(`   • Obras migradas: ${stats.obrasMigradas}`);
    console.log(`   • Elementos creados: ${stats.elementosCreados}`);
    console.log(`   • Tareas migradas: ${stats.tareasMigradas}`);
    console.log(`   • Estados creados: ${stats.estadosCreados}`);
    console.log(`   • Precedencias creadas: ${stats.precedenciasCreadas}`);
    
    if (stats.errores.length > 0) {
      console.log(`\n⚠️ Errores encontrados: ${stats.errores.length}`);
      stats.errores.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fatal durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Funciones auxiliares
function mapearTipoObra(tipo: string): 'NUEVA' | 'REFORMA' | 'AMPLIACION' {
  switch (tipo.toLowerCase()) {
    case 'nueva': return 'NUEVA';
    case 'reforma': return 'REFORMA';
    case 'ampliacion': return 'AMPLIACION';
    default: return 'NUEVA';
  }
}

function mapearEstadoTarea(estado: string): 'RECIBIDO' | 'PRESUPUESTADO' | 'PENDIENTE' | 'EN_EJECUCION' | 'EJECUTADO' | 'APROBADO' {
  switch (estado.toLowerCase()) {
    case 'pendiente': return 'PENDIENTE';
    case 'en_ejecucion': return 'EN_EJECUCION';
    case 'finalizado': return 'EJECUTADO';
    case 'validado': return 'APROBADO';
    default: return 'RECIBIDO';
  }
}

// Ejecutar migración
main()
  .catch((error) => {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  });
