'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_SOLICITUDES } from '@/lib/mocks/socioMockData';

/** Datos mock para el presupuesto de ejemplo — sin base de datos */
const MOCK_LINEAS_PRESUPUESTO = [
  { id: '1', tarea: 'Revoque exterior bloque 1-4', dias: 5, monto: 85000 },
  { id: '2', tarea: 'Revoque exterior bloque 5-8', dias: 6, monto: 102000 },
  { id: '3', tarea: 'Revoque exterior bloque 9-12', dias: 4, monto: 68000 },
];

export default function PresupuestoEjemploPage() {
  const router = useRouter();
  const obra = MOCK_SOLICITUDES[0];
  const totalDias = MOCK_LINEAS_PRESUPUESTO.reduce((s, l) => s + l.dias, 0);
  const totalMonto = MOCK_LINEAS_PRESUPUESTO.reduce((s, l) => s + l.monto, 0);

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      {/* Barra superior: solo volver */}
      <div className="bg-white border-b border-slate-200 px-2 py-2 sticky top-[70px] z-10">
        <button
          onClick={() => router.push('/socio/oportunidades')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Volver a oportunidades"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Título */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Presupuesto de ejemplo
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Demo · Sin conexión a base de datos
          </p>
        </div>

        {/* Obra */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-1">Obra</h2>
          <p className="text-base font-semibold text-gray-900">{obra.obra_name}</p>
          <p className="text-sm text-gray-600 mt-0.5">{obra.direccion_completa}</p>
          <p className="text-xs text-gray-500 mt-1">
            {obra.tipo_trabajo} · {obra.zona}
          </p>
        </div>

        {/* Lineas del presupuesto */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#276EF1]" />
            <span className="text-sm font-medium text-gray-900">Ítems del presupuesto</span>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_LINEAS_PRESUPUESTO.map((linea) => (
              <div
                key={linea.id}
                className="px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {linea.tarea}
                  </p>
                  <p className="text-xs text-gray-500">{linea.dias} días</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  ${linea.monto.toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <div className="text-right">
              <p className="text-xs text-gray-500">{totalDias} días</p>
              <p className="text-base font-semibold text-gray-900">
                ${totalMonto.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => router.push('/socio/oportunidades')}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Check className="h-4 w-4 mr-2" />
          Listo · Volver a oportunidades
        </Button>
      </div>
    </div>
  );
}
