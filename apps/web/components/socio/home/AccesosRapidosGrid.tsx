'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Building, Camera, Play } from 'lucide-react';
import { Badge } from '@/components/ui/grows/Badge';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Route } from 'next';
import {
  USE_MOCK_DATA,
  MOCK_SOLICITUDES,
  MOCK_OBRAS,
  MOCK_TRABAJO_ACTIVO,
  MOCK_TRABAJO_SIN_ACTIVO,
} from '@/lib/mocks/socioMockData';

// Escenario: false = sin trabajo activo, true = con trabajo activo
const MOCK_TRABAJO_ACTIVO_SCENARIO = false; // Cambiar a true para simular trabajo activo

interface AccesoRapido {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  route: Route;
  color: string;
  bgColor: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'error';
  } | null;
  disabled?: boolean;
  disabledReason?: string;
}

interface AccesosRapidosGridProps {
  hideTitle?: boolean;
  compact?: boolean;
}

// Función helper para obtener estilos semánticos por tipo de acceso
const getAccesoStyles = (accesoId: string, disabled: boolean, hasContent: boolean) => {
  if (disabled) {
    return {
      bg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      textColor: 'text-gray-500',
      border: 'border-gray-200',
    };
  }

  switch (accesoId) {
    case 'oportunidades':
      return {
        bg: hasContent ? 'bg-blue-50' : 'bg-blue-50/50',
        iconColor: hasContent ? 'text-blue-600' : 'text-blue-400',
        textColor: hasContent ? 'text-blue-900' : 'text-blue-700',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100 hover:border-blue-300',
      };
    case 'obras':
      return {
        bg: hasContent ? 'bg-green-50' : 'bg-green-50/50',
        iconColor: hasContent ? 'text-green-600' : 'text-green-400',
        textColor: hasContent ? 'text-green-900' : 'text-green-700',
        border: 'border-green-200',
        hover: 'hover:bg-green-100 hover:border-green-300',
      };
    case 'evidencias':
      return {
        bg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        textColor: 'text-amber-900',
        border: 'border-amber-200',
        hover: 'hover:bg-amber-100 hover:border-amber-300',
      };
    case 'ahora':
      return {
        bg: 'bg-[#276EF1]/10',
        iconColor: 'text-[#276EF1]',
        textColor: 'text-[#276EF1]',
        border: 'border-[#276EF1]/20',
        hover: 'hover:bg-[#276EF1]/15 hover:border-[#276EF1]/30',
      };
    default:
      return {
        bg: 'bg-gray-50',
        iconColor: 'text-gray-500',
        textColor: 'text-gray-700',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-100',
      };
  }
};

