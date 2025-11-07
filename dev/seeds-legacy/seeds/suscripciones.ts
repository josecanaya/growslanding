import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSuscripciones() {
  console.log('🌱 Iniciando seed de planes de suscripción...');

  try {
    // Definir límites por plan
    const planes = [
      {
        plan: 'STARTER',
        obrasMax: 2,
        sociosMax: 5,
        descripcion: 'Plan básico para proyectos pequeños',
      },
      {
        plan: 'PRO',
        obrasMax: 10,
        sociosMax: 25,
        descripcion: 'Plan profesional para empresas medianas',
      },
      {
        plan: 'ENTERPRISE',
        obrasMax: 999999, // Prácticamente ilimitado
        sociosMax: 999999, // Prácticamente ilimitado
        descripcion: 'Plan empresarial sin límites',
      },
    ];

    // Crear organizaciones de ejemplo para cada plan
    for (const plan of planes) {
      const organizacion = await prisma.organizacion.create({
        data: {
          nombre: `Organización ${plan.plan}`,
          plan: plan.plan as 'STARTER' | 'PRO' | 'ENTERPRISE',
          obrasMax: plan.obrasMax,
          sociosMax: plan.sociosMax,
          activa: true,
        },
      });

      // Crear suscripción activa
      await prisma.suscripcion.create({
        data: {
          organizacionId: organizacion.id,
          plan: plan.plan as 'STARTER' | 'PRO' | 'ENTERPRISE',
          obrasMax: plan.obrasMax,
          sociosMax: plan.sociosMax,
          fechaInicio: new Date(),
          activa: true,
        },
      });

      console.log(`✅ Organización ${plan.plan} creada con límites: ${plan.obrasMax} obras, ${plan.sociosMax} socios`);
    }

    console.log('✅ Seed de suscripciones completado');

  } catch (error) {
    console.error('❌ Error en seed de suscripciones:', error);
    throw error;
  }
}
