'use client';

import { ArrowRight } from 'lucide-react';

interface PresupuestoSemanal {
  semana: number;
  proyectado: number;
  ejecutado: number;
}

interface CardPresupuestoEscrowProps {
  presupuesto: { presupuestado: number; ejecutado: number };
  presupuestoSemanal: PresupuestoSemanal[];
  periodRange: number;
  formatCurrency: (v: number) => string;
  onVerDetalle: () => void;
}

export function CardPresupuestoEscrow({
  presupuesto,
  presupuestoSemanal,
  periodRange,
  formatCurrency,
  onVerDetalle,
}: CardPresupuestoEscrowProps) {
  // Filtrar por período (últimas semanas)
  const totalSemanas = presupuestoSemanal.length;
  const inicioSlice = periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
  const datosFiltrados = presupuestoSemanal.slice(inicioSlice);

  // Calcular KPIs
  const totalProyectado = datosFiltrados.reduce((sum, d) => sum + d.proyectado, 0);
  const totalEjecutado = datosFiltrados.reduce((sum, d) => sum + d.ejecutado, 0);
  const porcentajeEjecutado = totalProyectado > 0 ? (totalEjecutado / totalProyectado) * 100 : 0;
  const semanasSinEjecucion = datosFiltrados.filter((d) => d.ejecutado === 0).length;
  const saldoEscrow = totalProyectado - totalEjecutado;

  // Calcular máximo para escala
  const maxValor = Math.max(
    ...datosFiltrados.map((d) => Math.max(d.proyectado, d.ejecutado)),
    1
  );
  const maxValorRedondeado = Math.max(Math.ceil(maxValor / 5000) * 5000, 10000);

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-900">Presupuesto</h3>
        <button
          onClick={onVerDetalle}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Ver detalle
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* KPIs compactos */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600">% ejecutado</span>
          <span className="text-xs font-semibold text-gray-900">
            {porcentajeEjecutado.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600">Saldo escrow</span>
          <span className="text-xs font-semibold text-blue-600">
            {formatCurrency(saldoEscrow)}
          </span>
        </div>
        {semanasSinEjecucion > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Sin ejec.</span>
            <span className="text-xs font-semibold text-gray-500">{semanasSinEjecucion}</span>
          </div>
        )}
      </div>

      {/* Gráfico de barras mini */}
      <div className="h-16 relative">
        <div className="flex items-end justify-between gap-0.5 h-full">
          {datosFiltrados.slice(-8).map((dato, index) => {
            const alturaProyectadoPct = (dato.proyectado / maxValorRedondeado) * 100;
            const alturaEjecutadoPct = (dato.ejecutado / maxValorRedondeado) * 100;
            const sinEjecucion = dato.ejecutado === 0;

            return (
              <div
                key={dato.semana}
                className="flex-1 flex flex-col items-center justify-end relative group"
              >
                {/* Barra gris (proyectado) */}
                <div
                  className="w-full bg-slate-300 rounded-t"
                  style={{
                    height: `${Math.max(alturaProyectadoPct, 2)}%`,
                    minHeight: '2px',
                  }}
                />
                {/* Barra verde (ejecutado) */}
                {!sinEjecucion && (
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t"
                    style={{
                      height: `${Math.max(alturaEjecutadoPct, 2)}%`,
                      minHeight: '2px',
                    }}
                  />
                )}
                {/* Indicador sin ejecución */}
                {sinEjecucion && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-gray-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de período */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <span className="text-[9px] text-gray-500">
          Mostrando {periodRange >= 24 ? 'Total' : `${periodRange} sem`}
        </span>
      </div>
    </div>
  );
}




