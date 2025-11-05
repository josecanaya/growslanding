'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { EtapasTimelineWrapper } from '@/components/cliente/EtapasTimelineWrapper';
import { ObraDetalle, ObraTimelineTask } from '@/types/obras';

type ObraDetailContainerProps = {
  obraId: string;
  onVolver?: () => void;
};

export function ObraDetailContainer({ obraId, onVolver }: ObraDetailContainerProps) {
  const [obra, setObra] = useState<ObraDetalle | null>(null);
  const [tareas, setTareas] = useState<ObraTimelineTask[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBackNavigation = () => {
    if (onVolver) {
      onVolver();
      return;
    }
    window.history.back();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // TODO: conectar con Supabase y reemplazar mocks por datos reales.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const obraMock: ObraDetalle = {
        id: obraId,
        nombre: 'Casa Residencial Norte',
        cliente: 'Familia Rodríguez',
        localizacion: 'Av. Libertador 1234, CABA',
        estado: 'ACTIVA',
        created_at: new Date().toISOString(),
        fecha_inicio: '2024-01-15',
        fechaInicio: '2024-01-15',
        fechaFinEstimada: '2024-12-31',
      };

      // LEGACY: mantener mocks sincronizados con timeline/page.tsx.
      const tareasMock: ObraTimelineTask[] = [
        {
          id: '1',
          nombre: 'Replanteo general de obra',
          obraId,
          lider: 'Carlos Pérez',
          fechaInicio: '2024-01-15',
          fechaFin: '2024-01-17',
          plantilla: 'REP001',
          checklist: ['Verificar niveles', 'Marcar ejes', 'Revisar planos'],
          evidencias: [],
          estado: 'completada',
          etapa: 'estructura',
          precedencia: [],
          duracion: 3,
          esCritica: true,
          tiempoTemprano: 0,
          tiempoTardio: 0,
        },
        {
          id: '2',
          nombre: 'Excavación de bases',
          obraId,
          lider: 'María López',
          fechaInicio: '2024-01-18',
          fechaFin: '2024-01-25',
          plantilla: 'SUE003',
          checklist: ['Excavación manual', 'Excavación mecánica', 'Nivelación'],
          evidencias: [],
          estado: 'completada',
          etapa: 'estructura',
          precedencia: ['1'],
          duracion: 8,
          esCritica: true,
          tiempoTemprano: 3,
          tiempoTardio: 3,
        },
        {
          id: '3',
          nombre: 'Hormigón de cimientos',
          obraId,
          lider: 'Juan García',
          fechaInicio: '2024-01-26',
          fechaFin: '2024-01-28',
          plantilla: 'HOR001',
          checklist: ['Armado de hierros', 'Vaciado de hormigón', 'Curado'],
          evidencias: [],
          estado: 'en_progreso',
          etapa: 'estructura',
          precedencia: ['2'],
          duracion: 3,
          esCritica: true,
          tiempoTemprano: 11,
          tiempoTardio: 11,
        },
        {
          id: '4',
          nombre: 'Estructura de columnas',
          obraId,
          lider: 'Ana Martínez',
          fechaInicio: '2024-01-29',
          fechaFin: '2024-02-15',
          plantilla: 'HOR005',
          checklist: ['Armado de columnas', 'Vaciado', 'Desmoldeo'],
          evidencias: [],
          estado: 'pendiente',
          etapa: 'estructura',
          precedencia: ['3'],
          duracion: 18,
          esCritica: true,
          tiempoTemprano: 14,
          tiempoTardio: 14,
        },
        {
          id: '5',
          nombre: 'Mampostería de muros',
          obraId,
          lider: 'Pedro Rodríguez',
          fechaInicio: '2024-02-16',
          fechaFin: '2024-03-10',
          plantilla: 'MAM001',
          checklist: ['Levantado de muros', 'Revoque grueso', 'Revoque fino'],
          evidencias: [],
          estado: 'pendiente',
          etapa: 'obra_gris',
          precedencia: ['4'],
          duracion: 23,
          esCritica: false,
          tiempoTemprano: 32,
          tiempoTardio: 32,
        },
        {
          id: '6',
          nombre: 'Instalaciones eléctricas básicas',
          obraId,
          lider: 'Luis Fernández',
          fechaInicio: '2024-03-01',
          fechaFin: '2024-03-15',
          plantilla: 'ELE001',
          checklist: ['Tendido de caños', 'Instalación de cables', 'Conexiones'],
          evidencias: [],
          estado: 'pendiente',
          etapa: 'obra_gris',
          precedencia: ['5'],
          duracion: 15,
          esCritica: false,
          tiempoTemprano: 45,
          tiempoTardio: 45,
        },
        {
          id: '7',
          nombre: 'Revoque grueso y fino',
          obraId,
          lider: 'Roberto Silva',
          fechaInicio: '2024-03-21',
          fechaFin: '2024-04-10',
          plantilla: 'REV001',
          checklist: ['Revoque grueso', 'Revoque fino', 'Pulido'],
          evidencias: [],
          estado: 'pendiente',
          etapa: 'terminaciones',
          precedencia: ['5'],
          duracion: 21,
          esCritica: false,
          tiempoTemprano: 55,
          tiempoTardio: 55,
        },
        {
          id: '8',
          nombre: 'Pintura interior',
          obraId,
          lider: 'Carmen Díaz',
          fechaInicio: '2024-04-11',
          fechaFin: '2024-04-25',
          plantilla: 'PIN001',
          checklist: ['Preparación de superficies', 'Primera mano', 'Segunda mano'],
          evidencias: [],
          estado: 'pendiente',
          etapa: 'terminaciones',
          precedencia: ['7'],
          duracion: 15,
          esCritica: false,
          tiempoTemprano: 76,
          tiempoTardio: 76,
        },
      ];

      setObra(obraMock);
      setTareas(tareasMock);
      setLoading(false);
    };

    loadData();
  }, [obraId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Cargando timeline de la obra...</p>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Obra no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleBackNavigation}
            className="mb-4 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver
          </button>
        </div>

        <EtapasTimelineWrapper obra={obra} tareas={tareas} />
      </div>
    </div>
  );
}
