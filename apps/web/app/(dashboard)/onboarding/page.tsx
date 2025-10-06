import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import OnboardingClient from './onboarding-client';
import { ensureOrgForUser } from '@/lib/orgs';
import { PrismaClient } from '@prisma/client';
import type { Database } from '@/lib/types/supabase.gen';

const prisma = new PrismaClient();

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerComponentClient<Database>({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const org = await ensureOrgForUser(
    user.id,
    user.user_metadata?.full_name ?? user.email ?? 'Organización'
  );

  if (org.onboarding_completed) {
    redirect('/dashboard');
  }

  // Obtener datos usando Prisma
  const [obras, socios, tareas, invites] = await Promise.all([
    prisma.obra.findMany({
      where: { organizacionId: org.id },
      select: {
        id: true,
        nombre: true,
        localizacion: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    }),
    prisma.usuario.findMany({
      where: {
        miembrosOrganizacion: {
          some: {
            organizacionId: org.id,
            activo: true,
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    }),
    prisma.tarea.findMany({
      where: {
        elemento: {
          obra: {
            organizacionId: org.id,
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estado: true,
        created_at: true,
        elemento: {
          select: {
            obra: {
              select: {
                id: true,
                nombre: true,
                organizacionId: true,
              },
            },
          },
        },
      },
    }),
    [], // Por ahora no tenemos invites en Prisma
  ]);

  return (
    <OnboardingClient
      org={org}
      initialObras={obras.map(obra => ({
        id: obra.id,
        nombre: obra.nombre,
        localizacion: obra.localizacion || '',
        cliente: obra.cliente.nombre,
        org_id: org.id,
        created_at: obra.created_at.toISOString(),
      }))}
      initialSocios={socios.map(socio => ({ id: socio.id, nombre: socio.nombre }))}
      initialTareas={tareas.map(tarea => ({
        id: tarea.id,
        obra_id: tarea.elemento.obra.id,
        tipo: 'construccion',
        descripcion: tarea.descripcion || '',
        estado: tarea.estado === 'PROPUESTA' ? 'pendiente' : 
                tarea.estado === 'PRESUPUESTADA' ? 'pendiente' :
                tarea.estado === 'ASIGNADA' ? 'pendiente' :
                tarea.estado === 'EN_EJECUCION' ? 'en_ejecucion' :
                tarea.estado === 'TERMINADA' ? 'finalizado' :
                tarea.estado === 'VALIDADA' ? 'validado' : 'pendiente',
        obra: {
          id: tarea.elemento.obra.id,
          nombre: tarea.elemento.obra.nombre,
          org_id: tarea.elemento.obra.organizacionId,
        },
      }))}
      initialInvites={invites}
    />
  );
}
