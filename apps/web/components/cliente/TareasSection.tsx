'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, TrendingUp, MapPin, User, ArrowRight, Users, CheckCircle, ClipboardList } from 'lucide-react';
import { BaseCard, Card, Button, Badge, EmptyState } from '@/components/ui/grows';
import type { BadgeProps } from '@/components/ui/grows';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ResumenTareasLayout } from '@/components/tareas/ResumenTareasLayout';
import { EtapasSection } from './EtapasSection';
import { ValidarSection } from './ValidarSection';
import { AsignarSection } from './AsignarSection';
import { AsignarModal } from '@/components/cuadrillas/AsignarModal';
import { OrganizaSection } from '@/components/clienteTecnico/OrganizaSection';

const DEFAULT_CANVAS_DURATION = 2;

type OrganizaPrecedenciaMap = Record<
  string,
  {
    dependeDe: string | null;
    duracion: number;
    posX: number | null;
    posY: number | null;
  }
>;

// Tipos de datos
interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number;
  tareasTotal: number;
  tareasCompletadas: number;
  tareasPendientes: number;
  tareasEnProgreso: number;
  tareasFinalizadas: number;
  fechaInicio: string;
  responsable: string;
}

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada';
  responsable: string;
  etapa: 'Estructura' | 'Obra gris' | 'Terminaciones' | 'Instalaciones';
  fechaInicio: string;
  fechaFin: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  presupuesto?: number;
  dependencias?: string[];
  obraId?: string | null;
}

// Función para calcular el progreso de una obra basado en tareas
const calcularProgreso = (tareasCompletadas: number, tareasTotal: number): number => {
  if (tareasTotal === 0) return 0;
  return Math.round((tareasCompletadas / tareasTotal) * 100);
};

const mapTareaEstadoToBadgeStatus = (estado: Tarea['estado']): BadgeProps['status'] => {
  switch (estado) {
    case 'Pendiente':
      return 'pendiente';
    case 'En curso':
      return 'en_progreso';
    case 'Finalizada':
      return 'finalizada';
    case 'Aprobada':
      return 'completada';
    default:
      return 'pendiente';
  }
};

