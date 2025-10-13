import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 Probando conexión directa a la DB...');
    
    // Contar objetivos directamente
    const count = await prisma.roadmapObjetivo.count();
    console.log(`📊 Objetivos encontrados: ${count}`);
    
    // Obtener algunos objetivos
    const objetivos = await prisma.roadmapObjetivo.findMany({
      take: 3,
      select: {
        id: true,
        titulo: true,
        estado: true,
        _count: {
          select: {
            tareas: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      count,
      objetivos,
      message: 'Conexión a DB exitosa'
    });
    
  } catch (error) {
    console.error('❌ Error en test API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
