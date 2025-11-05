'use client';

import { Building2 } from 'lucide-react';
import PlantaBlock from './PlantaBlock';

type EtapaProgreso = {
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  nombre: string;
  porcentaje: number;
};

type PlantaData = {
  id: string;
  nombre: string;
  porcentajeTotal: number;
  etapas: EtapaProgreso[];
  elementosCompletados?: number;
  elementosEnProgreso?: number;
  elementosPendientes?: number;
  totalElementos?: number;
};

type BuildingViewProps = {
  plantas: PlantaData[];
  onVerDetallePlanta?: (plantaId: string) => void;
  className?: string;
};

export default function BuildingView({ plantas, onVerDetallePlanta, className = '' }: BuildingViewProps) {
  // Ordenar plantas: Planta Baja primero, luego de menor a mayor
  const plantasOrdenadas = [...plantas].sort((a, b) => {
    if (a.nombre.toLowerCase().includes('baja') || a.nombre.toLowerCase().includes('pb')) return -1;
    if (b.nombre.toLowerCase().includes('baja') || b.nombre.toLowerCase().includes('pb')) return 1;
    
    // Extraer números si existen
    const numA = parseInt(a.nombre.match(/\d+/)?.[0] || '999');
    const numB = parseInt(b.nombre.match(/\d+/)?.[0] || '999');
    
    return numA - numB;
  });

  // Calcular estadísticas globales
  const totalPlantas = plantasOrdenadas.length;
  const promedioProgreso = plantasOrdenadas.length > 0
    ? plantasOrdenadas.reduce((sum, p) => sum + p.porcentajeTotal, 0) / plantasOrdenadas.length
    : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Header de la sección */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold" style={{ color: '#003C6E' }}>
                Visualización del Proyecto
              </h3>
              <p className="text-sm text-gray-600">
                {totalPlantas} {totalPlantas === 1 ? 'planta' : 'plantas'} • Progreso promedio: {Math.round(promedioProgreso)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor del edificio */}
      <div className="relative flex flex-col items-center gap-2 py-6">
        {/* Línea vertical central (guía visual) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -z-10 hidden md:block"></div>

        {/* Plantas apiladas */}
        <div className="w-full max-w-4xl space-y-2">
          {plantasOrdenadas.map((planta, index) => (
            <PlantaBlock
              key={planta.id}
              nombre={planta.nombre}
              porcentajeTotal={planta.porcentajeTotal}
              etapas={planta.etapas}
              elementosCompletados={planta.elementosCompletados}
              elementosEnProgreso={planta.elementosEnProgreso}
              elementosPendientes={planta.elementosPendientes}
              totalElementos={planta.totalElementos}
              onVerDetalle={onVerDetallePlanta ? () => onVerDetallePlanta(planta.id) : undefined}
              isFirst={index === 0}
              isLast={index === plantasOrdenadas.length - 1}
            />
          ))}
        </div>

        {/* Leyenda de colores */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600">Completado (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600">En progreso (40-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span className="text-gray-600">Inicial (10-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-400"></div>
              <span className="text-gray-600">Sin iniciar (&lt;10%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

