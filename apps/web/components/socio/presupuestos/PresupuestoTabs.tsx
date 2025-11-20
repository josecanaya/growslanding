'use client';

import { cn } from '@/lib/utils';

type TabType = 'PENDIENTE' | 'ENVIADO' | 'APROBADO';

interface PresupuestoTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: {
    pendientes: number;
    enviados: number;
    aprobados: number;
  };
}

export function PresupuestoTabs({
  activeTab,
  onTabChange,
  counts,
}: PresupuestoTabsProps) {
  const tabs: Array<{ id: TabType; label: string; count: number }> = [
    { id: 'PENDIENTE', label: 'Pendientes', count: counts.pendientes },
    { id: 'ENVIADO', label: 'Enviados', count: counts.enviados },
    { id: 'APROBADO', label: 'Aprobados', count: counts.aprobados },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-500'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
