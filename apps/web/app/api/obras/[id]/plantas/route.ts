import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

type NormalizedPlanta = {
  id: string;
  nombre: string;
  metrosCubiertos: number;
  metrosDescubiertos: number;
  metrosTotales: number;
  orden: number;
};

const TABLE_CANDIDATES = [
  'obras_superficies',
  'obra_superficies',
  'obras_plantas',
  'obra_plantas',
  'plantas_obras',
  'plantas',
] as const;

const NUMERIC_KEYS = ['planta', 'numero', 'nivel', 'order', 'orden', 'idx'];
const NAME_KEYS = ['nombre', 'name', 'alias', 'rotulo', 'titulo', 'label'];
const COVERED_KEYS = [
  'metros_cubiertos',
  'm2_cubiertos',
  'metros_cubiertos_estimados',
  'cubiertos',
  'covered',
];
const UNCOVERED_KEYS = [
  'metros_descubiertos',
  'm2_descubiertos',
  'descubiertos',
  'uncovered',
];
const TOTAL_KEYS = [
  'metros_totales',
  'm2_totales',
  'total',
  'metros',
  'area_total',
];

type ObraRecord = {
  id: string;
  superficies: unknown;
  plantas: unknown;
};

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function coalesceRowValue<T = string | number>(
  row: Record<string, unknown>,
  keys: string[],
  fallback: T,
): T {
  const normalizedLookup = Object.keys(row).reduce<Record<string, string>>(
    (acc, currentKey) => {
      acc[normalizeKey(currentKey)] = currentKey;
      return acc;
    },
    {},
  );

  for (const key of keys) {
    const directKey = key;
    const normalizedKey = normalizeKey(key);
    const realKey =
      Object.prototype.hasOwnProperty.call(row, directKey)
        ? directKey
        : normalizedLookup[normalizedKey];

    if (realKey && Object.prototype.hasOwnProperty.call(row, realKey)) {
      const value = row[realKey];
      if (value !== undefined && value !== null && value !== '') {
        return value as T;
      }
    }
  }
  return fallback;
}

function normalizePlantas(rows: Record<string, unknown>[]): NormalizedPlanta[] {
  return rows.map((row, index) => {
    const orden = Number(coalesceRowValue(row, NUMERIC_KEYS, index + 1));
    const nombre = String(
      coalesceRowValue(row, NAME_KEYS, `Planta ${orden || index + 1}`),
    );
    const metrosCubiertos = Number(coalesceRowValue(row, COVERED_KEYS, 0));
    const metrosDescubiertos = Number(coalesceRowValue(row, UNCOVERED_KEYS, 0));
    const metrosTotales =
      Number(
        coalesceRowValue(row, TOTAL_KEYS, metrosCubiertos + metrosDescubiertos),
      ) || metrosCubiertos + metrosDescubiertos;

    const idRaw =
      (typeof row.id === 'string' && row.id) ||
      String(coalesceRowValue(row, NUMERIC_KEYS, orden || index + 1));

    return {
      id: idRaw,
      nombre,
      metrosCubiertos: Number.isFinite(metrosCubiertos) ? metrosCubiertos : 0,
      metrosDescubiertos: Number.isFinite(metrosDescubiertos)
        ? metrosDescubiertos
        : 0,
      metrosTotales: Number.isFinite(metrosTotales)
        ? metrosTotales
        : metrosCubiertos + metrosDescubiertos,
      orden: Number.isFinite(orden) ? orden : index + 1,
    };
  });
}

function parseSuperficies(value: unknown): Record<string, unknown>[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value as Record<string, unknown>[];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseSuperficies(parsed);
    } catch (error) {
      console.warn('[OBRAS_PLANTAS] No se pudo parsear superficies string', error);
      return [];
    }
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.superficies)) {
      return record.superficies as Record<string, unknown>[];
    }

    const values = Object.values(record).filter(
      (item) => item && typeof item === 'object',
    ) as Record<string, unknown>[];

    if (values.length > 0) {
      return values;
    }

    if ('planta' in record || 'cubiertos' in record || 'descubiertos' in record) {
      return [record];
    }
  }

  return [];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: obraId } = await params;

    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'El parámetro id es requerido' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    // 1) Intentar leer directamente la obra (superficies jsonb)
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, superficies, plantas')
      .eq('id', obraId)
      .maybeSingle<ObraRecord>();

    if (obraError) {
      console.warn('[OBRAS_PLANTAS] Error obteniendo obra:', obraError);
    }

    if (obra) {
      const superficies = parseSuperficies(obra.superficies);
      if (superficies.length > 0) {
        console.log('[OBRAS_PLANTAS] Superficies detectadas para obra', obraId, superficies);
        const plantas = normalizePlantas(superficies);
        console.log('[OBRAS_PLANTAS] Plantas normalizadas', plantas);
        plantas.sort((a, b) => a.orden - b.orden);

        return NextResponse.json(
          {
            success: true,
            data: plantas,
          },
          { status: 200 },
        );
      }
    }

    // 2) Buscar en tablas candidatas (por compatibilidad)
    for (const table of TABLE_CANDIDATES) {
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .eq('obra_id', obraId);

      if (error) {
        continue;
      }

      if (!data || data.length === 0) {
        continue;
      }

      const plantas = normalizePlantas(data as Record<string, unknown>[]);
      plantas.sort((a, b) => a.orden - b.orden);

      return NextResponse.json(
        {
          success: true,
          data: plantas,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[OBRAS_PLANTAS_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      },
      { status: 500 },
    );
  }
}


