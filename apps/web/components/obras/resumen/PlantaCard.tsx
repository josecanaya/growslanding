'use client';

import { Building } from 'lucide-react';

type EtapaProgreso = {
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  nombre: string;
  porcentaje: number;
};

type PlantaCardProps = {
  nombre: string;
  porcentajeTotal: number;
  etapas: EtapaProgreso[];
  onVerDetalle?: () => void;
};

const InlineProgressBar = ({ percent, color = '#003C6E' }: { percent: number; color?: string }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Avance total</span>
        <span>{Math.round(clamped)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default function PlantaCard({ nombre, porcentajeTotal, etapas, onVerDetalle }: PlantaCardProps) {
  const etapaColors: Record<string, string> = {
    'estructura': '#3b82f6',
    'obra_gris': '#6b7280',
    'terminaciones': '#10b981'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-50">
          <Building className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{nombre}</h3>
      </div>

      <div className="mb-4">
        <InlineProgressBar percent={porcentajeTotal} color="#003C6E" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        {etapas.map((etapa) => (
          <div key={etapa.etapa} className="text-center">
            <p className="text-gray-600 font-medium mb-1">{etapa.nombre}</p>
            <p className="text-sm font-bold" style={{ color: etapaColors[etapa.etapa] }}>
              {Math.round(etapa.porcentaje)}%
            </p>
          </div>
        ))}
      </div>

      {onVerDetalle && (
        <button
          onClick={onVerDetalle}
          className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          Ver detalle →
        </button>
      )}
    </div>
  );
}

