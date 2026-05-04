'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Building, FileText, Wallet, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Route } from 'next';
import {
  USE_MOCK_DATA,
  MOCK_SOLICITUDES,
  MOCK_OBRAS,
} from '@/lib/mocks/socioMockData';
import { fetchSocioContextClient } from '@/lib/socios/fetchSocioContextClient';

interface AccesoRapido {
  id: string;
  label: string;
  icon: React.ElementType;
  route: Route;
  iconColor: string;
  bgColor: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'error';
  } | null;
  priority: 'high' | 'medium';
}

interface AccesosRapidosGridProps {
  hideTitle?: boolean;
  showOnly?: 'high' | 'medium' | 'all';
  /** Tres íconos circulares como `panel_responsive_home` (Presupuestos · Obras · Historial) */
  stitchLayout?: boolean;
}

function buildStitchMockAccesos(): AccesoRapido[] {
  const obrasCount = MOCK_OBRAS.length;
  const presupuestosCount = 2;
  return [
    {
      id: 'presupuestos',
      label: 'Presupuestos',
      icon: FileText,
      route: '/socio/presupuestos' as Route,
      iconColor: 'text-stitch-primary',
      bgColor: 'bg-stitch-surface-container-lowest shadow-sm',
      badge: presupuestosCount > 0 ? { text: `${presupuestosCount}`, variant: 'warning' } : null,
      priority: 'high',
    },
    {
      id: 'obras',
      label: 'Obras',
      icon: Building,
      route: '/socio/obras' as Route,
      iconColor: 'text-stitch-primary',
      bgColor: 'bg-stitch-surface-container-lowest shadow-sm',
      badge: obrasCount > 0 ? { text: `${obrasCount}`, variant: 'success' } : null,
      priority: 'high',
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      route: '/socio/jornadas' as Route,
      iconColor: 'text-stitch-primary',
      bgColor: 'bg-stitch-surface-container-lowest shadow-sm',
      badge: null,
      priority: 'high',
    },
  ];
}

function buildMockAccesosRapidos(): AccesoRapido[] {
  const solicitudesCount = MOCK_SOLICITUDES.length;
  const obrasCount = MOCK_OBRAS.length;
  const presupuestosCount = 2;
  return [
    {
      id: 'oportunidades',
      label: 'Oportunidades',
      icon: Briefcase,
      route: '/socio/oportunidades' as Route,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: solicitudesCount > 0 ? { text: `${solicitudesCount}`, variant: 'info' } : null,
      priority: 'high',
    },
    {
      id: 'presupuestos',
      label: 'Presupuestos',
      icon: FileText,
      route: '/socio/presupuestos' as Route,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: presupuestosCount > 0 ? { text: `${presupuestosCount}`, variant: 'warning' } : null,
      priority: 'high',
    },
    {
      id: 'obras',
      label: 'Mis obras',
      icon: Building,
      route: '/socio/obras' as Route,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: obrasCount > 0 ? { text: `${obrasCount}`, variant: 'success' } : null,
      priority: 'high',
    },
    {
      id: 'billetera',
      label: 'Billetera',
      icon: Wallet,
      route: '/socio/billetera' as Route,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: null,
      priority: 'high',
    },
  ];
}

const STITCH_FALLBACK_PRES: AccesoRapido = {
  id: 'presupuestos',
  label: 'Presupuestos',
  icon: FileText,
  route: '/socio/presupuestos' as Route,
  iconColor: 'text-stitch-primary',
  bgColor: 'bg-stitch-surface-container-lowest shadow-sm',
  badge: null,
  priority: 'high',
};

const STITCH_FALLBACK_OBRAS: AccesoRapido = {
  id: 'obras',
  label: 'Obras',
  icon: Building,
  route: '/socio/obras' as Route,
  iconColor: 'text-stitch-primary',
  bgColor: 'bg-stitch-surface-container-lowest shadow-sm',
  badge: null,
  priority: 'high',
};

const STITCH_HISTORIAL: AccesoRapido = {
  id: 'historial',
  label: 'Historial',
  icon: History,
  route: '/socio/jornadas' as Route,
  iconColor: 'text-stitch-primary',
  bgColor: 'bg-stitch-surface-container-lowest shadow-sm',
  badge: null,
  priority: 'high',
};

