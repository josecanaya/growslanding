'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Building, FileText, Wallet } from 'lucide-react';
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
  priority: 'high' | 'medium'; // Para diferenciar filas
}

interface AccesosRapidosGridProps {
  hideTitle?: boolean;
  compact?: boolean;
  showOnly?: 'high' | 'medium' | 'all'; // Para mostrar solo una fila o ambas
}

export function AccesosRapidosGrid({ hideTitle = false, compact = false, showOnly = 'all' }: AccesosRapidosGridProps = {}) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [accesos, setAccesos] = useState<AccesoRapido[]>([]);
  const [loading, setLoading] = useState(true);
  const [solicitudesNuevasHoy, setSolicitudesNuevasHoy] = useState(0);
  const [obrasActivas, setObrasActivas] = useState(0);
  const [presupuestosPendientes, setPresupuestosPendientes] = useState(0);

  useEffect(() => {
    const cargarAccesos = async () => {
      // Verificar datos contextuales
      if (currentUser?.id && currentUser?.orgId) {
        try {
          const { data: socioData } = await (supabase as any)
            .from('socios')
            .select('id')
            .eq('org_id', currentUser.orgId)
            .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
            .maybeSingle();

          if (socioData?.id) {
            const hoy = new Date().toISOString().split('T')[0];

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

            // Contar presupuestos pendientes
            const { count: presupuestosCount } = await (supabase as any)
              .from('tareas_presupuestos')
              .select('*', { count: 'exact', head: true })
              .eq('socio_id', socioData.id)
              .in('estado', ['PENDIENTE', 'ENVIADO']);

            setPresupuestosPendientes(presupuestosCount || 0);
          }
        } catch (error) {
          // Error silencioso
        }
      }

      if (USE_MOCK_DATA) {
        // Usar mocks
        const solicitudesCount = MOCK_SOLICITUDES.length;
        const obrasCount = MOCK_OBRAS.length;
        const presupuestosCount = 2; // Mock

        const accesosMock: AccesoRapido[] = [
          // Fila 1 - Acciones diarias (prioridad alta)
          {
            id: 'oportunidades',
            label: 'Oportunidades',
            icon: Briefcase,
            route: '/socio/oportunidades' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge: solicitudesCount > 0
              ? { text: `${solicitudesCount}`, variant: 'info' }
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

        setAccesos(accesosMock);
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

        const accesosReales: AccesoRapido[] = [
          // Fila 1 - Acciones diarias (prioridad alta)
          {
            id: 'oportunidades',
            label: 'Oportunidades',
            icon: Briefcase,
            route: '/socio/oportunidades' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge: solicitudesNuevasHoy > 0
              ? { text: `${solicitudesNuevasHoy}`, variant: 'info' }
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
            badge: presupuestosPendientes > 0 ? { text: `${presupuestosPendientes}`, variant: 'warning' } : null,
            priority: 'high',
          },
          {
            id: 'obras',
            label: 'Mis obras',
            icon: Building,
            route: '/socio/obras' as Route,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge: obrasActivas > 0 ? { text: `${obrasActivas}`, variant: 'success' } : null,
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

        setAccesos(accesosReales);
      } catch (error) {
        setAccesos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAccesos();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase, solicitudesNuevasHoy, obrasActivas, presupuestosPendientes]);

  const handleAccesoClick = (acceso: AccesoRapido) => {
    router.push(acceso.route);
  };

  if (loading) {
    return (
      <div className={hideTitle ? '' : 'space-y-4'}>
        {!hideTitle && <h2 className="text-lg font-semibold text-gray-900">Accesos rápidos</h2>}
        <div className="grid grid-cols-4 gap-4 pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (accesos.length === 0) {
    return null;
  }

  // Separar accesos por prioridad
  const accesosAlta = accesos.filter(a => a.priority === 'high');
  const accesosMedia = accesos.filter(a => a.priority === 'medium');

  // Renderizar un solo botón de acceso
  const renderAcceso = (acceso: AccesoRapido) => {
    const Icon = acceso.icon;
    
    return (
      <button
        key={acceso.id}
        onClick={() => handleAccesoClick(acceso)}
        className="flex flex-col items-center gap-2 relative group"
      >
        {/* Badge arriba del icono */}
        {acceso.badge && (
          <div className="absolute -top-1 -right-1 z-10">
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
              shadow-sm
            `}>
              {acceso.badge.text}
            </div>
          </div>
        )}

        {/* Icono circular estilo bancario */}
        <div className={`
          w-14 h-14
          rounded-full
          ${acceso.bgColor}
          flex items-center justify-center
          shadow-sm
          group-hover:shadow-md
          transition-all duration-200
          group-active:scale-95
        `}>
          <Icon className={`
            h-6 w-6
            ${acceso.iconColor}
          `} strokeWidth={2} />
        </div>

        {/* Texto corto debajo */}
        <p className={`
          text-[10px]
          font-medium
          ${acceso.priority === 'high' ? 'text-gray-700' : 'text-gray-600'}
          text-center
          leading-tight
        `}>
          {acceso.label}
        </p>
      </button>
    );
  };

  // Determinar qué filas mostrar
  const showHigh = showOnly === 'all' || showOnly === 'high';
  const showMedium = showOnly === 'all' || showOnly === 'medium';

  return (
    <div className={hideTitle ? 'w-full' : 'space-y-4 w-full'}>
      {!hideTitle && <h2 className="text-lg font-semibold text-gray-900">Accesos rápidos</h2>}
      
      {/* Grid 4x2 - Estilo app bancaria */}
      <div className="space-y-4">
        {/* Fila 1 - Acciones diarias (prioridad alta) */}
        {showHigh && (
          <div className="grid grid-cols-4 gap-3">
            {accesosAlta.map(renderAcceso)}
          </div>
        )}

        {/* Fila 2 - Gestión y seguimiento (prioridad media) */}
        {showMedium && (
          <div className="grid grid-cols-4 gap-3">
            {accesosMedia.map(renderAcceso)}
          </div>
        )}
      </div>
    </div>
  );
}
