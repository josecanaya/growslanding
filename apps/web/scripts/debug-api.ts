// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function debugAPI() {
  try {
    console.log('🔍 Debugging API query...')
    
    // Hacer la misma consulta que hace la API
    const objetivos = await prisma.roadmapObjetivo.findMany({
      include: {
        tareas: true,
        gruposTareas: {
          include: {
            tareas: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Objetivos encontrados: ${objetivos.length}`)
    
    if (objetivos.length > 0) {
      console.log('📋 Primer objetivo:')
      console.log(JSON.stringify(objetivos[0], null, 2))
    } else {
      console.log('❌ No se encontraron objetivos')
      
      // Verificar si hay datos sin includes
      const objetivosSimple = await prisma.roadmapObjetivo.findMany()
      console.log(`📊 Objetivos simples: ${objetivosSimple.length}`)
      
      if (objetivosSimple.length > 0) {
        console.log('📋 Primer objetivo simple:')
        console.log(JSON.stringify(objetivosSimple[0], null, 2))
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAPI()