export function AccesosRapidosGrid({ hideTitle = false, compact = false }: AccesosRapidosGridProps = {}) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  // Estado separado para accesos rápidos (no compartido)
  const [accesos, setAccesos] = useState<AccesoRapido[]>([]);
  const [loading, setLoading] = useState(true);
  const [tieneJornadaActiva, setTieneJornadaActiva] = useState(false);
  const [solicitudesNuevasHoy, setSolicitudesNuevasHoy] = useState(0);
  const [obrasActivas, setObrasActivas] = useState(0);
  const [evidenciasPendientes, setEvidenciasPendientes] = useState(0);

  useEffect(() => {
    const cargarAccesos = async () => {
      // Verificar jornada activa y datos contextuales
      if (currentUser?.id && currentUser?.orgId) {
        try {
          const { data: socioData } = await (supabase as any)
            .from('socios')
            .select('id')
            .eq('org_id', currentUser.orgId)
            .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
            .maybeSingle();

          if (socioData?.id) {
            // Verificar jornada activa
            const hoy = new Date().toISOString().split('T')[0];
            const { data: jornadaData } = await (supabase as any)
              .from('jornadas_socio')
              .select('id')
              .eq('socio_id', socioData.id)
              .eq('fecha', hoy)
              .is('hora_fin', null)
              .maybeSingle();

            setTieneJornadaActiva(!!jornadaData);

            // Contar solicitudes nuevas (del día de hoy)
            const { count: solicitudesCount } = await (supabase as any)
              .from('tareas')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', currentUser.orgId)
              .or('estado.eq.ASIGNADA,estado.eq.PENDIENTE')
              .gte('created_at', `${hoy}T00:00:00`)
              .limit(20);

            setSolicitudesNuevasHoy(solicitudesCount || 0);

            // Contar obras activas
            const { count: obrasCount } = await (supabase as any)
              .from('tareas_presupuestos')
              .select('obra_id', { count: 'exact', head: true })
              .eq('socio_id', socioData.id)
              .eq('estado', 'APROBADO');

            setObrasActivas(obrasCount || 0);

            // Contar evidencias pendientes (subtareas en progreso sin evidencia)
            const { count: evidenciasCount } = await (supabase as any)
              .from('tareas_subtareas')
              .select('*', { count: 'exact', head: true })
              .eq('socio_id', socioData.id)
              .eq('estado', 'en_progreso')
              .or('evidencia_url.is.null,evidencia_url.eq.');

            setEvidenciasPendientes(evidenciasCount || 0);
          }
        } catch (error) {
          // Error silencioso
        }
      }

      if (USE_MOCK_DATA) {
        // Usar mocks
        const solicitudesCount = MOCK_SOLICITUDES.length;
        const obrasCount = MOCK_OBRAS.length;
        const mockTrabajo = MOCK_TRABAJO_ACTIVO_SCENARIO
          ? MOCK_TRABAJO_ACTIVO
          : MOCK_TRABAJO_SIN_ACTIVO;
        const tieneTrabajoActivo = mockTrabajo.estado === 'EN_PROGRESO';

        const accesosMock: AccesoRapido[] = [
          {
            id: 'oportunidades',
            label: 'Oportunidades',
            subtitle: solicitudesCount > 0 ? `${solicitudesCount} nuevas` : 'Sin nuevas',
            icon: Briefcase,
            route: '/socio/oportunidades' as Route,
            color: solicitudesCount > 0 ? 'text-blue-600' : 'text-gray-400',
            bgColor: solicitudesCount > 0 ? 'bg-blue-100' : 'bg-gray-100',
            badge: solicitudesCount > 0
              ? { text: `${solicitudesCount}`, variant: 'info' }
              : null,
          },
          {
            id: 'obras',
            label: 'Mis obras',
            subtitle: obrasCount > 0 ? `${obrasCount} activa${obrasCount !== 1 ? 's' : ''}` : 'Sin obras',
            icon: Building,
            route: '/socio/obras' as Route,
            color: obrasCount > 0 ? 'text-green-600' : 'text-gray-400',
            bgColor: obrasCount > 0 ? 'bg-green-100' : 'bg-gray-100',
            badge: obrasCount > 0 ? { text: `${obrasCount}`, variant: 'success' } : null,
          },
          {
            id: 'evidencias',
            label: 'Evidencias',
            subtitle: 'Subir',
            icon: Camera,
            route: '/socio/evidencias' as Route,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            badge: null,
          },
        ];

        // Agregar AHORA solo si hay jornada activa o trabajo activo
        if (tieneJornadaActiva || tieneTrabajoActivo) {
          accesosMock.push({
            id: 'ahora',
            label: 'AHORA',
            subtitle: 'trabajo',
            icon: Play,
            route: '/socio/ahora' as Route,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            badge: { text: 'Activo', variant: 'success' },
          });
        }

        // Asegurar exactamente 4 accesos
        while (accesosMock.length < 4) {
          accesosMock.push({
            id: `placeholder-${accesosMock.length}`,
            label: 'AHORA',
            subtitle: 'Iniciá jornada',
            icon: Play,
            route: '/socio/ahora' as Route,
            color: 'text-gray-400',
            bgColor: 'bg-gray-100',
            disabled: true,
            disabledReason: 'Iniciá la jornada para acceder',
          });
        }

        setAccesos(accesosMock.slice(0, 4));
        setLoading(false);
        return;
      }

      // Usar datos reales
      if (!currentUser?.id || !currentUser?.orgId) {
        setAccesos([]);
        setLoading(false);
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
          setAccesos([]);
          setLoading(false);
          return;
        }

        // Verificar si hay trabajo activo
        const { data: trabajoActivo } = await (supabase as any)
          .from('tareas')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .eq('responsable_socio_id', socioData.id)
          .eq('estado', 'en_progreso')
          .limit(1);

        const tieneTrabajoActivo = trabajoActivo && trabajoActivo.length > 0;

        const accesosReales: AccesoRapido[] = [
          {
            id: 'oportunidades',
            label: 'Oportunidades',
            subtitle: solicitudesNuevasHoy > 0 ? `${solicitudesNuevasHoy} nuevas` : 'Sin nuevas',
            icon: Briefcase,
            route: '/socio/oportunidades' as Route,
            color: solicitudesNuevasHoy > 0 ? 'text-blue-600' : 'text-gray-400',
            bgColor: solicitudesNuevasHoy > 0 ? 'bg-blue-100' : 'bg-gray-100',
            badge: solicitudesNuevasHoy > 0
              ? { text: `${solicitudesNuevasHoy}`, variant: 'info' }
              : null,
          },
          {
            id: 'obras',
            label: 'Mis obras',
            subtitle: obrasActivas > 0 ? `${obrasActivas} activa${obrasActivas !== 1 ? 's' : ''}` : 'Sin obras',
            icon: Building,
            route: '/socio/obras' as Route,
            color: obrasActivas > 0 ? 'text-green-600' : 'text-gray-400',
            bgColor: obrasActivas > 0 ? 'bg-green-100' : 'bg-gray-100',
            badge: obrasActivas > 0 ? { text: `${obrasActivas}`, variant: 'success' } : null,
          },
          {
            id: 'evidencias',
            label: 'Evidencias',
            subtitle: 'Subir',
            icon: Camera,
            route: '/socio/evidencias' as Route,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            badge: evidenciasPendientes > 0 ? { text: `${evidenciasPendientes}`, variant: 'warning' } : null,
          },
        ];

        // Agregar AHORA solo si hay jornada activa o trabajo activo
        if (tieneJornadaActiva || tieneTrabajoActivo) {
          accesosReales.push({
            id: 'ahora',
            label: 'AHORA',
            subtitle: 'trabajo',
            icon: Play,
            route: '/socio/ahora' as Route,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            badge: { text: 'Activo', variant: 'success' },
          });
        } else {
          // Mostrar AHORA deshabilitado como cuarto acceso
          accesosReales.push({
            id: 'ahora',
            label: 'AHORA',
            subtitle: 'Iniciá jornada',
            icon: Play,
            route: '/socio/ahora' as Route,
            color: 'text-gray-400',
            bgColor: 'bg-gray-100',
            disabled: true,
            disabledReason: 'Iniciá la jornada para acceder',
          });
        }

        // Asegurar exactamente 4 accesos
        setAccesos(accesosReales.slice(0, 4));
      } catch (error) {
        setAccesos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAccesos();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase, tieneJornadaActiva, solicitudesNuevasHoy, obrasActivas, evidenciasPendientes]);

  const handleAccesoClick = (acceso: AccesoRapido) => {
    if (acceso.disabled) return;
    router.push(acceso.route);
  };

  if (loading) {
    return (
      <div className={hideTitle ? '' : 'space-y-4'}>
        {!hideTitle && <h2 className="text-lg font-semibold text-gray-900">Accesos rápidos</h2>}
        <div className={`flex gap-3 overflow-x-auto pb-2 ${compact ? '' : '-mx-4 px-4'}`}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${compact ? 'min-w-[80px]' : 'min-w-[100px]'} border border-gray-200 rounded-lg p-3 space-y-2 animate-pulse flex-shrink-0`}>
              <div className="h-10 w-10 rounded-full bg-gray-200 mx-auto" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (accesos.length === 0) {
    return null;
  }

  return (
    <div className={hideTitle ? 'w-full' : 'space-y-3 w-full'}>
      {!hideTitle && <h2 className="text-lg font-semibold text-gray-900">Accesos rápidos</h2>}
      <div className={`flex gap-2.5 overflow-x-auto pb-2 w-full ${compact ? '' : '-mx-4 px-4'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        {accesos.map((acceso) => {
          const Icon = acceso.icon;
          const hasContent = Boolean(acceso.badge !== null || (acceso.subtitle && !acceso.subtitle.includes('Sin')));
          const styles = getAccesoStyles(acceso.id, Boolean(acceso.disabled), hasContent);
          
          return (
            <button
              key={acceso.id}
              onClick={() => handleAccesoClick(acceso)}
              disabled={acceso.disabled}
              className={`
                ${compact ? 'min-w-[85px]' : 'min-w-[110px]'} flex-shrink-0
                relative
                rounded-2xl
                border-2 ${styles.border}
                ${styles.bg}
                ${!acceso.disabled && styles.hover ? styles.hover : ''}
                shadow-sm hover:shadow-md
                transition-all duration-200
                active:scale-[0.96] active:shadow-sm
                ${acceso.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                px-4 py-3
                flex flex-col items-center justify-center
                gap-2
              `}
            >
              {/* Badge integrado */}
              {acceso.badge && (
                <div className="absolute -top-1.5 -right-1.5 z-10">
                  <div className={`
                    ${acceso.badge.variant === 'info' ? 'bg-blue-500' : ''}
                    ${acceso.badge.variant === 'success' ? 'bg-green-500' : ''}
                    ${acceso.badge.variant === 'warning' ? 'bg-amber-500' : ''}
                    ${acceso.badge.variant === 'error' ? 'bg-red-500' : ''}
                    text-white text-[10px] font-bold
                    rounded-full
                    min-w-[18px] h-[18px]
                    flex items-center justify-center
                    px-1.5
                    shadow-md
                  `}>
                    {acceso.badge.text}
                  </div>
                </div>
              )}

              {/* Icono grande y colorido */}
              <div className={`
                ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                rounded-full
                ${styles.bg}
                flex items-center justify-center
                ${!acceso.disabled ? 'shadow-sm' : ''}
              `}>
                <Icon className={`
                  ${compact ? 'h-5 w-5' : 'h-6 w-6'}
                  ${styles.iconColor}
                `} strokeWidth={2.5} />
              </div>

              {/* Texto */}
              <div className="text-center w-full">
                <p className={`
                  ${compact ? 'text-[11px]' : 'text-xs'}
                  font-bold
                  ${styles.textColor}
                  leading-tight
                `}>
                  {acceso.label}
                </p>
                {!compact && (
                  <p className={`
                    text-[10px]
                    ${acceso.disabled ? 'text-gray-400' : styles.textColor + '/70'}
                    leading-tight mt-0.5
                    font-medium
                  `}>
                    {acceso.subtitle}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