// Mock eliminado - ahora se cargan desde Supabase
const tareasMock_DEPRECATED: Tarea[] = [
  // ====== ETAPA 1: ESTRUCTURA ======
  // Inicio del proyecto
  {
    id: 'E01',
    nombre: 'Replanteo y nivelación',
    descripcion: 'Marcado de ejes, niveles y límites del terreno',
    estado: 'Finalizada',
    responsable: 'Arq. Carlos Pérez',
    etapa: 'Estructura',
    fechaInicio: '2024-01-15',
    fechaFin: '2024-01-18',
    prioridad: 'Alta',
    presupuesto: 18000,
    dependencias: [],
    obraId: 'O01'
  },
  {
    id: 'E02',
    nombre: 'Excavación y preparación de terreno',
    descripcion: 'Excavación de fundaciones y nivelación del terreno',
    estado: 'Finalizada',
    responsable: 'Ing. Juan Molina',
    etapa: 'Estructura',
    fechaInicio: '2024-01-19',
    fechaFin: '2024-01-26',
    prioridad: 'Alta',
    presupuesto: 42000,
    dependencias: ['E01'],
    obraId: 'O01'
  },
  {
    id: 'E03',
    nombre: 'Armado y hormigonado de bases',
    descripcion: 'Colocación de armaduras y hormigonado de zapatas y vigas de fundación',
    estado: 'Finalizada',
    responsable: 'Ing. María González',
    etapa: 'Estructura',
    fechaInicio: '2024-01-27',
    fechaFin: '2024-02-05',
    prioridad: 'Alta',
    presupuesto: 95000,
    dependencias: ['E02'],
    obraId: 'O01'
  },
  {
    id: 'E04',
    nombre: 'Estructura de columnas - Planta Baja',
    descripcion: 'Encofrado, armado y hormigonado de columnas de PB',
    estado: 'En curso',
    responsable: 'Ing. María González',
    etapa: 'Estructura',
    fechaInicio: '2024-02-06',
    fechaFin: '2024-02-20',
    prioridad: 'Alta',
    presupuesto: 125000,
    dependencias: ['E03'],
    obraId: 'O01'
  },
  {
    id: 'E05',
    nombre: 'Losa de entrepiso - Planta Baja',
    descripcion: 'Encofrado, armado y hormigonado de losa sobre PB',
    estado: 'Pendiente',
    responsable: 'Ing. María González',
    etapa: 'Estructura',
    fechaInicio: '2024-02-21',
    fechaFin: '2024-03-05',
    prioridad: 'Alta',
    presupuesto: 180000,
    dependencias: ['E04'],
    obraId: 'O01'
  },
  {
    id: 'E06',
    nombre: 'Estructura de columnas - Planta Alta',
    descripcion: 'Encofrado, armado y hormigonado de columnas de PA',
    estado: 'Pendiente',
    responsable: 'Ing. María González',
    etapa: 'Estructura',
    fechaInicio: '2024-03-06',
    fechaFin: '2024-03-18',
    prioridad: 'Alta',
    presupuesto: 110000,
    dependencias: ['E05'],
    obraId: 'O01'
  },
  {
    id: 'E07',
    nombre: 'Losa de techo - Cubierta',
    descripcion: 'Encofrado, armado y hormigonado de losa de cubierta',
    estado: 'Pendiente',
    responsable: 'Ing. María González',
    etapa: 'Estructura',
    fechaInicio: '2024-03-19',
    fechaFin: '2024-04-02',
    prioridad: 'Alta',
    presupuesto: 195000,
    dependencias: ['E06'],
    obraId: 'O01'
  },

  // ====== ETAPA 2: OBRA GRIS ======
  {
    id: 'OG01',
    nombre: 'Mampostería exterior - Planta Baja',
    descripcion: 'Construcción de muros exteriores de ladrillo en PB',
    estado: 'Pendiente',
    responsable: 'Maestro Roberto Silva',
    etapa: 'Obra gris',
    fechaInicio: '2024-04-03',
    fechaFin: '2024-04-18',
    prioridad: 'Media',
    presupuesto: 85000,
    dependencias: ['E07'],
    obraId: 'O01'
  },
  {
    id: 'OG02',
    nombre: 'Mampostería exterior - Planta Alta',
    descripcion: 'Construcción de muros exteriores de ladrillo en PA',
    estado: 'Pendiente',
    responsable: 'Maestro Roberto Silva',
    etapa: 'Obra gris',
    fechaInicio: '2024-04-19',
    fechaFin: '2024-05-03',
    prioridad: 'Media',
    presupuesto: 78000,
    dependencias: ['E07'],
    obraId: 'O01'
  },
  {
    id: 'OG03',
    nombre: 'Mampostería interior - Divisiones',
    descripcion: 'Construcción de muros internos en ambas plantas',
    estado: 'Pendiente',
    responsable: 'Maestro Roberto Silva',
    etapa: 'Obra gris',
    fechaInicio: '2024-05-04',
    fechaFin: '2024-05-20',
    prioridad: 'Media',
    presupuesto: 62000,
    dependencias: ['OG01', 'OG02'],
    obraId: 'O01'
  },
  {
    id: 'OG04',
    nombre: 'Instalación eléctrica - Cableado',
    descripcion: 'Tendido de cables, cajas y cañerías eléctricas',
    estado: 'Pendiente',
    responsable: 'Elec. Ana García',
    etapa: 'Obra gris',
    fechaInicio: '2024-05-21',
    fechaFin: '2024-06-05',
    prioridad: 'Media',
    presupuesto: 72000,
    dependencias: ['OG03'],
    obraId: 'O01'
  },
  {
    id: 'OG05',
    nombre: 'Instalación sanitaria - Agua y desagüe',
    descripcion: 'Tendido de cañerías de agua fría, caliente y desagües cloacales',
    estado: 'Pendiente',
    responsable: 'Plomero Pedro Martínez',
    etapa: 'Obra gris',
    fechaInicio: '2024-05-21',
    fechaFin: '2024-06-08',
    prioridad: 'Media',
    presupuesto: 68000,
    dependencias: ['OG03'],
    obraId: 'O01'
  },
  {
    id: 'OG06',
    nombre: 'Instalación de gas',
    descripcion: 'Tendido de cañerías de gas y ventilaciones',
    estado: 'Pendiente',
    responsable: 'Gasista Luis Torres',
    etapa: 'Obra gris',
    fechaInicio: '2024-06-09',
    fechaFin: '2024-06-18',
    prioridad: 'Media',
    presupuesto: 38000,
    dependencias: ['OG04', 'OG05'],
    obraId: 'O01'
  },
  {
    id: 'OG07',
    nombre: 'Revoque grueso exterior',
    descripcion: 'Aplicación de revoque exterior en fachadas',
    estado: 'Pendiente',
    responsable: 'Revocador Luis Fernández',
    etapa: 'Obra gris',
    fechaInicio: '2024-06-19',
    fechaFin: '2024-07-05',
    prioridad: 'Media',
    presupuesto: 55000,
    dependencias: ['OG06'],
    obraId: 'O01'
  },
  {
    id: 'OG08',
    nombre: 'Revoque grueso interior',
    descripcion: 'Aplicación de revoque grueso en muros interiores',
    estado: 'Pendiente',
    responsable: 'Revocador Luis Fernández',
    etapa: 'Obra gris',
    fechaInicio: '2024-07-06',
    fechaFin: '2024-07-22',
    prioridad: 'Media',
    presupuesto: 62000,
    dependencias: ['OG06'],
    obraId: 'O01'
  },
  {
    id: 'OG09',
    nombre: 'Contrapiso y carpeta',
    descripcion: 'Ejecución de contrapisos nivelados para pisos',
    estado: 'Pendiente',
    responsable: 'Maestro Roberto Silva',
    etapa: 'Obra gris',
    fechaInicio: '2024-07-23',
    fechaFin: '2024-08-08',
    prioridad: 'Media',
    presupuesto: 48000,
    dependencias: ['OG08'],
    obraId: 'O01'
  },

  // ====== ETAPA 3: TERMINACIONES ======
  {
    id: 'T01',
    nombre: 'Revoque fino y enduído interior',
    descripcion: 'Aplicación de revoque fino y alisado en interiores',
    estado: 'Pendiente',
    responsable: 'Revocador Luis Fernández',
    etapa: 'Terminaciones',
    fechaInicio: '2024-08-09',
    fechaFin: '2024-08-28',
    prioridad: 'Baja',
    presupuesto: 58000,
    dependencias: ['OG09'],
    obraId: 'O01'
  },
  {
    id: 'T02',
    nombre: 'Carpintería de aluminio - Aberturas exteriores',
    descripcion: 'Instalación de ventanas y puertas exteriores',
    estado: 'Pendiente',
    responsable: 'Carpintero Jorge López',
    etapa: 'Terminaciones',
    fechaInicio: '2024-08-29',
    fechaFin: '2024-09-15',
    prioridad: 'Baja',
    presupuesto: 125000,
    dependencias: ['T01'],
    obraId: 'O01'
  },
  {
    id: 'T03',
    nombre: 'Carpintería de madera - Puertas interiores',
    descripcion: 'Colocación de puertas placas interiores',
    estado: 'Pendiente',
    responsable: 'Carpintero Jorge López',
    etapa: 'Terminaciones',
    fechaInicio: '2024-09-16',
    fechaFin: '2024-09-28',
    prioridad: 'Baja',
    presupuesto: 68000,
    dependencias: ['T01'],
    obraId: 'O01'
  },
  {
    id: 'T04',
    nombre: 'Revestimientos cerámicos - Baños y cocina',
    descripcion: 'Colocación de cerámicos en pisos y paredes húmedas',
    estado: 'Pendiente',
    responsable: 'Colocador Raúl Castro',
    etapa: 'Terminaciones',
    fechaInicio: '2024-09-29',
    fechaFin: '2024-10-15',
    prioridad: 'Baja',
    presupuesto: 82000,
    dependencias: ['T03'],
    obraId: 'O01'
  },
  {
    id: 'T05',
    nombre: 'Porcelanato - Ambientes principales',
    descripcion: 'Colocación de porcelanato en living, comedor y dormitorios',
    estado: 'Pendiente',
    responsable: 'Colocador Raúl Castro',
    etapa: 'Terminaciones',
    fechaInicio: '2024-10-16',
    fechaFin: '2024-10-30',
    prioridad: 'Baja',
    presupuesto: 95000,
    dependencias: ['T04'],
    obraId: 'O01'
  },
  {
    id: 'T06',
    nombre: 'Artefactos sanitarios',
    descripcion: 'Instalación de inodoros, lavatorios, duchas y griferías',
    estado: 'Pendiente',
    responsable: 'Plomero Pedro Martínez',
    etapa: 'Terminaciones',
    fechaInicio: '2024-10-31',
    fechaFin: '2024-11-08',
    prioridad: 'Baja',
    presupuesto: 58000,
    dependencias: ['T05'],
    obraId: 'O01'
  },
  {
    id: 'T07',
    nombre: 'Artefactos eléctricos y luminarias',
    descripcion: 'Colocación de llaves, tomas, spots y artefactos de luz',
    estado: 'Pendiente',
    responsable: 'Elec. Ana García',
    etapa: 'Terminaciones',
    fechaInicio: '2024-10-31',
    fechaFin: '2024-11-08',
    prioridad: 'Baja',
    presupuesto: 48000,
    dependencias: ['T05'],
    obraId: 'O01'
  },
  {
    id: 'T08',
    nombre: 'Pintura - Interiores',
    descripcion: 'Pintura látex en muros y cielorrasos interiores',
    estado: 'Pendiente',
    responsable: 'Pintor Sofía Ruiz',
    etapa: 'Terminaciones',
    fechaInicio: '2024-11-09',
    fechaFin: '2024-11-25',
    prioridad: 'Baja',
    presupuesto: 62000,
    dependencias: ['T06', 'T07'],
    obraId: 'O01'
  },
  {
    id: 'T09',
    nombre: 'Pintura - Exteriores',
    descripcion: 'Pintura acrílica en fachadas y cielorrasos exteriores',
    estado: 'Pendiente',
    responsable: 'Pintor Sofía Ruiz',
    etapa: 'Terminaciones',
    fechaInicio: '2024-11-26',
    fechaFin: '2024-12-08',
    prioridad: 'Baja',
    presupuesto: 55000,
    dependencias: ['T08'],
    obraId: 'O01'
  },
  {
    id: 'T10',
    nombre: 'Limpieza final y detalles',
    descripcion: 'Limpieza profunda, reparación de detalles y retoques finales',
    estado: 'Pendiente',
    responsable: 'Coordinadora Mónica Vargas',
    etapa: 'Terminaciones',
    fechaInicio: '2024-12-09',
    fechaFin: '2024-12-15',
    prioridad: 'Alta',
    presupuesto: 18000,
    dependencias: ['T09'],
    obraId: 'O01'
  },
  {
    id: 'T11',
    nombre: 'Entrega y habilitación',
    descripcion: 'Inspección final, entrega de llaves y documentación al cliente',
    estado: 'Pendiente',
    responsable: 'Dir. Obra Carlos Pérez',
    etapa: 'Terminaciones',
    fechaInicio: '2024-12-16',
    fechaFin: '2024-12-18',
    prioridad: 'Alta',
    presupuesto: 8000,
    dependencias: ['T10'],
    obraId: 'O01'
  }
];

