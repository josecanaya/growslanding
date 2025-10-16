import { PrismaClient, TipoObra, EtapaObra, EstadoTarea, TipoActor } from '@prisma/client';

const prisma = new PrismaClient();

export interface ObraCompletaData {
  nombre: string;
  descripcion?: string;
  localizacion: string;
  tipoObra: TipoObra;
  fechaInicio: Date;
  fechaFin?: Date;
  numeroPermiso?: string;
  clienteTecnicoId: string;
  elementos: {
    nombre: string;
    categoria: string;
    descripcion?: string;
    duracion: number;
    etapa: EtapaObra;
    tareas: {
      nombre: string;
      descripcion?: string;
      duracion: number;
      etapa: EtapaObra;
      precedencias?: string[];
      referenteId?: string;
      socioIds?: string[];
    }[];
  }[];
}

export class ObrasService {
  static async crearObraCompleta(data: ObraCompletaData) {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear obra
      const obra = await tx.obra.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          localizacion: data.localizacion,
          tipoObra: data.tipoObra,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          numeroPermiso: data.numeroPermiso,
          clienteTecnicoId: data.clienteTecnicoId,
        },
      });

      // 2. Crear elementos y tareas
      for (const elementoData of data.elementos) {
        const elemento = await tx.elementoObra.create({
          data: {
            nombre: elementoData.nombre,
            categoria: elementoData.categoria,
            descripcion: elementoData.descripcion,
            duracion: elementoData.duracion,
            etapa: elementoData.etapa,
            obraId: obra.id,
          },
        });

        // 3. Crear tareas para este elemento
        for (const tareaData of elementoData.tareas) {
          const tarea = await tx.tarea.create({
            data: {
              nombre: tareaData.nombre,
              descripcion: tareaData.descripcion,
              duracion: tareaData.duracion,
              etapa: tareaData.etapa,
              precedencias: tareaData.precedencias || [],
              referenteId: tareaData.referenteId,
              socioIds: tareaData.socioIds || [],
              elementoId: elemento.id,
              obraId: obra.id,
            },
          });

          // 4. Crear estado inicial
          await tx.tareaEstado.create({
            data: {
              tareaId: tarea.id,
              estadoAnterior: null,
              estadoNuevo: 'RECIBIDO',
              actorTipo: 'SISTEMA',
              actorId: null,
              comentario: 'Tarea creada',
            },
          });
        }
      }

      return obra;
    });
  }

  static async obtenerObrasPorCliente(clienteTecnicoId: string) {
    return await prisma.obra.findMany({
      where: { clienteTecnicoId },
      include: {
        elementos: {
          include: {
            tareas: {
              include: {
                socio: true,
                estadosHistorial: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
                pagos: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async obtenerObraConDetalles(obraId: string) {
    return await prisma.obra.findUnique({
      where: { id: obraId },
      include: {
        clienteTecnico: true,
        elementos: {
          include: {
            tareas: {
              include: {
                socio: true,
                estadosHistorial: {
                  orderBy: { createdAt: 'desc' },
                },
                pagos: true,
                evidencias: true,
              },
            },
          },
          orderBy: { orden: 'asc' },
        },
      },
    });
  }
}
