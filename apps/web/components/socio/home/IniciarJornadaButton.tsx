'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useToast } from '@/components/ui/use-toast';

export function IniciarJornadaButton() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  const [jornadaActiva, setJornadaActiva] = useState<{
    id: string;
    fecha: string;
    hora_inicio: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  // Verificar si hay jornada activa
  useEffect(() => {
    const verificarJornada = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        // Obtener socio_id
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) {
          setLoading(false);
          return;
        }

        // Buscar jornada activa (sin hora_fin) del día de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('id, fecha, hora_inicio, hora_fin')
          .eq('socio_id', socioData.id)
          .eq('fecha', hoy)
          .is('hora_fin', null)
          .maybeSingle();

        if (jornadaData) {
          setJornadaActiva({
            id: jornadaData.id,
            fecha: jornadaData.fecha,
            hora_inicio: jornadaData.hora_inicio,
          });
        }
      } catch (error) {
        // Error silencioso
      } finally {
        setLoading(false);
      }
    };

    verificarJornada();
  }, [currentUser?.id, currentUser?.email, supabase]);

  const handleIniciarJornada = async () => {
    if (!currentUser?.id) return;

    setIniciando(true);

    try {
      // Obtener socio_id
      const { data: socioData } = await (supabase as any)
        .from('socios')
        .select('id')
        .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
        .maybeSingle();

      if (!socioData?.id) {
        throw new Error('Socio no encontrado');
      }

      // Crear jornada
      const hoy = new Date().toISOString().split('T')[0];
      const ahora = new Date().toISOString();

      const { data: nuevaJornada, error: jornadaError } = await (supabase as any)
        .from('jornadas_socio')
        .insert({
          socio_id: socioData.id,
          fecha: hoy,
          hora_inicio: ahora,
          hora_fin: null,
        })
        .select('id')
        .single();

      if (jornadaError) {
        throw jornadaError;
      }

      // Redirigir a AHORA
      router.push('/socio/ahora');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar la jornada',
        variant: 'destructive',
      });
    } finally {
      setIniciando(false);
    }
  };

  const handleIrAAhora = () => {
    router.push('/socio/ahora');
  };

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Caso B: Jornada ya iniciada
  if (jornadaActiva) {
    return (
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">Jornada en curso</span>
          </div>
          <Button
            onClick={handleIrAAhora}
            size="sm"
            variant="outline"
            className="text-sm"
          >
            Ir a AHORA
          </Button>
        </div>
      </div>
    );
  }

  // Caso A: Jornada no iniciada
  return (
    <div className="px-4 py-3 bg-white border-b border-gray-200">
      <Button
        onClick={handleIniciarJornada}
        disabled={iniciando}
        className="w-full bg-[#276EF1] hover:bg-[#1E56D9] text-white"
        size="default"
      >
        {iniciando ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Iniciar jornada
          </>
        )}
      </Button>
    </div>
  );
}


