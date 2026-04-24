'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
  USE_MOCK_DATA,
  MOCK_PRESUPUESTOS,
  type MockPresupuesto,
} from '@/lib/mocks/socioMockData';

interface Presupuesto {
  obra_id: string;
  obra_name: string;
  direccion_completa?: string | null;
  fecha_inicio?: string | null;
  pendientes: number;
  enviados: number;
  aprobados: number;
  estado?: 'ENVIADO' | 'APROBADO' | 'RECHAZADO' | 'PENDIENTE';
  fecha_envio?: string;
  inicio_estimado?: string | null;
  cantidad_tareas?: number;
}

export function HomePresupuestosSection() {
  const router = useRouter();
  // Estado separado para presupuestos (no compartido)
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresupuestos = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCK_DATA) {
          // Usar mocks - limitar a 2 para Home
          const mocksLimitados = MOCK_PRESUPUESTOS.slice(0, 2);
          
          // Convertir mocks a formato de interfaz
          const presupuestosFormateados: Presupuesto[] = mocksLimitados.map((mock) => ({
            obra_id: mock.obra_id,
            obra_name: mock.obra_name,
            direccion_completa: mock.direccion_completa,
            fecha_inicio: mock.fecha_inicio,
            pendientes: mock.pendientes,
            enviados: mock.enviados,
            aprobados: mock.aprobados,
            estado: mock.estado,
            fecha_envio: mock.fecha_envio,
            inicio_estimado: mock.inicio_estimado,
            cantidad_tareas: mock.cantidad_tareas,
          }));

          // Ordenar: primero aprobados, luego enviados, luego pendientes
          const sorted = presupuestosFormateados.sort((a, b) => {
            if (a.aprobados !== b.aprobados) return b.aprobados - a.aprobados;
            if (a.enviados !== b.enviados) return b.enviados - a.enviados;
            return b.pendientes - a.pendientes;
          });

          setPresupuestos(sorted);
        } else {
          // Usar datos reales
          const response = await fetch('/api/socio/presupuestos');
          if (!response.ok) {
            throw new Error('Error al cargar presupuestos');
          }

          const data = await response.json();
          // Ordenar: primero los que tienen aprobados, luego enviados, luego pendientes
          const sorted = (data.obras || []).sort((a: Presupuesto, b: Presupuesto) => {
            if (a.aprobados !== b.aprobados) return b.aprobados - a.aprobados;
            if (a.enviados !== b.enviados) return b.enviados - a.enviados;
            return b.pendientes - a.pendientes;
          });
          // Limitar a 2 para Home
          setPresupuestos(sorted.slice(0, 2));
        }
      } catch (err) {
        setError('No se pudieron cargar los presupuestos');
      } finally {
        setLoading(false);
      }
    };

    fetchPresupuestos();
  }, []);

  const getEstadoIcon = (estado?: string) => {
    switch (estado) {
      case 'APROBADO':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'ENVIADO':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'RECHAZADO':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEstadoTexto = (presupuesto: Presupuesto) => {
    if (presupuesto.estado === 'APROBADO') return 'Aprobado';
    if (presupuesto.estado === 'ENVIADO') return 'Enviado';
    if (presupuesto.estado === 'RECHAZADO') return 'Rechazado';
    if (presupuesto.estado === 'PENDIENTE') return 'Pendiente';
    
    // Fallback a lógica anterior
    if (presupuesto.aprobados > 0) return 'Aprobado';
    if (presupuesto.enviados > 0) return 'Enviado';
    return 'Pendiente';
  };

  const getEstadoColor = (presupuesto: Presupuesto) => {
    if (presupuesto.estado === 'APROBADO' || presupuesto.aprobados > 0) {
      return 'text-green-600';
    }
    if (presupuesto.estado === 'ENVIADO' || presupuesto.enviados > 0) {
      return 'text-yellow-600';
    }
    if (presupuesto.estado === 'RECHAZADO') {
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Mis presupuestos</h2>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-3 space-y-2 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Ocultar en caso de error para no saturar
  }

  if (presupuestos.length === 0) {
    return null; // Ocultar sección si no hay presupuestos
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Mis presupuestos</h2>
        <button
          onClick={() => router.push('/socio/presupuestos')}
          className="text-sm text-[#276EF1] hover:text-[#1E56D9] font-medium"
        >
          Ver todos →
        </button>
      </div>

      <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
        {presupuestos.map((presupuesto) => (
          <div
            key={presupuesto.obra_id}
            onClick={() => router.push(`/socio/presupuestos?obra_id=${presupuesto.obra_id}`)}
            className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm leading-tight">
                  {presupuesto.obra_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getEstadoIcon(presupuesto.estado)}
                  <span className={`text-xs font-medium ${getEstadoColor(presupuesto)}`}>
                    {getEstadoTexto(presupuesto)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
