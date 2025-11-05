'use client';

import { Building, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

type EtapaProgreso = {
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  nombre: string;
  porcentaje: number;
};

type PlantaBlockProps = {
  nombre: string;
  porcentajeTotal: number;
  etapas: EtapaProgreso[];
  elementosCompletados?: number;
  elementosEnProgreso?: number;
  elementosPendientes?: number;
  totalElementos?: number;
  onVerDetalle?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export default function PlantaBlock({ 
  nombre, 
  porcentajeTotal, 
  etapas, 
  elementosCompletados = 0,
  elementosEnProgreso = 0,
  elementosPendientes = 0,
  totalElementos = 0,
  onVerDetalle,
  isFirst = false,
  isLast = false
}: PlantaBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determinar color según progreso
  const getStatusColor = (progress: number) => {
    if (progress > 80) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        bar: '#10b981',
        text: 'text-green-800'
      };
    } else if (progress > 40) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        bar: '#3b82f6',
        text: 'text-blue-800'
      };
    } else if (progress > 10) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        bar: '#f59e0b',
        text: 'text-yellow-800'
      };
    } else {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        bar: '#6b7280',
        text: 'text-gray-800'
      };
    }
  };

  const statusColor = getStatusColor(porcentajeTotal);

  const etapaColors: Record<string, string> = {
    'estructura': '#3b82f6',
    'obra_gris': '#6b7280',
    'terminaciones': '#10b981'
  };

  return (
    <div 
      className={`relative w-full transition-all duration-300 ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Conector vertical superior (si no es la primera) */}
      {!isFirst && (
        <div className="w-full flex justify-center mb-0">
          <div className="w-1 h-4 bg-gray-300"></div>
        </div>
      )}

      {/* Bloque de planta */}
      <div
        className={`
          relative w-full max-w-3xl mx-auto rounded-lg border-2 shadow-sm transition-all duration-300
          ${statusColor.bg} ${statusColor.border}
          ${onVerDetalle ? 'cursor-pointer hover:shadow-lg' : ''}
          ${isHovered && onVerDetalle ? 'ring-2 ring-blue-300 ring-offset-2' : ''}
        `}
        onClick={onVerDetalle}
      >
        {/* Indicador lateral de "piso" */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="flex flex-col items-center">
            <Building className={`h-5 w-5 ${statusColor.text} mb-1`} />
            {!isLast && (
              <div className="w-0.5 h-full min-h-16 bg-gray-300"></div>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* Header con nombre y progreso */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusColor.bg} border ${statusColor.border}`}>
                <Building className={`h-5 w-5 ${statusColor.text}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-lg ${statusColor.text}`}>{nombre}</h3>
                {totalElementos > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalElementos} {totalElementos === 1 ? 'elemento' : 'elementos'} configurados
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-2xl font-bold ${statusColor.text}`}>
                  {Math.round(porcentajeTotal)}%
                </span>
                <p className="text-xs text-gray-500">Progreso total</p>
              </div>
              {onVerDetalle && (
                <ChevronRight className={`h-5 w-5 ${statusColor.text} transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              )}
            </div>
          </div>

          {/* Barra de progreso principal */}
          <div className="mb-4">
            <div className="w-full h-3 rounded-full bg-white/50 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, Math.max(0, porcentajeTotal))}%`,
                  backgroundColor: statusColor.bar
                }}
              ></div>
            </div>
          </div>

          {/* Progreso por etapas */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {etapas.map((etapa) => (
              <div key={etapa.etapa} className="bg-white/50 rounded-lg p-2 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{etapa.nombre}</span>
                  <span className="text-xs font-bold" style={{ color: etapaColors[etapa.etapa] }}>
                    {Math.round(etapa.porcentaje)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, etapa.porcentaje))}%`,
                      backgroundColor: etapaColors[etapa.etapa]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tooltip con resumen de elementos (solo en hover) */}
          {isHovered && totalElementos > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/50 bg-white/30 rounded-lg p-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-4 text-xs">
                {elementosCompletados > 0 && (
                  <div className="flex items-center gap-1 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    <span>{elementosCompletados} completados</span>
                  </div>
                )}
                {elementosEnProgreso > 0 && (
                  <div className="flex items-center gap-1 text-blue-700">
                    <Clock className="h-3 w-3" />
                    <span>{elementosEnProgreso} en progreso</span>
                  </div>
                )}
                {elementosPendientes > 0 && (
                  <div className="flex items-center gap-1 text-gray-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>{elementosPendientes} pendientes</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conector vertical inferior (si no es la última) */}
      {!isLast && (
        <div className="w-full flex justify-center mt-0">
          <div className="w-1 h-4 bg-gray-300"></div>
        </div>
      )}
    </div>
  );
}

