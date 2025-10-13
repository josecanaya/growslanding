import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function seedRoadmapData() {
  try {
    console.log('🌱 Iniciando seed de datos del roadmap...')
    
    // Leer el archivo JSON
    const dataPath = path.join(process.cwd(), 'data/roadmap.initial.json')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const roadmapData = JSON.parse(rawData)
    
    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...')
    await prisma.roadmapTarea.deleteMany()
    await prisma.roadmapGrupoTareas.deleteMany()
    await prisma.roadmapObjetivo.deleteMany()
    
    // Procesar proyecto GROWS
    const growsProject = roadmapData.projects.find(p => p.projectName === 'GROWS')
    
    if (!growsProject) {
      throw new Error('No se encontró el proyecto GROWS')
    }
    
    console.log(`📋 Procesando ${growsProject.objectives.length} objetivos del proyecto GROWS...`)
    
    for (const objective of growsProject.objectives) {
      console.log(`  📌 Creando objetivo: ${objective.title}`)
      
      // Crear objetivo
      const createdObjective = await prisma.roadmapObjetivo.create({
        data: {
          id: objective.id,
          titulo: objective.title,
          descripcion: objective.description,
          prioridad: objective.priority,
          estado: objective.status,
          progreso: 0, // Se calculará después
          startWeek: objective.startWeek || null,
          endWeek: objective.endWeek || null,
          targetWeeks: objective.targetWeeks || null,
          dueDate: objective.dueDate ? new Date(objective.dueDate) : null,
          // categoria: objective.category || 'CORE_SISTEMA', // Campo no existe en schema
        }
      })
      
      // Procesar grupos de tareas
      if (objective.taskGroups) {
        for (const group of objective.taskGroups) {
          console.log(`    📁 Creando grupo: ${group.title}`)
          
          const createdGroup = await prisma.roadmapGrupoTareas.create({
            data: {
              id: group.id,
              titulo: group.title,
              descripcion: group.description,
              objetivoId: createdObjective.id,
            }
          })
          
          // Procesar tareas del grupo
          if (group.tasks) {
            for (const task of group.tasks) {
              console.log(`      ✅ Creando tarea: ${task.text}`)
              
              await prisma.roadmapTarea.create({
                data: {
                  id: task.id,
                  texto: task.text,
                  estado: task.done ? 'done' : 'pending',
                  done: task.done || false,
                  estimateHrs: task.estimateHrs || null,
                  owner: task.owner || null,
                  prioridad: task.priority || 'MEDIA',
                  dueDate: task.dueDate ? new Date(task.dueDate) : null,
                  objetivoId: createdObjective.id,
                  grupoId: createdGroup.id,
                }
              })
            }
          }
        }
      }
      
      // Procesar tareas directas (sin grupo)
      if (objective.tasks) {
        for (const task of objective.tasks) {
          console.log(`    ✅ Creando tarea directa: ${task.text}`)
          
          await prisma.roadmapTarea.create({
            data: {
              id: task.id,
              texto: task.text,
              estado: task.done ? 'done' : 'pending',
              done: task.done || false,
              estimateHrs: task.estimateHrs || null,
              owner: task.owner || null,
              prioridad: task.priority || 'MEDIA',
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              objetivoId: createdObjective.id,
            }
          })
        }
      }
    }
    
    console.log('✅ Seed completado exitosamente!')
    console.log(`📊 Objetivos creados: ${growsProject.objectives.length}`)
    
    // Contar tareas totales
    const totalTasks = await prisma.roadmapTarea.count()
    console.log(`📊 Tareas creadas: ${totalTasks}`)
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedRoadmapData()
    .then(() => {
      console.log('🎉 Seed finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

export default seedRoadmapData
