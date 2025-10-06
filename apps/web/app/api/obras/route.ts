import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { resolveOrgContext } from '@/lib/orgs';
import type { Database } from '@/lib/types/supabase.gen';
import { ObraService } from '@/lib/services/obra.service';
import { ObraQuerySchema } from '@/lib/schemas';

export const runtime = 'nodejs';

const obraSchema = z.object({
  nombre: z.string().min(2),
  localizacion: z.string().optional().nullable(),
  cliente: z.string().optional().nullable(),
  
  // Nuevos campos para datos generales
  cantidad_plantas: z.number().optional().nullable(),
  superficie_por_planta: z.number().optional().nullable(),
  superficie_total: z.number().optional().nullable(),
  ancho_terreno: z.number().optional().nullable(),
  largo_terreno: z.number().optional().nullable(),
  ancho_planta: z.number().optional().nullable(),
  largo_planta: z.number().optional().nullable(),
  tipo_proyecto: z.string().optional().nullable(),
  coordenadas_lat: z.number().optional().nullable(),
  coordenadas_lng: z.number().optional().nullable(),
  direccion_completa: z.string().optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  presupuesto: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      estado: searchParams.get('estado') ?? undefined,
      limit: Number(searchParams.get('limit') ?? '20'),
      offset: Number(searchParams.get('offset') ?? '0'),
      search: searchParams.get('search') ?? undefined,
    };

    const validatedQuery = ObraQuerySchema.safeParse(query);
    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          message: 'Error de validacion',
          errors: validatedQuery.error.flatten(),
        },
        { status: 400 },
      );
    }

    const resultado = await ObraService.obtenerObras(validatedQuery.data, 'demo-org');

    return NextResponse.json({
      obras: resultado.obras,
      paginacion: resultado.paginacion,
    });
  } catch (err: unknown) {
    console.error('Error en GET /api/obras:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json(
      {
        message,
        stack: isDev && err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = obraSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Error de validacion',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const obraPayload = {
      nombre: data.nombre,
      localizacion: data.localizacion ?? undefined,
      cliente: data.cliente ?? undefined,
      
      // Nuevos campos para datos generales
      cantidad_plantas: data.cantidad_plantas ?? undefined,
      superficie_por_planta: data.superficie_por_planta ?? undefined,
      superficie_total: data.superficie_total ?? undefined,
      ancho_terreno: data.ancho_terreno ?? undefined,
      largo_terreno: data.largo_terreno ?? undefined,
      ancho_planta: data.ancho_planta ?? undefined,
      largo_planta: data.largo_planta ?? undefined,
      tipo_proyecto: data.tipo_proyecto ?? undefined,
      coordenadas_lat: data.coordenadas_lat ?? undefined,
      coordenadas_lng: data.coordenadas_lng ?? undefined,
      direccion_completa: data.direccion_completa ?? undefined,
      fecha_inicio: data.fecha_inicio ?? undefined,
      presupuesto: data.presupuesto ?? undefined,
      descripcion: data.descripcion ?? undefined,
    };
    const obra = await ObraService.crearObra(obraPayload as any, 'demo-org');

    return NextResponse.json(obra, { status: 201 });
  } catch (err: unknown) {
    console.error('Error en POST /api/obras:', err);
    const isDev = process.env.NODE_ENV !== 'production';

    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json(
      {
        message,
        stack: isDev && err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