function toStitchAccesos(reales: AccesoRapido[]): AccesoRapido[] {
  const p = reales.find((a) => a.id === 'presupuestos') ?? STITCH_FALLBACK_PRES;
  const o = reales.find((a) => a.id === 'obras') ?? STITCH_FALLBACK_OBRAS;
  return [
    { ...p, iconColor: 'text-stitch-primary', bgColor: 'bg-stitch-surface-container-lowest shadow-sm' },
    { ...o, iconColor: 'text-stitch-primary', bgColor: 'bg-stitch-surface-container-lowest shadow-sm' },
    STITCH_HISTORIAL,
  ];
}

export function AccesosRapidosGrid({
  hideTitle = false,
  showOnly = 'all',
  stitchLayout = false,
}: AccesosRapidosGridProps = {}) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [accesos, setAccesos] = useState<AccesoRapido[]>(() => {
    if (!USE_MOCK_DATA) {
      return [];
    }
    return stitchLayout ? buildStitchMockAccesos() : buildMockAccesosRapidos();
  });
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [sinVinculoSocio, setSinVinculoSocio] = useState(false);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      return;
    }

    let cancelled = false;

    const cargar = async () => {
      if (!currentUser?.id) {
        if (!cancelled) {
          setAccesos([]);
          setSinVinculoSocio(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const socioRow = await fetchSocioContextClient();

        if (!socioRow?.id) {
          if (!cancelled) {
            setSinVinculoSocio(true);
            setAccesos([]);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) setSinVinculoSocio(false);

        const orgIdEfectivo =
          currentUser.orgId ?? socioRow.effective_org_id ?? socioRow.org_id ?? null;

        const hoy = new Date().toISOString().split('T')[0];

        let solicitudesQuery = (supabase as any)
          .from('tareas')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['pendiente', 'en_progreso'])
          .or(`responsable_socio_id.eq.${socioRow.id},cuadrilla_id.eq.${socioRow.id}`)
          .gte('created_at', `${hoy}T00:00:00`);
        if (orgIdEfectivo) {
          solicitudesQuery = solicitudesQuery.eq('org_id', orgIdEfectivo);
        }
        const { count: solicitudesNuevasHoy = 0 } = await solicitudesQuery;

        const { count: obrasActivas = 0 } = await (supabase as any)
          .from('tareas_presupuestos')
          .select('obra_id', { count: 'exact', head: true })
          .eq('socio_id', socioRow.id)
          .eq('estado', 'APROBADO');

        const { count: presupuestosPendientes = 0 } = await (supabase as any)
          .from('tareas_presupuestos')
          .select('*', { count: 'exact', head: true })
          .eq('socio_id', socioRow.id)
          .in('estado', ['PENDIENTE', 'ENVIADO']);

        const accesosReales: AccesoRapido[] = [
          {
            id: 'oportunidades',
            label: 'Oportunidades',
            icon: Briefcase,
            route: '/socio/oportunidades' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge:
              (solicitudesNuevasHoy ?? 0) > 0
                ? { text: String(solicitudesNuevasHoy), variant: 'info' }
                : null,
            priority: 'high',
          },
          {
            id: 'presupuestos',
            label: 'Presupuestos',
            icon: FileText,
            route: '/socio/presupuestos' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge:
              (presupuestosPendientes ?? 0) > 0
                ? { text: String(presupuestosPendientes), variant: 'warning' }
                : null,
            priority: 'high',
          },
          {
            id: 'obras',
            label: 'Mis obras',
            icon: Building,
            route: '/socio/obras' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge:
              (obrasActivas ?? 0) > 0 ? { text: String(obrasActivas), variant: 'success' } : null,
            priority: 'high',
          },
          {
            id: 'billetera',
            label: 'Billetera',
            icon: Wallet,
            route: '/socio/billetera' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge: null,
            priority: 'high',
          },
        ];

        if (!cancelled) {
          setAccesos(stitchLayout ? toStitchAccesos(accesosReales) : accesosReales);
        }
      } catch {
        if (!cancelled) {
          setSinVinculoSocio(false);
          setAccesos(stitchLayout ? toStitchAccesos([]) : []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void cargar();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase, stitchLayout]);

  const handleAccesoClick = (acceso: AccesoRapido) => {
    router.push(acceso.route);
  };

  if (loading) {
    return (
      <div className={hideTitle ? '' : 'space-y-4'}>
        {!hideTitle && (
          <h2
            className={
              stitchLayout
                ? 'text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-outline'
                : 'text-lg font-semibold text-gray-900'
            }
          >
            {stitchLayout ? 'Acceso rápido' : 'Accesos rápidos'}
          </h2>
        )}
        <div
          className={`grid gap-x-2 gap-y-6 pb-2 ${stitchLayout ? 'grid-cols-3' : 'grid-cols-4'}`}
        >
          {(stitchLayout ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8]).map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="h-14 w-14 rounded-full bg-stitch-surface-container-high" />
              <div className="h-3 w-12 rounded bg-stitch-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sinVinculoSocio) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
        <p className="font-medium">Perfil de socio</p>
        <p className="mt-1 text-amber-800">
          No encontramos un registro de socio vinculado a tu cuenta. Si ya tenés perfil, comprobá que
          el email o usuario coincida con el alta del administrador.
        </p>
      </div>
    );
  }

  if (accesos.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-sm text-gray-600">
        Iniciá sesión con un usuario que tenga organización asignada para ver accesos rápidos.
      </div>
    );
  }

  const accesosAlta = accesos.filter((a) => a.priority === 'high');
  const accesosMedia = accesos.filter((a) => a.priority === 'medium');
  const showHigh = showOnly === 'all' || showOnly === 'high';
  const showMedium = showOnly === 'all' || showOnly === 'medium';

  const renderAcceso = (acceso: AccesoRapido) => {
    const Icon = acceso.icon;

    return (
      <button
        key={acceso.id}
        type="button"
        onClick={() => handleAccesoClick(acceso)}
        className="group relative flex flex-col items-center gap-2"
      >
        {acceso.badge && (
          <div className="absolute -right-1 -top-1 z-10">
            <div
              className={`
              ${acceso.badge.variant === 'info' ? 'bg-blue-500' : ''}
              ${acceso.badge.variant === 'success' ? 'bg-green-500' : ''}
              ${acceso.badge.variant === 'warning' ? 'bg-amber-500' : ''}
              ${acceso.badge.variant === 'error' ? 'bg-red-500' : ''}
              flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5
              text-[10px] font-bold text-white shadow-sm
            `}
            >
              {acceso.badge.text}
            </div>
          </div>
        )}

        <div
          className={`
          flex h-14 w-14 items-center justify-center rounded-full
          ${acceso.bgColor}
          shadow-sm transition-all duration-200
          group-hover:shadow-md group-active:scale-95
        `}
        >
          <Icon className={`h-6 w-6 ${acceso.iconColor}`} strokeWidth={2} />
        </div>

        <p
          className={`
          text-center text-[10px] font-bold leading-tight
          ${stitchLayout ? 'text-stitch-on-surface' : ''}
          ${!stitchLayout && acceso.priority === 'high' ? 'text-gray-700' : ''}
          ${!stitchLayout && acceso.priority !== 'high' ? 'text-gray-600' : ''}
        `}
        >
          {acceso.label}
        </p>
      </button>
    );
  };

  return (
    <div className={hideTitle ? 'w-full' : 'w-full space-y-4'}>
      {!hideTitle && (
        <h2
          className={
            stitchLayout
              ? 'text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-outline'
              : 'text-lg font-semibold text-gray-900'
          }
        >
          {stitchLayout ? 'Acceso rápido' : 'Accesos rápidos'}
        </h2>
      )}

      <div className="space-y-4">
        {showHigh && (
          <div
            className={stitchLayout ? 'grid grid-cols-3 gap-x-2 gap-y-6' : 'grid grid-cols-4 gap-3'}
          >
            {accesosAlta.map(renderAcceso)}
          </div>
        )}

        {showMedium && accesosMedia.length > 0 && (
          <div className="grid grid-cols-4 gap-3">{accesosMedia.map(renderAcceso)}</div>
        )}
      </div>
    </div>
  );
}
