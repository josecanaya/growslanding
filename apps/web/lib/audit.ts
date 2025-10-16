import { prisma } from '@/lib/prisma';

export async function auditEvent({
  orgId,
  tipo,
  descripcion,
}: {
  orgId: string;
  tipo: string;
  descripcion?: string;
}) {
  try {
    await prisma.evento.create({
      data: {
        orgId,
        tipo,
        descripcion: descripcion || null,
        fecha: new Date(),
        createdAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('Error registrando evento de auditoría:', error);
    return false;
  }
}