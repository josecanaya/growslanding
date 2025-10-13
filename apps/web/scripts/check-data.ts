import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Verificando datos en la base de datos...')
    
    // Contar objetivos
    const objetivosCount = await prisma.roadmapObjetivo.count()
    console.log(`📊 Objetivos en DB: ${objetivosCount}`)
    
    // Contar tareas
    const tareasCount = await prisma.roadmapTarea.count()
    console.log(`📊 Tareas en DB: ${tareasCount}`)
    
    // Contar grupos
    const gruposCount = await prisma.roadmapGrupoTareas.count()
    console.log(`📊 Grupos en DB: ${gruposCount}`)
    
    // Mostrar algunos objetivos
    const objetivos = await prisma.roadmapObjetivo.findMany({
      take: 3,
      select: {
        id: true,
        titulo: true,
        estado: true,
        progreso: true,
        _count: {
          select: {
            tareas: true,
            gruposTareas: true
          }
        }
      }
    })
    
    console.log('\n📋 Primeros 3 objetivos:')
    objetivos.forEach(obj => {
      console.log(`  - ${obj.titulo} (${obj.estado}) - ${obj._count.tareas} tareas, ${obj._count.gruposTareas} grupos`)
    })
    
    // Verificar si hay tareas marcadas como completadas
    const tareasCompletadas = await prisma.roadmapTarea.count({
      where: { done: true }
    })
    console.log(`\n✅ Tareas completadas: ${tareasCompletadas}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
