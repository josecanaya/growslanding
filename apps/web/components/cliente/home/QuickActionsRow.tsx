'use client';

import { Plus, BarChart3, ClipboardList, DollarSign, Users, Bell, Calendar, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsRowProps {
  obraId?: string | null;
}

export function QuickActionsRow({ obraId }: QuickActionsRowProps) {
  const router = useRouter();

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'obra-nueva':
        router.push('/cliente/obras/nueva');
        break;
      case 'resumen':
        if (obraId) {
          router.push(`/cliente/obras?obraId=${obraId}`);
        } else {
          router.push('/cliente/obras');
        }
        break;
      case 'tareas':
        if (obraId) {
          router.push(`/cliente/dashboard?section=tareas&obraId=${obraId}`);
        } else {
          router.push('/cliente/dashboard?section=tareas');
        }
        break;
      case 'presupuesto':
        router.push('/cliente/dashboard?section=billetera');
        break;
      case 'socios':
        router.push('/cliente/dashboard?section=cuadrillas');
        break;
      case 'notificaciones':
        router.push('/cliente/dashboard?section=notificaciones');
        break;
      case 'calendario':
        router.push('/cliente/dashboard?section=calendario');
        break;
      case 'actividad':
        // Por ahora vacío, se implementará después
        break;
    }
  };

  const actions = [
    {
      icon: Plus,
      label: 'Obra nueva',
      actionType: 'obra-nueva',
      isPrimary: true,
    },
    {
      icon: BarChart3,
      label: 'Resumen',
      actionType: 'resumen',
      isPrimary: false,
    },
    {
      icon: ClipboardList,
      label: 'Tareas',
      actionType: 'tareas',
      isPrimary: false,
    },
    {
      icon: DollarSign,
      label: 'Presupuesto',
      actionType: 'presupuesto',
      isPrimary: false,
    },
    {
      icon: Users,
      label: 'Socios',
      actionType: 'socios',
      isPrimary: false,
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      actionType: 'notificaciones',
      isPrimary: false,
    },
    {
      icon: Calendar,
      label: 'Calendario',
      actionType: 'calendario',
      isPrimary: false,
    },
    {
      icon: TrendingUp,
      label: 'Actividad',
      actionType: 'actividad',
      isPrimary: false,
    },
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              handleAction(action.actionType);
            }}
            className="flex flex-col items-center gap-2 transition-all active:scale-[0.95]"
          >
            {/* Botón circular */}
            <div
              className={`
                w-16 h-16 md:w-20 md:h-20 rounded-full
                flex items-center justify-center
                border-2
                shadow-md
                transition-all hover:shadow-lg active:scale-95
                ${
                  action.isPrimary
                    ? 'bg-blue-600 border-blue-600 shadow-lg'
                    : 'border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-400'
                }
              `}
            >
              <Icon
                className={`
                  h-7 w-7 md:h-8 md:w-8
                  transition-colors
                  ${action.isPrimary ? 'text-white' : 'text-gray-700 hover:text-blue-600'}
                `}
                strokeWidth={2.5}
              />
            </div>
            {/* Label */}
            <span
              className={`text-xs md:text-sm text-center leading-tight max-w-[80px] font-semibold whitespace-nowrap ${
                action.isPrimary ? 'text-blue-600' : 'text-gray-800'
              }`}
            >
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

