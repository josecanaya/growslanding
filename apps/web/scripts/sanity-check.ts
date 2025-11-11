#!/usr/bin/env node
// @ts-nocheck
/**
 * Script de validación final para GROWS
 * 
 * Este script conecta a la base de datos y hace un conteo de todas las tablas principales
 * para verificar que el sistema está funcionando correctamente.
 * 
 * Cómo ejecutarlo:
 * cd apps/web
 * node scripts/sanity-check.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sanityCheck() {
  try {
    console.log('🔍 Iniciando validación de la base de datos...\n');

    // Conteo de organizations
    const orgCount = await prisma.organization.count();
    console.log(`📊 Organizations: ${orgCount}`);

    // Conteo de obras
    const obrasCount = await prisma.obra.count();
    console.log(`🏗️  Obras: ${obrasCount}`);

    // Conteo de tareas
    const tareasCount = await prisma.tarea.count();
    console.log(`📋 Tareas: ${tareasCount}`);

    // Conteo de socios
    const sociosCount = await prisma.socio.count();
    console.log(`👥 Socios: ${sociosCount}`);

    // Conteo de eventos
    const eventosCount = await prisma.evento.count();
    console.log(`📅 Eventos: ${eventosCount}`);

    // Conteo de roadmap objetivos
    const roadmapObjetivosCount = await prisma.roadmapObjetivo.count();
    console.log(`🎯 Roadmap Objetivos: ${roadmapObjetivosCount}`);

    // Conteo de roadmap grupos tareas
    const roadmapGruposCount = await prisma.roadmapGrupoTareas.count();
    console.log(`📁 Roadmap Grupos: ${roadmapGruposCount}`);

    // Conteo de roadmap tareas
    const roadmapTareasCount = await prisma.roadmapTarea.count();
    console.log(`✅ Roadmap Tareas: ${roadmapTareasCount}`);

    // Verificar tabla de notificaciones (puede no existir aún)
    try {
      const notificacionesCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM notificaciones
      `;
      const count = Array.isArray(notificacionesCount) ? notificacionesCount[0] : notificacionesCount;
      console.log(`🔔 Notificaciones: ${(count as any)?.count || 0}`);
    } catch (error) {
      console.log(`🔔 Notificaciones: Tabla no existe aún`);
    }

    console.log('\n✅ Validación completada exitosamente!');
    console.log('\n📈 Resumen:');
    console.log(`   - Total de organizaciones: ${orgCount}`);
    console.log(`   - Total de obras: ${obrasCount}`);
    console.log(`   - Total de tareas: ${tareasCount}`);
    console.log(`   - Total de socios: ${sociosCount}`);
    console.log(`   - Total de eventos: ${eventosCount}`);
    console.log(`   - Total roadmap objetivos: ${roadmapObjetivosCount}`);
    console.log(`   - Total roadmap grupos: ${roadmapGruposCount}`);
    console.log(`   - Total roadmap tareas: ${roadmapTareasCount}`);

  } catch (error) {
    console.error('❌ Error durante la validación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión a la base de datos cerrada.');
  }
}

// Ejecutar directamente
sanityCheck();
