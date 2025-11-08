import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

type PrismaWithLegacy = PrismaClient & {
  miembroOrganizacion?: {
    findFirst: (...args: any[]) => Promise<any>;
  };
};

const prisma = new PrismaClient() as PrismaWithLegacy;

export interface AuthContext {
  usuarioId: string;
  organizacionId: string;
  rol: string;
}

/**
 * Middleware de autenticación que extrae y valida el contexto del usuario
 */
export async function authMiddleware(request: NextRequest): Promise<AuthContext | null> {
  try {
    const usuarioId = request.headers.get('x-usuario-id');
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!usuarioId || !organizacionId) {
      return null;
    }

    // Verificar que el usuario pertenece a la organización si el modelo existe
    const miembroDelegate = prisma.miembroOrganizacion;

    if (miembroDelegate) {
      const miembro = await miembroDelegate.findFirst({
        where: {
          usuarioId,
          organizacionId,
          activo: true,
        },
        include: {
          usuario: {
            select: {
              id: true,
              activo: true,
            },
          },
        },
      });

      if (!miembro || !miembro.usuario?.activo) {
        return null;
      }

      return {
        usuarioId,
        organizacionId,
        rol: miembro.rol ?? 'usuario',
      };
    }

    // Fallback: confiar en los headers cuando la tabla legacy no está disponible
    return {
      usuarioId,
      organizacionId,
      rol: request.headers.get('x-rol') ?? 'usuario',
    };

  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return null;
  }
}

/**
 * Wrapper para endpoints que requieren autenticación
 */
export function withAuth(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authContext = await authMiddleware(request);

    if (!authContext) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    return handler(request, authContext);
  };
}

/**
 * Wrapper para endpoints que requieren un rol específico
 */
export function withRole(requiredRole: string, handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authContext = await authMiddleware(request);

    if (!authContext) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (authContext.rol !== requiredRole && authContext.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    return handler(request, authContext);
  };
}

/**
 * Wrapper para endpoints que requieren permisos específicos
 */
export function withPermission(permission: string, handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authContext = await authMiddleware(request);

    if (!authContext) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos usando el servicio
    const { PermisosService } = await import('../services');
    const tienePermiso = await PermisosService.verificarPermiso(
      authContext.usuarioId,
      authContext.organizacionId,
      permission
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    return handler(request, authContext);
  };
}
