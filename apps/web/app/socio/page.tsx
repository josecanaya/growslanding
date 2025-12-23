'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { HomeSolicitudesSection } from '@/components/socio/home/HomeSolicitudesSection';
import { HomePresupuestosSection } from '@/components/socio/home/HomePresupuestosSection';
import { HomeTrabajoActualSection } from '@/components/socio/home/HomeTrabajoActualSection';
import { AccesosRapidosGrid } from '@/components/socio/home/AccesosRapidosGrid';
import { TrabajosHoySection } from '@/components/socio/home/TrabajosHoySection';
import { useToast } from '@/components/ui/use-toast';

export default function SocioHomePage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [estadoOperativo, setEstadoOperativo] = useState<string>('Buscando nuevas oportunidades');
  const [jornadaActiva, setJornadaActiva] = useState<{
    id: string;
    fecha: string;
    hora_inicio: string;
  } | null>(null);
  const [loadingJornada, setLoadingJornada] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  // Cargar notificaciones no leídas
  useEffect(() => {
    if (!currentUser?.orgId) return;

    const fetchNotificaciones = async () => {
      try {
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) return;

        const { count } = await (supabase as any)
          .from('notificaciones')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', currentUser.orgId)
          .eq('socio_id', socioData.id)
          .eq('leida', false);

        if (count !== null) {
          setNotificacionesNoLeidas(count);
        }
      } catch (error) {
        // Error silencioso
      }
    };

    fetchNotificaciones();
  }, [currentUser?.orgId, currentUser?.email, currentUser?.id, supabase]);

  // Verificar jornada activa
  useEffect(() => {
    const verificarJornada = async () => {
      if (!currentUser?.id || !currentUser?.orgId) {
        setLoadingJornada(false);
        return;
      }

      try {
        // Obtener socio_id
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) {
          setLoadingJornada(false);
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
        setLoadingJornada(false);
      }
    };

    verificarJornada();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  // Determinar estado operativo
  useEffect(() => {
    if (!currentUser?.id || !currentUser?.orgId) return;

    const determinarEstado = async () => {
      try {
        // Verificar si hay trabajo activo
        const { data: tareasData } = await (supabase as any)
          .from('tareas')
          .select('id, obras(name)')
          .eq('org_id', currentUser.orgId)
          .eq('responsable', currentUser.id)
          .eq('estado', 'en_progreso')
          .limit(1);

        if (tareasData && tareasData.length > 0) {
          const obraName = tareasData[0].obras?.name || 'una obra';
          setEstadoOperativo(`Trabajando en ${obraName}`);
          return;
        }

        // Verificar presupuestos pendientes
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (socioData?.id) {
          const { data: presupuestosData } = await (supabase as any)
            .from('tareas_presupuestos')
            .select('id')
            .eq('socio_id', socioData.id)
            .eq('estado', 'PENDIENTE')
            .limit(1);

          if (presupuestosData && presupuestosData.length > 0) {
            setEstadoOperativo('Tienes presupuestos pendientes');
            return;
          }
        }

        setEstadoOperativo('Buscando nuevas oportunidades');
      } catch (error) {
        setEstadoOperativo('Buscando nuevas oportunidades');
      }
    };

    determinarEstado();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  const handleNotificacionesClick = () => {
    router.push('/socio/notificaciones');
  };

  const handleIniciarJornada = async () => {
    if (!currentUser?.id) return;

    setIniciando(true);

    try {
      // Obtener socio_id
      const { data: socioData } = await (supabase as any)
        .from('socios')
        .select('id')
        .eq('org_id', currentUser.orgId)
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

      // Redirigir inmediatamente a AHORA
      router.push('/socio/ahora');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar la jornada',
        variant: 'destructive',
      });
      setIniciando(false);
    }
  };

  const handleIrAAhora = () => {
    router.push('/socio/ahora');
  };

  // Formatear hora de inicio
  const formatHoraInicio = (horaISO: string) => {
    try {
      const date = new Date(horaISO);
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header simple - logo + notificaciones */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-[70px] z-10">
        <div className="flex items-center justify-end">
          {/* Notificaciones */}
          {notificacionesNoLeidas > 0 && (
            <button
              onClick={handleNotificacionesClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {/* Saludo / estado del socio */}
        <div className="mb-3">
          <h1 className="text-xl font-semibold text-gray-900">
            Hola, {currentUser?.name || 'Socio'}
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {estadoOperativo}
          </p>
        </div>

        {/* Accesos rápidos - movidos aquí, justo después del saludo */}
        <div className="mb-4 -mx-4 px-4">
          <AccesosRapidosGrid hideTitle compact />
        </div>

        {/* Solicitudes de trabajo */}
        <div className="space-y-6">
          <HomeSolicitudesSection />

          {/* Trabajos para hoy */}
          <TrabajosHoySection />

          {/* Mis presupuestos */}
          <HomePresupuestosSection />

          {/* Trabajo actual */}
          <HomeTrabajoActualSection />
        </div>
      </div>

      {/* CTA FINAL: Iniciar jornada - al final, antes del TabBar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 z-30 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7] to-transparent pt-6">
        {loadingJornada ? (
          <div className="h-[56px] bg-gray-200 rounded-lg animate-pulse" />
        ) : iniciando ? (
          // Estado B: Iniciando (feedback inmediato)
          <div className="h-[56px] flex items-center justify-center gap-2 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold text-blue-700">Iniciando jornada…</span>
          </div>
        ) : jornadaActiva ? (
          // Estado C: Jornada activa (card compacta)
          <Card className="border-green-200 bg-green-50/50 shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-semibold text-gray-900">Jornada en curso</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Inicio: {formatHoraInicio(jornadaActiva.hora_inicio)} hs
                  </p>
                </div>
                <Button
                  onClick={handleIrAAhora}
                  size="sm"
                  className="bg-[#276EF1] hover:bg-[#1E56D9] text-white text-xs h-8"
                >
                  Ir a AHORA
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Estado A: Jornada no iniciada - CTA final
          <Button
            onClick={handleIniciarJornada}
            disabled={iniciando}
            className="w-full bg-green-200 hover:bg-green-300 text-gray-800 h-[56px] text-base font-semibold shadow-lg"
          >
            <Play className="h-5 w-5 mr-2" />
            Conectarse
          </Button>
        )}
      </div>
    </div>
  );
}
