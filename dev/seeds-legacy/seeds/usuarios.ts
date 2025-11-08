import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as PrismaClient & { miembroOrganizacion: any };

export async function seedUsuarios() {
  console.log('🌱 Iniciando seed de usuarios de ejemplo...');

  try {
    // Crear usuarios de ejemplo
    const usuarios = [
      {
        email: 'admin@grows.com',
        nombre: 'Administrador GROWS',
        rol: 'ADMIN' as const,
      },
      {
        email: 'cliente@grows.com',
        nombre: 'Cliente Técnico',
        rol: 'CLIENTE_TECNICO' as const,
      },
      {
        email: 'socio@grows.com',
        nombre: 'Socio Constructor',
        rol: 'SOCIO' as const,
      },
    ];

    const usuariosCreados = [];

    for (const usuarioData of usuarios) {
      const usuario = await prisma.usuario.create({
        data: {
          email: usuarioData.email,
          nombre: usuarioData.nombre,
          activo: true,
        },
      });

      usuariosCreados.push(usuario);
      console.log(`✅ Usuario creado: ${usuario.nombre} (${usuario.email})`);
    }

    // Asociar usuarios a organizaciones
    const organizaciones = await prisma.organizacion.findMany();

    for (const organizacion of organizaciones) {
      // Asociar admin a todas las organizaciones
      const admin = usuariosCreados.find(u => u.email === 'admin@grows.com');
      if (admin) {
        await prisma.miembroOrganizacion.create({
          data: {
            organizacionId: organizacion.id,
            usuarioId: admin.id,
            rol: 'ADMIN',
            activo: true,
            fechaAceptacion: new Date(),
          },
        });
      }

      // Asociar cliente técnico a organizaciones STARTER y PRO
      if (organizacion.plan === 'STARTER' || organizacion.plan === 'PRO') {
        const cliente = usuariosCreados.find(u => u.email === 'cliente@grows.com');
        if (cliente) {
          await prisma.miembroOrganizacion.create({
            data: {
              organizacionId: organizacion.id,
              usuarioId: cliente.id,
              rol: 'CLIENTE_TECNICO',
              activo: true,
              fechaAceptacion: new Date(),
            },
          });
        }
      }

      // Asociar socio a organizaciones PRO y ENTERPRISE
      if (organizacion.plan === 'PRO' || organizacion.plan === 'ENTERPRISE') {
        const socio = usuariosCreados.find(u => u.email === 'socio@grows.com');
        if (socio) {
          await prisma.miembroOrganizacion.create({
            data: {
              organizacionId: organizacion.id,
              usuarioId: socio.id,
              rol: 'SOCIO',
              activo: true,
              fechaAceptacion: new Date(),
            },
          });
        }
      }
    }

    console.log('✅ Seed de usuarios completado');

  } catch (error) {
    console.error('❌ Error en seed de usuarios:', error);
    throw error;
  }
}
