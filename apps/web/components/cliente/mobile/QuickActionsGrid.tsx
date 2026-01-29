'use client';

import { Plus, FileText, DollarSign, Users, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

interface QuickActionsGridProps {
  router: ReturnType<typeof useRouter>;
}

export function QuickActionsGrid({ router }: QuickActionsGridProps) {
  const actions = [
    {
      icon: Plus,
      label: 'Crear obra',
      action: () => router.push('/cliente/obras/nueva' as Route),
      color: 'bg-blue-600',
    },
    {
      icon: FileText,
      label: 'Crear tarea',
      action: () => router.push('/cliente/dashboard?section=tareas' as Route),
      color: 'bg-emerald-600',
    },
    {
      icon: DollarSign,
      label: 'Presupuestos',
      action: () => router.push('/cliente/dashboard?section=billetera' as Route),
      color: 'bg-amber-600',
    },
    {
      icon: Users,
      label: 'Socios & Notifs',
      action: () => router.push('/cliente/dashboard?section=notificaciones' as Route),
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
      <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
        Acciones rápidas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`
                ${action.color} text-white rounded-lg p-4 
                flex flex-col items-center justify-center gap-2
                transition-all hover:opacity-90 active:scale-95
                min-h-[80px]
              `}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-semibold text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}




