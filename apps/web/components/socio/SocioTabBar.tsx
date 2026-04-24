'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Clock, Wallet, TrendingUp, User, Play, PlusCircle, LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Route } from 'next';
import { useToast } from '@/components/ui/use-toast';

/**
 * TabBar fijo. Navegación principal vía home/panel; sin drawer lateral.
 * Última pestaña: cuenta (antes “Más” abría el menú).
 */
export function SocioTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  const [jornadaActiva, setJornadaActiva] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  // Verificar jornada activa
  useEffect(() => {
    const verificarJornada = async () => {
      if (!currentUser?.id || !currentUser?.orgId) {
        setJornadaActiva(false);
        return;
      }

      try {
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) {
          setJornadaActiva(false);
          return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('id')
          .eq('socio_id', socioData.id)
          .eq('fecha', hoy)
          .is('hora_fin', null)
          .maybeSingle();

        setJornadaActiva(!!jornadaData);
      } catch {
        setJornadaActiva(false);
      }
    };

    void verificarJornada();
    const interval = setInterval(verificarJornada, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  const handleIniciarJornada = async () => {
    if (!currentUser?.id || iniciando) return;

    setIniciando(true);

    try {
      const { data: socioData } = await (supabase as any)
        .from('socios')
        .select('id')
        .eq('org_id', currentUser.orgId)
        .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
        .maybeSingle();

      if (!socioData?.id) {
        throw new Error('Socio no encontrado');
      }

      const hoy = new Date().toISOString().split('T')[0];
      const ahora = new Date().toISOString();

      const { error: jornadaError } = await (supabase as any)
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

      setJornadaActiva(true);
      router.push('/socio/ahora');
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo iniciar la jornada',
        variant: 'destructive',
      });
    } finally {
      setIniciando(false);
    }
  };

  const handleInicioClick = () => {
    if (jornadaActiva) {
      router.push('/socio/ahora');
    } else {
      void handleIniciarJornada();
    }
  };

  const isHomeActive = () => {
    return (
      pathname === '/socio' ||
      pathname === '/socio/' ||
      pathname === '/socio/panel' ||
      pathname?.startsWith('/socio/panel/')
    );
  };

  const isBilleteraActive =
    pathname === '/socio/billetera' || pathname?.startsWith('/socio/billetera/');
  const isOportunidadesActive =
    pathname === '/socio/oportunidades' || pathname?.startsWith('/socio/oportunidades/');
  const isCuentaActive = pathname === '/socio/cuenta' || pathname?.startsWith('/socio/cuenta/');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/50 bg-white/90 shadow-stitch-nav backdrop-blur-md md:hidden">
      <div className="flex w-full items-end justify-around px-2 pb-5 pt-1.5">
        <button
          type="button"
          onClick={() => router.push('/socio/panel')}
          className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 ${
            isHomeActive() ? 'text-stitch-primary' : 'text-slate-400'
          }`}
          aria-label="Inicio"
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={2} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Resumen</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/billetera')}
          className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 ${
            isBilleteraActive ? 'text-stitch-primary' : 'text-slate-400'
          }`}
          aria-label="Billetera"
        >
          <Wallet className="h-5 w-5" strokeWidth={2} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Billetera</span>
        </button>

        <button
          type="button"
          onClick={handleInicioClick}
          disabled={iniciando}
          className={`-mt-8 flex h-[72px] w-[72px] flex-col items-center justify-center gap-0.5 rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70`}
          aria-label={jornadaActiva ? 'Continuar jornada' : 'Iniciar jornada'}
        >
          {iniciando ? (
            <Clock className="h-6 w-6 animate-spin" />
          ) : jornadaActiva ? (
            <Play className="h-7 w-7" fill="currentColor" />
          ) : (
            <PlusCircle className="h-7 w-7" strokeWidth={1.5} />
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider">Inicio</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/oportunidades')}
          className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 ${
            isOportunidadesActive ? 'text-stitch-primary' : 'text-slate-400'
          }`}
          aria-label="Oportunidades"
        >
          <div className="relative">
            <TrendingUp className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="max-w-full truncate text-center text-[9px] font-medium uppercase tracking-wider">
            Oportunid.
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/cuenta' as Route)}
          className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 ${
            isCuentaActive ? 'text-stitch-primary' : 'text-slate-400'
          } transition-colors`}
          aria-label="Cuenta y ajustes"
        >
          <User className="h-5 w-5" strokeWidth={2} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Cuenta</span>
        </button>
      </div>
    </div>
  );
}
