'use client';

import { ArrowRight } from 'lucide-react';

interface PresupuestoSemanal {
  semana: number;
  proyectado: number;
  ejecutado: number;
}

interface CardPresupuestoMobileProps {
  presupuesto: { presupuestado: number; ejecutado: number };
  presupuestoSemanal: PresupuestoSemanal[];
  periodRange: number;
  formatCurrency: (v: number) => string;
  onVerDetalle: () => void;
}

export function CardPresupuestoMobile({
  presupuesto,
  presupuestoSemanal,
  periodRange,
  formatCurrency,
  onVerDetalle,
}: CardPresupuestoMobileProps) {
  // Filtrar por período (últimas semanas)
  const totalSemanas = presupuestoSemanal.length;
  const inicioSlice = periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
  const datosFiltrados = presupuestoSemanal.slice(inicioSlice);

  // Calcular KPIs
  const totalProyectado = datosFiltrados.reduce((sum, d) => sum + d.proyectado, 0);
  const totalEjecutado = datosFiltrados.reduce((sum, d) => sum + d.ejecutado, 0);
  const porcentajeEjecutado = totalProyectado > 0 ? (totalEjecutado / totalProyectado) * 100 : 0;
  const saldoEscrow = totalProyectado - totalEjecutado;

  // Calcular máximo para escala
  const maxValor = Math.max(
    ...datosFiltrados.map((d) => Math.max(d.proyectado, d.ejecutado)),
    1
  );
  const maxValorRedondeado = Math.max(Math.ceil(maxValor / 5000) * 5000, 10000);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/70 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Presupuesto</h3>
        <button
          onClick={onVerDetalle}
          className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver detalle
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* KPIs compactos */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">% ejecutado</span>
          <span className="text-sm font-semibold text-gray-900">
            {porcentajeEjecutado.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Saldo escrow</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(saldoEscrow)}
          </span>
        </div>
      </div>

      {/* Mini gráfico de barras */}
      <div className="h-12 relative">
        <div className="flex items-end justify-between gap-0.5 h-full">
          {datosFiltrados.slice(-6).map((dato, index) => {
            const alturaProyectadoPct = (dato.proyectado / maxValorRedondeado) * 100;
            const alturaEjecutadoPct = (dato.ejecutado / maxValorRedondeado) * 100;
            const sinEjecucion = dato.ejecutado === 0;

            return (
              <div
                key={dato.semana}
                className="flex-1 flex flex-col items-center justify-end relative"
              >
                {/* Barra gris (proyectado) */}
                <div
                  className="w-full bg-gray-300 rounded-t"
                  style={{
                    height: `${Math.max(alturaProyectadoPct, 3)}%`,
                    minHeight: '3px',
                  }}
                />
                {/* Barra verde (ejecutado) */}
                {!sinEjecucion && (
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-emerald-600 rounded-t"
                    style={{
                      height: `${Math.max(alturaEjecutadoPct, 2)}%`,
                      minHeight: '2px',
                      width: '100%',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

