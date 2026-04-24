'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ArrowLeft, Clock, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/types/supabase.gen';
import { STITCH_INNER, StitchH2Page } from '@/components/socio/stitch/socioStitchUi';

type Jornada = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  obra_id: string | null;
  obra?: {
    id: string;
    name: string | null;
  } | null;
};

export default function JornadasPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState({ totalHoras: 0, totalJornadas: 0 });

  useEffect(() => {
    const cargarJornadas = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await (supabase as any)
          .from('jornadas_socio')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            obra_id,
            obra:obras (
              id,
              name
            )
          `)
          .eq('socio_id', currentUser.id)
          .order('fecha', { ascending: false });

        if (queryError) {
          setError('Error al cargar las jornadas');
          setLoading(false);
          return;
        }

        const jornadasData = (data || []) as Jornada[];
        setJornadas(jornadasData);

        // Calcular resumen del último mes
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const inicioMesISO = inicioMes.toISOString().split('T')[0];

        const jornadasMes = jornadasData.filter((j) => j.fecha >= inicioMesISO);
        let totalHoras = 0;

        jornadasMes.forEach((j) => {
          if (j.hora_inicio && j.hora_fin) {
            const inicio = new Date(j.hora_inicio);
            const fin = new Date(j.hora_fin);
            const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
            totalHoras += horas;
          }
        });

        setResumen({
          totalHoras: Math.round(totalHoras * 100) / 100,
          totalJornadas: jornadasMes.length,
        });
      } catch (err) {
        setError('Error al cargar las jornadas');
      } finally {
        setLoading(false);
      }
    };

    cargarJornadas();
  }, [currentUser?.id, supabase]);

  const calcularHoras = (horaInicio: string, horaFin: string | null): number => {
    if (!horaInicio || !horaFin) return 0;
    const inicio = new Date(horaInicio);
    const fin = new Date(horaFin);
    const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    return Math.round(horas * 100) / 100;
  };

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={STITCH_INNER + ' flex min-h-[40vh] items-center justify-center'}>
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-stitch-primary" />
          <p className="text-sm text-stitch-on-surface/70">Cargando jornadas…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stitch-surface pb-28 font-stitch-body">
      <div className={STITCH_INNER + ' space-y-4 pt-2'}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors hover:bg-stitch-surface-container"
          >
            <ArrowLeft className="h-6 w-6 text-stitch-on-surface" />
          </button>
          <StitchH2Page title="Jornadas" description="Historial de tus jornadas laborales." />
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50/90 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {resumen.totalJornadas > 0 && (
          <Card className="border-stitch-surface-container shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-stitch-primary" />
                <h2 className="text-sm font-semibold text-stitch-on-surface">Resumen del mes</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de horas:</span>
                  <span className="text-sm font-semibold text-gray-900">{resumen.totalHoras} hs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de jornadas:</span>
                  <span className="text-sm font-semibold text-gray-900">{resumen.totalJornadas}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de jornadas */}
        {jornadas.length === 0 ? (
          <Card className="border-dashed border-stitch-outline/35">
            <CardContent className="p-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-stitch-outline" />
              <p className="text-sm text-stitch-on-surface/65">No hay jornadas registradas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jornadas.map((jornada) => {
              const horas = calcularHoras(jornada.hora_inicio, jornada.hora_fin);
              return (
                <Card key={jornada.id} className="border-stitch-surface-container shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatearFecha(jornada.fecha)}
                        </span>
                      </div>
                      {horas > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{horas} hs</span>
                        </div>
                      )}
                    </div>
                    {jornada.obra?.name && (
                      <div className="flex items-center gap-2 mt-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{jornada.obra.name}</span>
                      </div>
                    )}
                    {!jornada.hora_fin && (
                      <div className="mt-2">
                        <span className="text-xs text-yellow-600 font-medium">Jornada en curso</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </div>
    </div>
  );
}