interface ObraResumenCardProps {
  obra: Obra;
  onVerPlanificacion: (obraId: string) => void;
}

function ObraResumenCard({ obra, onVerPlanificacion }: ObraResumenCardProps) {
  const getEstadoVariant = (estado: string) => {
    switch (estado) {
      case 'activa': return 'success';
      case 'pausada': return 'warning';
      case 'finalizada': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card
      footer={
        <Button
          variant="primary"
          size="sm"
          onClick={() => onVerPlanificacion(obra.id)}
          icon={<ArrowRight className="h-4 w-4" />}
          className="w-full"
        >
          Ver planificación
        </Button>
      }
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-grows-md border border-grows-border bg-grows-secondary/10 p-2">
            <Building2 className="h-5 w-5 text-grows-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-grows-primary">
              {obra.nombre}
            </h3>
            <div className="mt-1 flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-grows-text-secondary" />
              <span className="text-sm text-grows-text-secondary">
                {obra.direccion}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getEstadoVariant(obra.estado)}>
            {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-2 text-sm text-grows-text-secondary">
        <User className="h-4 w-4" />
        <span className="font-medium">Cliente:</span>
        <span>{obra.cliente}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-grows-primary">Progreso general</span>
          <span className="text-sm text-grows-text-secondary">{obra.avance}%</span>
        </div>
        <div className="w-full rounded-full h-2 bg-grows-neutral">
          <div 
            className="h-2 rounded-full bg-grows-primary transition-all duration-300"
            style={{ width: `${obra.avance}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-grows-text-secondary">
          <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
        </div>
      </div>
    </Card>
  );
}

type VistaTareas = 'lista-obras' | 'detalle-obra' | 'editor-gantt';
type TabPrincipal = 'asignar' | 'organiza' | 'validar' | 'etapas' | 'resumen';

export function TareasSection() {
  const router = useRouter();
  const [vistaActual, setVistaActual] = useState<VistaTareas>('lista-obras');
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>('organiza');
  const [organizaCanvas, setOrganizaCanvas] = useState<Record<string, string[]>>({});
  const [organizaPrecedencias, setOrganizaPrecedencias] = useState<Record<string, OrganizaPrecedenciaMap>>({});
  
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  
  const supabase = createClientComponentClient();
  const currentUser = useCurrentUser();

  // Cargar obras desde Supabase
  useEffect(() => {
    const cargarObras = async () => {
      if (!currentUser?.orgId) {
        console.log('[TareasSection] No hay orgId disponible');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('[TareasSection] Cargando obras para orgId:', currentUser.orgId);
        
        // Obtener obras - usar los mismos nombres de columnas que funcionan en ObrasSection
        const { data: obrasData, error: obrasError } = await supabase
          .from('obras')
          .select('id, org_id, name, address, estado, created_at, propietario, tipo_obra')
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        // Verificar si hay error
        if (obrasError) {
          console.error('[TareasSection] Error cargando obras:', obrasError);
          console.error('[TareasSection] Detalles completos del error:', JSON.stringify(obrasError, null, 2));
          console.error('[TareasSection] Tipo de error:', typeof obrasError);
          console.error('[TareasSection] orgId del usuario:', currentUser.orgId);
          setObras([]);
          setLoading(false);
          return;
        }

        console.log('[TareasSection] Obras obtenidas:', obrasData?.length || 0);

        // Si no hay datos, simplemente no hay obras
        if (!obrasData || obrasData.length === 0) {
          console.log('[TareasSection] No hay obras disponibles para este usuario');
          setObras([]);
          setLoading(false);
          return;
        }

        // Obtener tareas para cada obra
        const obrasConTareas = await Promise.all(
          (obrasData || []).map(async (obra: any) => {
            const { data: tareasData, error: tareasError } = await supabase
              .from('tareas')
              .select('id, estado')
              .eq('obra_id', obra.id);

            if (tareasError) {
              console.error(`Error cargando tareas para obra ${obra.id}:`, tareasError);
              return { ...obra, tareas: [] };
            }

            return { ...obra, tareas: tareasData || [] };
          })
        );

        // Formatear obras con cálculos de progreso
        const obrasFormateadas: Obra[] = obrasConTareas.map((obra: any) => {
          const tareasTotal = obra.tareas?.length || 0;
          // Estados válidos: 'validado' o 'finalizado' (según schema de Supabase)
          const tareasCompletadas = obra.tareas?.filter((t: any) => {
            const estado = (t.estado || '').toLowerCase();
            return estado === 'validado' || estado === 'finalizado';
          }).length || 0;
          const tareasPendientes = obra.tareas?.filter((t: any) => {
            const estado = (t.estado || '').toLowerCase();
            return estado === 'pendiente';
          }).length || 0;
          const tareasEnProgreso = obra.tareas?.filter((t: any) => {
            const estado = (t.estado || '').toLowerCase();
            return estado === 'en_progreso' || estado === 'en curso';
          }).length || 0;
          const avance = calcularProgreso(tareasCompletadas, tareasTotal);

          // Mapear nombres de columnas (name/address de Supabase a nombre/localizacion)
          return {
            id: obra.id,
            nombre: obra.name || obra.nombre || 'Sin nombre',
            direccion: obra.address || obra.localizacion || 'Sin dirección',
            cliente: obra.propietario || obra.cliente || 'Sin cliente',
            estado: (obra.estado?.toLowerCase() === 'activa' || obra.estado?.toUpperCase() === 'ACTIVA') ? 'activa' : 
                    (obra.estado?.toLowerCase() === 'pausada' || obra.estado?.toUpperCase() === 'PAUSADA') ? 'pausada' : 
                    (obra.estado?.toLowerCase() === 'finalizada' || obra.estado?.toUpperCase() === 'FINALIZADA') ? 'finalizada' : 'activa',
            avance,
            tareasTotal,
            tareasCompletadas,
            tareasPendientes,
            tareasEnProgreso,
            tareasFinalizadas: tareasCompletadas,
            fechaInicio: obra.created_at || new Date().toISOString(),
            responsable: 'Responsable' // TODO: agregar cuando esté disponible en la BD
          };
        });

        setObras(obrasFormateadas);
      } catch (error) {
        console.error('Error en cargarObras:', error);
        setObras([]);
      } finally {
        setLoading(false);
      }
    };

    cargarObras();
  }, [currentUser?.orgId, supabase]);

  // Filtrar solo obras activas
  const obrasActivas = useMemo(() => {
    return obras.filter(obra => obra.estado === 'activa');
  }, [obras]);

  // Cargar tareas desde Supabase cuando se selecciona una obra
  useEffect(() => {
    const cargarTareas = async () => {
      if (!obraSeleccionada || !currentUser?.orgId) {
        setTareas([]);
        setOrganizaPrecedencias((prev) => ({
          ...prev,
          [obraSeleccionada ?? '']: {},
        }));
        return;
      }

      try {
        setLoadingTareas(true);
        
        // Obtener tareas de la obra desde Supabase con join a elementos
        const { data: tareasData, error: tareasError } = await supabase
          .from('tareas')
          .select(`
            id,
            title,
            descripcion,
            estado,
            responsable,
            fecha_inicio,
            fecha_fin,
            fecha_inicio_estimada,
            fecha_fin_estimada,
            obra_id,
            elemento_id,
            prioridad,
            avance,
            created_at,
            elemento:elementos(id, nombre, categoria, subcategoria)
          `)
          .eq('obra_id', obraSeleccionada)
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        if (tareasError) {
          console.error('[TareasSection] Error cargando tareas:', tareasError);
          setTareas([]);
          setOrganizaPrecedencias((prev) => ({
            ...prev,
            [obraSeleccionada]: {},
          }));
          return;
        }

        // Mapear tareas de Supabase al formato esperado
        const tareasFormateadas: Tarea[] = (tareasData || []).map((tarea: any) => {
          // Determinar etapa basándose en la categoría del elemento o inferir desde el texto
          let etapa: 'Estructura' | 'Obra gris' | 'Terminaciones' | 'Instalaciones' = 'Estructura';
          
          // Si hay información del elemento, usar su categoría
          const elemento = tarea.elemento || {};
          if (elemento.categoria) {
            const categoriaLower = elemento.categoria.toLowerCase();
            if (categoriaLower.includes('estructura') || categoriaLower.includes('fundación')) {
              etapa = 'Estructura';
            } else if (categoriaLower.includes('instalación') || categoriaLower.includes('sanitaria') || categoriaLower.includes('eléctrica')) {
              etapa = 'Instalaciones';
            } else if (categoriaLower.includes('muro') || categoriaLower.includes('revoque') || categoriaLower.includes('mampostería')) {
              etapa = 'Obra gris';
            } else if (categoriaLower.includes('pintura') || categoriaLower.includes('terminación') || categoriaLower.includes('acabado')) {
              etapa = 'Terminaciones';
            }
          }
          
          // Si no hay categoría, intentar inferir desde el texto
          if (etapa === 'Estructura' && !elemento.categoria) {
            const texto = `${tarea.descripcion || ''} ${tarea.title || ''}`.toLowerCase();
            if (texto.includes('revoque') || texto.includes('instalación') || texto.includes('mampostería')) {
              etapa = 'Obra gris';
            } else if (texto.includes('pintura') || texto.includes('terminación') || texto.includes('acabado')) {
              etapa = 'Terminaciones';
            } else if (texto.includes('estructura') || texto.includes('columna') || texto.includes('viga') || texto.includes('losa')) {
              etapa = 'Estructura';
            }
          }

          // Mapear estados de Supabase a estados del frontend
          let estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada' = 'Pendiente';
          const estadoSupabase = (tarea.estado || '').toLowerCase();
          if (estadoSupabase === 'validado' || estadoSupabase === 'finalizado') {
            estado = 'Finalizada';
          } else if (estadoSupabase === 'en_progreso' || estadoSupabase === 'en curso') {
            estado = 'En curso';
          } else if (estadoSupabase === 'pendiente') {
            estado = 'Pendiente';
          }

          // Mapear prioridad
          const prioridadMap: Record<string, 'Baja' | 'Media' | 'Alta'> = {
            'BAJA': 'Baja',
            'MEDIA': 'Media',
            'ALTA': 'Alta',
          };
          const prioridad = prioridadMap[tarea.prioridad?.toUpperCase() || 'MEDIA'] || 'Media';

          // Usar fecha_inicio_estimada si fecha_inicio no está disponible
          const fechaInicio = tarea.fecha_inicio || tarea.fecha_inicio_estimada;
          const fechaFin = tarea.fecha_fin || tarea.fecha_fin_estimada;

          return {
            id: tarea.id,
            nombre: tarea.title || 'Sin nombre',
            descripcion: tarea.descripcion || '',
            estado,
            responsable: tarea.responsable || 'Por asignar',
            etapa,
            fechaInicio: fechaInicio ? new Date(fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            fechaFin: fechaFin ? new Date(fechaFin).toISOString().split('T')[0] : '',
            prioridad,
            presupuesto: undefined,
            dependencias: [],
            // Información del elemento (si existe)
            elemento: elemento.nombre ? {
              id: elemento.id,
              nombre: elemento.nombre,
              categoria: elemento.categoria,
              subcategoria: elemento.subcategoria,
            } : undefined,
            obraId: tarea.obra_id, // Asegúrate de que obraId se asigne aquí
          };
        });

        const tareaIds = tareasFormateadas.map((tarea) => tarea.id);
        let precedenciasMap: OrganizaPrecedenciaMap = {};

        let precedenciasData: {
          tarea_id: string | null;
          depende_de: string | null;
          lag_dias: number | string | null;
          pos_x: number | string | null;
          pos_y: number | string | null;
          created_at?: string | null;
        }[] | null = null;

        if (tareaIds.length > 0) {
          const { data, error: precedenciasError } = await supabase
            .from('tarea_precedencias')
            .select('tarea_id, depende_de, lag_dias, pos_x, pos_y, created_at')
            .in('tarea_id', tareaIds)
            .order('created_at', { ascending: true });

          if (precedenciasError) {
            console.error('[TareasSection] Error cargando precedencias:', precedenciasError);
            precedenciasMap = {};
          } else if (data) {
            precedenciasData = data;
            precedenciasMap = data.reduce<OrganizaPrecedenciaMap>((acc, item) => {
              if (!item.tarea_id) {
                return acc;
              }
              acc[item.tarea_id] = {
                dependeDe: item.depende_de ?? null,
                duracion:
                  typeof item.lag_dias === 'number' && item.lag_dias > 0
                    ? item.lag_dias
                    : typeof item.lag_dias === 'string' && item.lag_dias.trim() !== ''
                    ? Math.max(1, Number.parseInt(item.lag_dias, 10))
                    : DEFAULT_CANVAS_DURATION,
                posX:
                  typeof item.pos_x === 'number'
                    ? item.pos_x
                    : typeof item.pos_x === 'string' && item.pos_x.trim() !== ''
                    ? Number.parseFloat(item.pos_x)
                    : null,
                posY:
                  typeof item.pos_y === 'number'
                    ? item.pos_y
                    : typeof item.pos_y === 'string' && item.pos_y.trim() !== ''
                    ? Number.parseFloat(item.pos_y)
                    : null,
              };
              return acc;
            }, {});
          }
        }

        const safePrecedenciasData = Array.isArray(precedenciasData) ? precedenciasData : [];

        const ordenDesdeSupabase = safePrecedenciasData
          .map((row) => row.tarea_id)
          .filter((id): id is string => Boolean(id));

        setOrganizaCanvas((prev) => ({
          ...prev,
          [obraSeleccionada]: ordenDesdeSupabase,
        }));

        setOrganizaPrecedencias((prev) => ({
          ...prev,
          [obraSeleccionada]: precedenciasMap,
        }));

        setTareas(tareasFormateadas);
      } catch (error) {
        console.error('[TareasSection] Error en cargarTareas:', error);
        setTareas([]);
      } finally {
        setLoadingTareas(false);
      }
    };

    cargarTareas();
  }, [obraSeleccionada, currentUser?.orgId, supabase]);

  const handleVerPlanificacion = (obraId: string) => {
    setObraSeleccionada(obraId);
    setVistaActual('detalle-obra');
    setTabPrincipal('organiza');
  };

  const handleVolverALista = () => {
    setVistaActual('lista-obras');
    setObraSeleccionada('');
  };

  const handleEditarGantt = () => {
    setVistaActual('editor-gantt');
  };

  const handleVolverADetalle = () => {
    setVistaActual('detalle-obra');
  };

  const obraActual = obras.find(o => o.id === obraSeleccionada);

  useEffect(() => {
    if (!obraSeleccionada) return;
    setOrganizaCanvas((prev) => {
      if (prev[obraSeleccionada]) {
        return prev;
      }
      return {
        ...prev,
        [obraSeleccionada]: [],
      };
    });
  }, [obraSeleccionada]);

  useEffect(() => {
    if (obraSeleccionada) {
      setTabPrincipal('organiza');
    }
  }, [obraSeleccionada]);

  const handleCanvasTasksChange = useCallback(
    (updater: (prev: string[]) => string[]) => {
      if (!obraSeleccionada) return;
      setOrganizaCanvas((prev) => {
        const current = prev[obraSeleccionada] ?? [];
        const next = updater(current);
        return {
          ...prev,
          [obraSeleccionada]: next,
        };
      });
    },
    [obraSeleccionada],
  );

  const handlePrecedenciasChange = useCallback(
    (updater: (prev: OrganizaPrecedenciaMap) => OrganizaPrecedenciaMap) => {
      if (!obraSeleccionada) return;
      setOrganizaPrecedencias((prev) => {
        const current = prev[obraSeleccionada] ?? {};
        const next = updater(current);
        return {
          ...prev,
          [obraSeleccionada]: next,
        };
      });
    },
    [obraSeleccionada],
  );

  // Renderizar vista según el estado actual
  switch (vistaActual) {
     case 'lista-obras': {
      const hayObras = obrasActivas.length > 0;
      const stats = obrasActivas.reduce(
        (acc, obra) => {
          acc.total += obra.tareasTotal;
          acc.pendientes += obra.tareasPendientes;
          acc.enProgreso += obra.tareasEnProgreso;
          acc.finalizadas += obra.tareasFinalizadas;
          return acc;
        },
        { total: 0, pendientes: 0, enProgreso: 0, finalizadas: 0 }
      );

      return (
        <section className="min-h-screen space-y-8 bg-grows-gray px-10 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-growsText">Tareas</h2>
              <p className="text-sm text-growsTextMuted">Gestioná y asigná las tareas de tus obras activas</p>
            </div>
            <Button onClick={() => router.push('/cliente/obras')}>Ver obras</Button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <BaseCard title="Total de tareas">
              <p className="text-2xl font-semibold text-growsBlue">
                {loading ? '—' : stats.total}
              </p>
            </BaseCard>
            <BaseCard title="Pendientes">
              <p className="text-2xl font-semibold text-growsBlue">
                {loading ? '—' : stats.pendientes}
              </p>
            </BaseCard>
            <BaseCard title="En progreso">
              <p className="text-2xl font-semibold text-growsBlue">
                {loading ? '—' : stats.enProgreso}
              </p>
            </BaseCard>
            <BaseCard title="Finalizadas">
              <p className="text-2xl font-semibold text-growsBlue">
                {loading ? '—' : stats.finalizadas}
              </p>
            </BaseCard>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-growsText">Obras activas</h3>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <BaseCard key={`obra-skeleton-${index}`}>
                    <div className="h-40 animate-pulse rounded-grows-md bg-grows-neutral" />
                  </BaseCard>
                ))}
              </div>
            ) : hayObras ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {obrasActivas.map((obra) => (
                  <BaseCard key={obra.id} title={obra.nombre} subtitle={obra.direccion}>
                    <div className="space-y-3">
                      <p className="text-sm text-growsTextMuted">
                        {obra.tareasTotal} tarea{obra.tareasTotal === 1 ? '' : 's'} asignada{obra.tareasTotal === 1 ? '' : 's'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-growsTextMuted">
                        <span>Pendientes: {obra.tareasPendientes}</span>
                        <span>En progreso: {obra.tareasEnProgreso}</span>
                        <span>Finalizadas: {obra.tareasFinalizadas}</span>
                      </div>
                      <Button
                        variant="secondary"
                        className="w-full border border-growsBorder"
                        onClick={() => handleVerPlanificacion(obra.id)}
                      >
                        Ver planificación
                      </Button>
                    </div>
                  </BaseCard>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay tareas registradas"
                description="Creá una obra o asigná tareas desde el módulo de obras."
                icon={<ClipboardList className="h-10 w-10 text-growsBlue" />}
              />
            )}
          </div>
        </section>
      );
    }
    case 'detalle-obra':
      return (
        <div className="space-y-6">
          {/* Header principal como en Obras */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVolverALista}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{obraActual?.nombre}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Cliente: {obraActual?.cliente}</span>
                    <span>Tipo: Nueva</span>
                    <span>Inicio: {new Date(obraActual?.fechaInicio || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Progreso General</div>
                  <div className="text-lg font-bold text-gray-900">{obraActual?.avance}%</div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${obraActual?.avance || 0}%` }}
                  ></div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs principales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap gap-2 px-6 py-2">
                {[
                  { id: 'organiza', label: 'Organiza', icon: ClipboardList },
                  { id: 'asignar', label: 'Asigna', icon: Users },
                  { id: 'validar', label: 'Validar', icon: CheckCircle },
                  { id: 'etapas', label: 'Etapas', icon: Building2 },
                  { id: 'resumen', label: 'Resumen', icon: TrendingUp },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTabPrincipal(tab.id as TabPrincipal)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        tabPrincipal === tab.id
                          ? 'bg-blue-50 text-blue-700 shadow-inner'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {tabPrincipal === 'resumen' && (
                obraSeleccionada ? (
                  <ResumenTareasLayout initialObraId={obraSeleccionada} />
                ) : (
                  <EmptyState
                    title="Seleccioná una obra"
                    description="Elegí una obra de la lista para visualizar su resumen de tareas."
                  />
                )
              )}

              {tabPrincipal === 'organiza' && (
                <OrganizaSection
                  obraId={obraSeleccionada || null}
                  tareas={obraSeleccionada ? tareas : []}
                  isLoading={loadingTareas}
                  canvasOrder={obraSeleccionada ? organizaCanvas[obraSeleccionada] ?? [] : []}
                  precedencias={obraSeleccionada ? organizaPrecedencias[obraSeleccionada] ?? {} : {}}
                  onCanvasOrderChange={handleCanvasTasksChange}
                  onPrecedenciasChange={handlePrecedenciasChange}
                />
              )}

              {tabPrincipal === 'asignar' && (
                <AsignarSection obraId={obraSeleccionada || null} />
              )}

              {tabPrincipal === 'etapas' && (
                obraSeleccionada ? (
                  <EtapasSection obraId={obraSeleccionada} requireSelection />
                ) : (
                  <EmptyState
                    title="Seleccioná una obra"
                    description="Elegí una obra activa para ver el avance por etapas."
                  />
                )
              )}

              {tabPrincipal === 'validar' && (
                <ValidarSection obraId={obraSeleccionada || null} />
              )}

              <AsignarModal />
            </div>
          </div>
        </div>
      );

    case 'editor-gantt':
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVolverADetalle}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Editor de Planificación (Gantt)</h1>
                  <p className="text-gray-600 mt-1">Arrastrá y conectá las tareas para crear el cronograma</p>
                </div>
              </div>
              
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Editor simplificado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor Visual</h3>
            
            <div className="space-y-4">
              {tareas.map((tarea, index) => (
                <div
                  key={tarea.id}
                  className="relative p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{tarea.nombre}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Responsable: {tarea.responsable}</span>
                        <span>Etapa: {tarea.etapa}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded ${
                          tarea.estado === 'Pendiente'
                            ? 'bg-yellow-500'
                            : tarea.estado === 'En curso'
                            ? 'bg-blue-500'
                            : tarea.estado === 'Finalizada'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
  }
}
