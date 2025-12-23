'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Route } from 'next';

import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import ObrasSection from '@/components/cliente/ObrasSection';
import { CuadrillasSection } from '@/components/cliente/CuadrillasSection';
import { ValidarTareasSection } from '@/components/cliente/ValidarTareasSection';
import { CuentaSection } from '@/components/cliente/CuentaSection';
import { TareasSection } from '@/components/cliente/TareasSection';
import { NotificacionesSection } from '@/components/cliente/NotificacionesSection';
import { CalendarioSection } from '@/components/cliente/CalendarioSection';
import { BilleteraSection } from '@/components/cliente/BilleteraSection';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  DollarSign,
  Wrench,
  FileText,
  AlertCircle,
  Users,
} from 'lucide-react';
import type { Database } from '@/lib/types/supabase.gen';

interface DecisionPendiente {
  tipo: 'validacion' | 'presupuesto' | 'cuadrilla' | 'pago';
  titulo: string;
  descripcion: string;
  cantidad: number;
  monto?: number;
  accion: () => void;
  prioridad: 'alta' | 'media' | 'baja';
}

interface EstadoSistema {
  obrasActivas: number;
  obrasPausadas: number;
  tareasEnCurso: number;
  tareasParaValidar: number;
  tareasFinalizadas: number;
  gastadoEsteMes: number;
  pagosPendientes: number;
}

interface EstadoContextual {
  tipo: 'todo-bien' | 'decisiones-pendientes' | 'actividad-en-curso';
  mensaje: string;
  descripcion: string;
}

// Función para formatear el título de la obra
function formatearTituloObra(nombre: string, cliente?: string | null, tipoObra?: string | null): string {
  if (cliente && tipoObra) {
    const tipoCapitalizado = tipoObra
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    const clienteCapitalizado = cliente
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return `${clienteCapitalizado} — ${tipoCapitalizado}`;
  }

  if (nombre.includes('–') || nombre.includes('-')) {
    const partes = nombre.split(/[–-]/).map(p => p.trim());
    if (partes.length >= 2) {
      const tipo = partes[0];
      const clienteNombre = partes.slice(1).join(' ');
      const tipoCapitalizado = tipo
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      const clienteCapitalizado = clienteNombre
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return `${clienteCapitalizado} — ${tipoCapitalizado}`;
    }
  }

  return nombre;
}

// Función para formatear tiempo relativo
function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return 'Sin actividad';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin actividad';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
    return `hace ${Math.floor(diffDays / 30)} meses`;
  } catch {
    return 'Sin actividad';
  }
}

// Función para formatear moneda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Componente Home
function HomeCliente() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  
  const [loading, setLoading] = useState(true);
  const [ultimaActividad, setUltimaActividad] = useState<string | null>(null);
  const [estadoContextual, setEstadoContextual] = useState<EstadoContextual>({
    tipo: 'todo-bien',
    mensaje: 'Todo está bajo control',
    descripcion: '',
  });
  const [decisionUnica, setDecisionUnica] = useState<DecisionPendiente | null>(null);
  const [estadoSistema, setEstadoSistema] = useState<EstadoSistema>({
    obrasActivas: 0,
    obrasPausadas: 0,
    tareasEnCurso: 0,
    tareasParaValidar: 0,
    tareasFinalizadas: 0,
    gastadoEsteMes: 0,
    pagosPendientes: 0,
  });
  const [obrasList, setObrasList] = useState<Array<{id: string; name: string; estado: string}>>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [tareasPorObra, setTareasPorObra] = useState<{
    enCurso: number;
    paraValidar: number;
    completadas: number;
  }>({ enCurso: 0, paraValidar: 0, completadas: 0 });
  const [presupuestoPorObra, setPresupuestoPorObra] = useState<{
    presupuestado: number;
    ejecutado: number;
  }>({ presupuestado: 0, ejecutado: 0 });

  // Cargar datos
  const loadData = useCallback(async () => {
    if (!currentUser?.orgId) {
      setLoading(false);
      return;
    }

    try {
      // Cargar obras
      let query = supabase
        .from('obras')
        .select('id, org_id, name, estado, created_at, updated_at')
        .eq('org_id', currentUser.orgId)
        .order('updated_at', { ascending: false });

      let { data: obrasData, error: obrasError } = await query;
      if (obrasError) throw obrasError;

      const obraIds = ((obrasData as any[]) || []).map(o => o.id);
      const obrasListData = obrasData || [];
      
      // Guardar lista de obras para mostrar
      const obrasFormateadas = obrasListData.map((o: any) => ({
        id: o.id,
        name: o.name || 'Sin nombre',
        estado: o.estado || 'ACTIVA',
      }));
      setObrasList(obrasFormateadas);
      
      // Seleccionar primera obra por defecto si hay obras
      if (obrasFormateadas.length > 0 && !obraSeleccionada) {
        setObraSeleccionada(obrasFormateadas[0].id);
      }

      // Calcular última actividad global
      const ultimasActividades = obrasListData
        .map((o: any) => o.updated_at || o.created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setUltimaActividad(ultimasActividades[0] || null);

      // Cargar tareas
      let tareasData: any[] = [];
      if (obraIds.length > 0) {
        const { data: tareas, error: tareasError } = await supabase
          .from('tareas')
          .select('id, obra_id, estado, cuadrilla_id, updated_at')
          .in('obra_id', obraIds);

        if (!tareasError && tareas) {
          tareasData = tareas;
        }
      }

      // Calcular validaciones pendientes
      let validaciones = 0;
      let montoValidaciones = 0;
      if (tareasData.length > 0) {
        const tareaIds = tareasData.map(t => t.id);
        const { data: subtareasData } = await supabase
          .from('tareas_subtareas')
          .select('id, monto_estimado')
          .in('tarea_id', tareaIds)
          .eq('estado', 'para_validar');
        
        if (subtareasData) {
          validaciones = subtareasData.length;
          montoValidaciones = subtareasData.reduce((sum: number, s: any) => sum + (s.monto_estimado || 0), 0);
        }
      }

      // Determinar estado contextual y decisión única
      let decisionUnicaValue: DecisionPendiente | null = null;
      let estadoContextualValue: EstadoContextual;

      if (validaciones > 0) {
        estadoContextualValue = {
          tipo: 'decisiones-pendientes',
          mensaje: 'Tenés decisiones pendientes',
          descripcion: `Hay ${validaciones} ${validaciones === 1 ? 'trabajo' : 'trabajos'} listo${validaciones !== 1 ? 's' : ''} para validar`,
        };
        decisionUnicaValue = {
          tipo: 'validacion',
          titulo: `${validaciones} ${validaciones === 1 ? 'validación' : 'validaciones'} pendiente${validaciones !== 1 ? 's' : ''}`,
          descripcion: montoValidaciones > 0 
            ? `Monto: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montoValidaciones)}` 
            : 'Hay trabajos listos para revisar',
          cantidad: validaciones,
          monto: montoValidaciones,
          accion: () => router.push('/cliente/validar'),
          prioridad: 'alta',
        };
      } else {
        const tareasEnCurso = tareasData.filter(t => 
          !t.estado?.toLowerCase().includes('finaliz') && 
          !t.estado?.toLowerCase().includes('complet')
        ).length;

        if (tareasEnCurso > 0) {
          estadoContextualValue = {
            tipo: 'actividad-en-curso',
            mensaje: 'Hay trabajos en curso',
            descripcion: `${tareasEnCurso} ${tareasEnCurso === 1 ? 'tarea' : 'tareas'} activa${tareasEnCurso !== 1 ? 's' : ''}`,
          };
        } else {
          estadoContextualValue = {
            tipo: 'todo-bien',
            mensaje: 'Todo está bajo control',
            descripcion: 'No hay acciones pendientes en este momento',
          };
        }
      }

      setEstadoContextual(estadoContextualValue);
      setDecisionUnica(decisionUnicaValue);

      // Calcular estado del sistema
      const obrasActivas = obrasListData.filter((o: any) => o.estado === 'ACTIVA' || o.estado === 'activa').length;
      const obrasPausadas = obrasListData.filter((o: any) => o.estado === 'PAUSADA' || o.estado === 'pausada').length;
      const tareasEnCurso = tareasData.filter((t: any) => 
        !t.estado?.toLowerCase().includes('finaliz') && 
        !t.estado?.toLowerCase().includes('complet')
      ).length;
      const tareasFinalizadas = tareasData.filter((t: any) => 
        t.estado?.toLowerCase().includes('finaliz') || 
        t.estado?.toLowerCase().includes('complet')
      ).length;

      // Calcular gastado este mes (intentar cargar desde pagos si existe la tabla)
      let gastadoEsteMes = 0;
      try {
        const mesActual = new Date();
        mesActual.setDate(1);
        mesActual.setHours(0, 0, 0, 0);
        
        // Intentar cargar pagos desde wallet si existe
        const { data: pagosData } = await supabase
          .from('wallet_movimientos')
          .select('monto, tipo')
          .eq('org_id', currentUser.orgId)
          .gte('created_at', mesActual.toISOString())
          .in('tipo', ['pago', 'gasto']);
        
        if (pagosData) {
          gastadoEsteMes = pagosData
            .filter((p: any) => p.tipo === 'pago' || p.tipo === 'gasto')
            .reduce((sum: number, p: any) => sum + (p.monto || 0), 0);
        }
      } catch {
        // Si no existe la tabla, queda en 0
      }

      // Calcular pagos pendientes (subtareas con estado para_validar que tienen monto)
      const pagosPendientes = montoValidaciones;

      setEstadoSistema({
        obrasActivas,
        obrasPausadas,
        tareasEnCurso,
        tareasParaValidar: validaciones,
        tareasFinalizadas,
        gastadoEsteMes,
        pagosPendientes,
      });

    } catch (error) {
      // Error loading data - silently handle
    } finally {
      setLoading(false);
    }
  }, [currentUser?.orgId, supabase, router, obraSeleccionada]);

  // Cargar datos por obra seleccionada
  useEffect(() => {
    if (!obraSeleccionada || !currentUser?.orgId) return;

    const loadDatosPorObra = async () => {
      try {
        // Cargar tareas de la obra seleccionada
        const { data: tareasObra } = await supabase
          .from('tareas')
          .select('id, estado')
          .eq('obra_id', obraSeleccionada);

        if (tareasObra) {
          const tareaIds = tareasObra.map((t: any) => t.id);
          let enCurso = 0;
          let completadas = 0;
          let paraValidar = 0;

          tareasObra.forEach((t: any) => {
            const estado = (t.estado || '').toLowerCase();
            if (estado.includes('complet') || estado.includes('finaliz')) {
              completadas++;
            } else {
              enCurso++;
            }
          });

          // Contar subtareas para validar
          if (tareaIds.length > 0) {
            const { data: subtareas } = await supabase
              .from('tareas_subtareas')
              .select('id')
              .in('tarea_id', tareaIds)
              .eq('estado', 'para_validar');
            
            if (subtareas) {
              paraValidar = subtareas.length;
            }
          }

          setTareasPorObra({ enCurso, paraValidar, completadas });
        }

        // Cargar presupuesto de la obra (mock por ahora)
        // TODO: Implementar cuando esté disponible en BD
        setPresupuestoPorObra({
          presupuestado: 600000, // Mock
          ejecutado: 350000, // Mock
        });

      } catch (error) {
        // Error loading - silently handle
      }
    };

    loadDatosPorObra();
  }, [obraSeleccionada, currentUser?.orgId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCrearObra = () => {
    router.push('/cliente/obras/nueva');
  };

  const handleCrearTarea = () => {
    router.push('/cliente/dashboard?section=tareas');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Datos mock para 6 obras con sus gráficos asociados
  const mockData = {
    obras: [
      { 
        id: '1', 
        name: 'Casa familiar – Aquiles Bailo', 
        estado: 'ACTIVA',
        tareas: { 
          enCurso: 8, 
          paraValidar: 2, 
          completadas: 58,
          bloqueadas: 0,
          total: 68,
          vencidas: 3,
          proximas7d: 9,
          ritmoPromedio: 3.1,
          weeklyCompleted: [0,1,2,2,3,1,4,2,3,2,4,3,2,3,4,2,3,4,2,3,2,2,1,0],
          last2WeeksCompleted: 3,
          prev2WeeksCompleted: 2,
        },
        presupuesto: { presupuestado: 600000, ejecutado: 350000 },
        presupuestoSemanal: [
          { semana: 1, proyectado: 20000, ejecutado: 18000, tareasPagadas: 2 },
          { semana: 2, proyectado: 25000, ejecutado: 22000, tareasPagadas: 3 },
          { semana: 3, proyectado: 28000, ejecutado: 27000, tareasPagadas: 3 },
          { semana: 4, proyectado: 30000, ejecutado: 29000, tareasPagadas: 4 },
          { semana: 5, proyectado: 32000, ejecutado: 30000, tareasPagadas: 4 },
          { semana: 6, proyectado: 30000, ejecutado: 0, tareasPagadas: 0 }, // Semana sin ejecución
          { semana: 7, proyectado: 28000, ejecutado: 0, tareasPagadas: 0 }, // Semana sin ejecución (bloque parado)
          { semana: 8, proyectado: 35000, ejecutado: 32000, tareasPagadas: 5 },
          { semana: 9, proyectado: 30000, ejecutado: 28000, tareasPagadas: 4 },
          { semana: 10, proyectado: 28000, ejecutado: 26000, tareasPagadas: 4 },
          { semana: 11, proyectado: 27000, ejecutado: 26000, tareasPagadas: 4 },
          { semana: 12, proyectado: 26000, ejecutado: 25000, tareasPagadas: 3 },
          { semana: 13, proyectado: 25000, ejecutado: 0, tareasPagadas: 0 }, // Semana sin ejecución
          { semana: 14, proyectado: 30000, ejecutado: 28000, tareasPagadas: 4 },
          { semana: 15, proyectado: 28000, ejecutado: 27000, tareasPagadas: 4 },
          { semana: 16, proyectado: 24000, ejecutado: 23000, tareasPagadas: 3 },
          { semana: 17, proyectado: 22000, ejecutado: 21000, tareasPagadas: 3 },
          { semana: 18, proyectado: 20000, ejecutado: 20000, tareasPagadas: 2 },
          { semana: 19, proyectado: 18000, ejecutado: 17000, tareasPagadas: 2 },
          { semana: 20, proyectado: 16000, ejecutado: 0, tareasPagadas: 0 }, // Semana sin ejecución
          { semana: 21, proyectado: 15000, ejecutado: 14000, tareasPagadas: 1 },
          { semana: 22, proyectado: 14000, ejecutado: 12000, tareasPagadas: 1 },
          { semana: 23, proyectado: 13000, ejecutado: 12000, tareasPagadas: 1 },
          { semana: 24, proyectado: 12000, ejecutado: 10000, tareasPagadas: 1 },
        ],
        actividad: {
          tareasCompletadasPorSemana: [
            // Inicio lento
            { semana: 1, completadas: 1 },
            { semana: 2, completadas: 3 },
            { semana: 3, completadas: 5 },
            { semana: 4, completadas: 8 },
            // Aceleración en semanas medias
            { semana: 5, completadas: 11 },
            { semana: 6, completadas: 14 },
            { semana: 7, completadas: 17 },
            { semana: 8, completadas: 21 },
            { semana: 9, completadas: 25 },
            { semana: 10, completadas: 29 },
            { semana: 11, completadas: 33 },
            { semana: 12, completadas: 37 },
            { semana: 13, completadas: 41 },
            { semana: 14, completadas: 45 },
            { semana: 15, completadas: 49 },
            // Estabilización hacia el final
            { semana: 16, completadas: 52 },
            { semana: 17, completadas: 54 },
            { semana: 18, completadas: 56 },
            { semana: 19, completadas: 57 },
            { semana: 20, completadas: 58 },
            { semana: 21, completadas: 59 },
            { semana: 22, completadas: 60 },
          ],
          actividadProyectada: [
            // Crecimiento más lineal, ligeramente por encima del real
            { semana: 1, proyectado: 2 },
            { semana: 2, proyectado: 4 },
            { semana: 3, proyectado: 6 },
            { semana: 4, proyectado: 9 },
            { semana: 5, proyectado: 12 },
            { semana: 6, proyectado: 15 },
            { semana: 7, proyectado: 18 },
            { semana: 8, proyectado: 21 },
            { semana: 9, proyectado: 24 },
            { semana: 10, proyectado: 27 },
            { semana: 11, proyectado: 30 },
            { semana: 12, proyectado: 33 },
            { semana: 13, proyectado: 36 },
            { semana: 14, proyectado: 39 },
            { semana: 15, proyectado: 42 },
            { semana: 16, proyectado: 45 },
            { semana: 17, proyectado: 48 },
            { semana: 18, proyectado: 51 },
            { semana: 19, proyectado: 54 },
            { semana: 20, proyectado: 57 },
            { semana: 21, proyectado: 59 },
            { semana: 22, proyectado: 60 },
          ],
          milestones: [
            { semana: 1, nombre: 'Inicio de obra' },
            { semana: 8, nombre: 'Obra gris' },
            { semana: 14, nombre: 'Instalaciones' },
            { semana: 19, nombre: 'Terminaciones' },
          ],
          insight: 'success', // 'success' | 'warning' | 'error'
        },
      },
      { 
        id: '2', 
        name: 'Departamento Centro', 
        estado: 'PAUSADA',
        tareas: { 
          enCurso: 9, 
          paraValidar: 3, 
          completadas: 20,
          bloqueadas: 2,
          total: 34,
          vencidas: 5,
          proximas7d: 6,
          ritmoPromedio: 1.4,
          weeklyCompleted: [0,1,0,1,2,1,1,1,2,0,2,1,1,0,2,1,1,2,1,0,1,0,0,0],
          last2WeeksCompleted: 1,
          prev2WeeksCompleted: 2,
        },
        presupuesto: { presupuestado: 450000, ejecutado: 280000 },
        actividad: {
          tareasCompletadasPorSemana: [
            { semana: 1, completadas: 1 },
            { semana: 2, completadas: 2 },
            { semana: 3, completadas: 3 },
            { semana: 4, completadas: 5 },
          ],
          actividadProyectada: [
            { semana: 1, proyectado: 2 },
            { semana: 2, proyectado: 4 },
            { semana: 3, proyectado: 5 },
            { semana: 4, proyectado: 7 },
          ],
          insight: 'error', // Obra pausada, por debajo de lo proyectado
        },
      },
      { 
        id: '3', 
        name: 'Casa verano', 
        estado: 'FINALIZADA',
        tareas: { enCurso: 0, paraValidar: 0, completadas: 12 },
        presupuesto: { presupuestado: 800000, ejecutado: 750000 },
        actividad: {
          tareasCompletadasPorSemana: [
            { semana: 1, completadas: 2 },
            { semana: 2, completadas: 4 },
            { semana: 3, completadas: 7 },
            { semana: 4, completadas: 9 },
            { semana: 5, completadas: 11 },
            { semana: 6, completadas: 12 },
          ],
          actividadProyectada: [
            { semana: 1, proyectado: 2 },
            { semana: 2, proyectado: 4 },
            { semana: 3, proyectado: 7 },
            { semana: 4, proyectado: 10 },
            { semana: 5, proyectado: 11 },
            { semana: 6, proyectado: 12 },
          ],
          insight: 'success', // Obra finalizada según plan
        },
      },
      { 
        id: '4', 
        name: 'Oficina Comercial', 
        estado: 'ACTIVA',
        tareas: { enCurso: 6, paraValidar: 3, completadas: 4 },
        presupuesto: { presupuestado: 1200000, ejecutado: 890000 },
        actividad: {
          tareasCompletadasPorSemana: [
            { semana: 1, completadas: 1 },
            { semana: 2, completadas: 2 },
            { semana: 3, completadas: 3 },
            { semana: 4, completadas: 4 },
            { semana: 5, completadas: 4 },
          ],
          actividadProyectada: [
            { semana: 1, proyectado: 1 },
            { semana: 2, proyectado: 2 },
            { semana: 3, proyectado: 3 },
            { semana: 4, proyectado: 4 },
            { semana: 5, proyectado: 5 },
          ],
          insight: 'warning', // El ritmo disminuyó
        },
      },
      { 
        id: '5', 
        name: 'Edificio Residencial', 
        estado: 'PAUSADA',
        tareas: { enCurso: 1, paraValidar: 2, completadas: 8 },
        presupuesto: { presupuestado: 2500000, ejecutado: 1200000 },
        actividad: {
          tareasCompletadasPorSemana: [
            { semana: 1, completadas: 2 },
            { semana: 2, completadas: 4 },
            { semana: 3, completadas: 6 },
            { semana: 4, completadas: 8 },
          ],
          actividadProyectada: [
            { semana: 1, proyectado: 2 },
            { semana: 2, proyectado: 5 },
            { semana: 3, proyectado: 7 },
            { semana: 4, proyectado: 9 },
          ],
          insight: 'error', // Por debajo de lo proyectado, obra pausada
        },
      },
      { 
        id: '6', 
        name: 'Refacción Local', 
        estado: 'ACTIVA',
        tareas: { enCurso: 3, paraValidar: 1, completadas: 6 },
        presupuesto: { presupuestado: 350000, ejecutado: 320000 },
        actividad: {
          tareasCompletadasPorSemana: [
            { semana: 1, completadas: 1 },
            { semana: 2, completadas: 3 },
            { semana: 3, completadas: 5 },
            { semana: 4, completadas: 6 },
            { semana: 5, completadas: 6 },
          ],
          actividadProyectada: [
            { semana: 1, proyectado: 1 },
            { semana: 2, proyectado: 3 },
            { semana: 3, proyectado: 5 },
            { semana: 4, proyectado: 6 },
            { semana: 5, proyectado: 7 },
          ],
          insight: 'warning', // Ligero retraso
        },
      },
    ],
  };

  return (
    <DashboardFinal 
      mockData={mockData}
      formatCurrency={formatCurrency}
      router={router}
      handleCrearObra={handleCrearObra}
      handleCrearTarea={handleCrearTarea}
    />
  );
}

// ============================================
// COMPONENTES AUXILIARES (REUTILIZABLES)
// ============================================

// Componente unificado para selector de período
function PeriodSelector({
  rangoTemporal,
  totalSemanas,
  onPeriodChange,
  className = ""
}: {
  rangoTemporal: number;
  totalSemanas: number;
  onPeriodChange: (periodo: number) => void;
  className?: string;
}) {
  const periodos = [4, 8, 12, totalSemanas];
  
  return (
    <div className={`flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200 ${className}`}>
      {periodos.map((semanasValue) => (
        <button
          key={semanasValue}
          onClick={() => onPeriodChange(semanasValue)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            rangoTemporal === semanasValue
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {semanasValue === totalSemanas ? 'Total obra' : `${semanasValue} sem`}
        </button>
      ))}
    </div>
  );
}

function TasksChart({ 
  tareas, 
  rangoTemporal,
  obraId,
  onSegmentClick
}: { 
  tareas: { 
    enCurso: number; 
    paraValidar: number; 
    completadas: number;
    bloqueadas?: number;
    total?: number;
    vencidas?: number;
    proximas7d?: number;
    ritmoPromedio?: number;
    weeklyCompleted?: number[];
    last2WeeksCompleted?: number;
    prev2WeeksCompleted?: number;
  };
  rangoTemporal?: number;
  obraId?: string;
  onSegmentClick?: (estado: string) => void;
}) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  // Valores por defecto si no están en tareas
  const bloqueadas = tareas.bloqueadas || 0;
  const total = tareas.total || (tareas.enCurso + tareas.paraValidar + tareas.completadas + bloqueadas);
  const vencidas = tareas.vencidas || 0;
  const proximas7d = tareas.proximas7d || 0;
  const ritmoPromedio = tareas.ritmoPromedio || 0;
  const weeklyCompleted = tareas.weeklyCompleted || [];
  const last2WeeksCompleted = tareas.last2WeeksCompleted || 0;
  const prev2WeeksCompleted = tareas.prev2WeeksCompleted || 0;
  const deltaCompletadas = last2WeeksCompleted - prev2WeeksCompleted;
  
  // Calcular porcentajes
  const circunferencia = 2 * Math.PI * 50; // Radio 50 para donut más grande
  const completadasPct = total > 0 ? tareas.completadas / total : 0;
  const enCursoPct = total > 0 ? tareas.enCurso / total : 0;
  const paraValidarPct = total > 0 ? tareas.paraValidar / total : 0;
  const bloqueadasPct = total > 0 ? bloqueadas / total : 0;
  
  // Colores profesionales y sutiles
  const colors = {
    completadas: '#10B981', // verde emerald-500
    enCurso: '#3B82F6', // azul blue-500
    paraValidar: '#F59E0B', // amarillo amber-500
    bloqueadas: '#EF4444', // rojo red-500
    background: '#F3F4F6' // gris muy claro
  };
  
  // Calcular offsets para segmentos del donut
  const segmentos = [
    { nombre: 'completadas', pct: completadasPct, color: colors.completadas, cantidad: tareas.completadas, offset: 0 },
    { nombre: 'enCurso', pct: enCursoPct, color: colors.enCurso, cantidad: tareas.enCurso, offset: completadasPct },
    { nombre: 'paraValidar', pct: paraValidarPct, color: colors.paraValidar, cantidad: tareas.paraValidar, offset: completadasPct + enCursoPct },
  ];
  
  // Solo agregar bloqueadas si > 0
  if (bloqueadas > 0) {
    segmentos.push({ 
      nombre: 'bloqueadas', 
      pct: bloqueadasPct, 
      color: colors.bloqueadas, 
      cantidad: bloqueadas, 
      offset: completadasPct + enCursoPct + paraValidarPct 
    });
  }
  
  // Calcular micro-insight
  const totalTrabadas = tareas.paraValidar + bloqueadas;
  let insightTexto = 'Flujo estable: buen ritmo de avance.';
  let insightColor = 'text-emerald-600';
  
  if (vencidas > 0) {
    insightTexto = `Tenés ${vencidas} tarea${vencidas > 1 ? 's' : ''} vencida${vencidas > 1 ? 's' : ''}.`;
    insightColor = vencidas > 3 ? 'text-red-600' : 'text-amber-600';
  } else if (totalTrabadas > 3) {
    insightTexto = 'Hay tareas trabadas: revisá validaciones.';
    insightColor = 'text-amber-600';
  }
  
  
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Donut Principal */}
        <div className="relative flex-shrink-0">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90" width="128" height="128" viewBox="0 0 128 128">
              {/* Fondo */}
              <circle cx="64" cy="64" r="50" fill="none" stroke={colors.background} strokeWidth="12" />
              
              {/* Segmentos del donut */}
              {segmentos.map((seg, idx) => {
                if (seg.pct <= 0) return null;
                const dashArray = `${seg.pct * circunferencia} ${circunferencia}`;
                const dashOffset = `-${seg.offset * circunferencia}`;
                
                return (
                  <circle
                    key={seg.nombre}
                    cx="64"
                    cy="64"
                    r="50"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-opacity"
                    style={{ 
                      opacity: hoveredSegment === null || hoveredSegment === seg.nombre ? 1 : 0.3
                    }}
                    onMouseEnter={(e) => {
                      setHoveredSegment(seg.nombre);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                      if (svgRect) {
                        setTooltipPos({
                          x: e.clientX - svgRect.left,
                          y: e.clientY - svgRect.top
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredSegment(null);
                      setTooltipPos(null);
                    }}
                    onClick={() => {
                      if (onSegmentClick) {
                        const estadoMap: { [key: string]: string } = {
                          completadas: 'completadas',
                          enCurso: 'en_curso',
                          paraValidar: 'para_validar',
                          bloqueadas: 'bloqueadas'
                        };
                        onSegmentClick(estadoMap[seg.nombre] || seg.nombre);
                      }
                    }}
                  />
                );
              })}
            </svg>
            
            {/* Centro del donut - texto informativo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xs text-gray-500 font-medium mb-0.5">Total</div>
              <div className="text-2xl font-semibold text-gray-900">{total}</div>
              {deltaCompletadas !== 0 && (
                <div className="text-[10px] text-gray-500 mt-0.5">
                  últ. 2 sem:
                  <span className={`font-semibold ml-1 ${deltaCompletadas >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {deltaCompletadas >= 0 ? '+' : ''}{deltaCompletadas}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Tooltip en hover */}
          {hoveredSegment && tooltipPos && (() => {
            const seg = segmentos.find(s => s.nombre === hoveredSegment);
            if (!seg) return null;
            return (
              <div
                className="absolute z-50 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-2 pointer-events-none min-w-[140px]"
                style={{
                  left: `${tooltipPos.x + 10}px`,
                  top: `${tooltipPos.y - 10}px`,
                  transform: 'translateY(-100%)'
                }}
              >
                <div className="text-xs font-semibold text-gray-300 mb-1 capitalize">
                  {hoveredSegment === 'enCurso' ? 'En curso' : 
                   hoveredSegment === 'paraValidar' ? 'Para validar' : 
                   hoveredSegment}
                </div>
                <div className="text-xs text-gray-400">
                  <div>Cantidad: <span className="font-semibold text-white">{seg.cantidad}</span></div>
                  <div>% sobre total: <span className="font-semibold text-white">{(seg.pct * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            );
          })()}
        </div>
        
        {/* Panel lateral - resumen accionable */}
        <div className="flex-1 space-y-3">
          {/* Lista de estados con links */}
          <div className="space-y-2">
            {/* En curso */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.enCurso }} />
                <span className="text-xs font-medium text-gray-700">En curso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{tareas.enCurso}</span>
                <button
                  onClick={() => obraId && onSegmentClick?.('en_curso')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Ver →
                </button>
              </div>
            </div>
            
            {/* Para validar */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.paraValidar }} />
                <span className="text-xs font-medium text-gray-700">Para validar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{tareas.paraValidar}</span>
                {tareas.paraValidar > 0 && (
                  <button
                    onClick={() => obraId && onSegmentClick?.('para_validar')}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Revisar →
                  </button>
                )}
              </div>
            </div>
            
            {/* Completadas */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.completadas }} />
                <span className="text-xs font-medium text-gray-700">Completadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{tareas.completadas}</span>
                <button
                  onClick={() => obraId && onSegmentClick?.('completadas')}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Historial →
                </button>
              </div>
            </div>
            
            {/* Bloqueadas (solo si > 0) */}
            {bloqueadas > 0 && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bloqueadas }} />
                  <span className="text-xs font-medium text-gray-700">Bloqueadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{bloqueadas}</span>
                  <button
                    onClick={() => obraId && onSegmentClick?.('bloqueadas')}
                    className="text-xs text-red-600 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Resolver →
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Métricas adicionales */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            {vencidas > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Tareas vencidas</span>
                <span className={`text-xs font-semibold ${vencidas > 3 ? 'text-red-600' : 'text-amber-600'}`}>
                  {vencidas}
                </span>
              </div>
            )}
            {proximas7d > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Próximas 7 días</span>
                <span className="text-xs font-semibold text-blue-600">{proximas7d}</span>
              </div>
            )}
            {ritmoPromedio > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Ritmo (promedio)</span>
                <span className="text-xs font-medium text-gray-700">{ritmoPromedio.toFixed(1)} tareas/sem</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Micro-insights (banda inferior) */}
      <div className={`pt-2 border-t border-gray-100 text-xs font-medium ${insightColor}`}>
        {insightTexto}
      </div>
    </div>
  );
}

function ActivityChart({ actividad, rangoTemporal, onHover, hoveredSemana }: { 
  actividad: { tareasCompletadasPorSemana: Array<{ semana: number; completadas: number }>; actividadProyectada: Array<{ semana: number; proyectado: number }>; insight?: 'success' | 'warning' | 'error'; milestones?: Array<{ semana: number; nombre: string }> };
  rangoTemporal: number;
  onHover?: (semana: number | null) => void;
  hoveredSemana?: number | null;
}) {
  const { tareasCompletadasPorSemana, actividadProyectada, insight = 'success', milestones = [] } = actividad;
  const semanas = tareasCompletadasPorSemana.map(t => t.semana);
  const completadas = tareasCompletadasPorSemana.map(t => t.completadas);
  const proyectado = actividadProyectada.map(t => t.proyectado);
  
  // Estado para tooltip local
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredHito, setHoveredHito] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  // Filtrar datos según rango temporal seleccionado - CORRECCIÓN: mostrar ÚLTIMAS semanas
  const totalSemanas = semanas.length;
  const inicioSlice = rangoTemporal >= totalSemanas 
    ? 0 
    : totalSemanas - rangoTemporal;
  
  const semanasFiltradas = semanas.slice(inicioSlice);
  const completadasFiltradas = completadas.slice(inicioSlice);
  const proyectadoFiltradas = proyectado.slice(inicioSlice);
  
  // Calcular máximo entre serie real y planificada (del rango filtrado)
  const maxReal = Math.max(...completadasFiltradas, 0);
  const maxPlanificado = Math.max(...proyectadoFiltradas, 0);
  const maxAbsoluto = Math.max(maxReal, maxPlanificado);
  // Tope = max + 5-10% (usamos 7.5% para margen apropiado)
  const maxTareas = maxAbsoluto * 1.075;
  const minTareas = 0;
  const rangoTareas = maxTareas - minTareas;
  
  // Calcular semana actual (última semana con datos reales)
  const semanaActual = semanas.length;
  
  // Usar datos filtrados para los cálculos
  const semanasParaGrafico = semanasFiltradas;
  const completadasParaGrafico = completadasFiltradas;
  const proyectadoParaGrafico = proyectadoFiltradas;
  
  // Simplificar ticks del eje Y (0, 20, 40, 60)
  const ticksY = [];
  const step = Math.ceil(maxTareas / 60) * 20; // Redondea a múltiplos de 20
  for (let i = 0; i <= Math.ceil(maxTareas / step); i++) {
    const value = i * step;
    if (value <= maxTareas) {
      ticksY.push(value);
    }
  }
  if (ticksY[ticksY.length - 1] < maxTareas) {
    ticksY.push(Math.ceil(maxTareas / 20) * 20); // Redondea hacia arriba
  }
  
  // Dimensiones del gráfico (en porcentajes del viewBox)
  // El eje X debe ser el doble que el Y
  const viewBoxWidth = 200; // Doble del height para que X sea 2x Y
  const viewBoxHeight = 100;
  const paddingLeft = 14; // Más espacio para etiquetas del eje Y
  const paddingRight = 6;
  const paddingTop = 10;
  const paddingBottom = 18; // Más espacio para etiquetas del eje X
  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;
  
  // Calcular puntos de la línea proyectada (usando datos filtrados)
  const puntosProyectados = proyectadoParaGrafico.map((cantidad, index) => {
    const x = paddingLeft + (index / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((cantidad - minTareas) / rangoTareas) * chartHeight;
    return { x, y, cantidad };
  });
  
  // Calcular puntos de la línea de tareas completadas (usando datos filtrados)
  const puntosTareas = completadasParaGrafico.map((cantidad, index) => {
    const x = paddingLeft + (index / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((cantidad - minTareas) / rangoTareas) * chartHeight;
    return { x, y, cantidad };
  });
  
  // Crear path para la línea proyectada
  const pathProyectado = puntosProyectados.reduce((acc, punto, index) => {
    if (index === 0) {
      return `M ${punto.x} ${punto.y}`;
    }
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');
  
  // Crear path para la línea real
  const pathTareas = puntosTareas.reduce((acc, punto, index) => {
    if (index === 0) {
      return `M ${punto.x} ${punto.y}`;
    }
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');
  
  // Primer punto para el área
  const primerPunto = puntosTareas[0];
  // Último punto
  const ultimoPunto = puntosTareas[puntosTareas.length - 1];
  const tareasActuales = completadas[completadas.length - 1];
  
  // Path del área bajo la línea (cierra desde el último punto hasta el primer punto pasando por la base)
  const pathArea = `${pathTareas} L ${ultimoPunto.x} ${paddingTop + chartHeight} L ${primerPunto.x} ${paddingTop + chartHeight} Z`;
  
  // ID único para el gradiente del área (verde suave tipo Google Finance)
  const gradientId = `activityGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calcular total de tareas acumuladas (del rango completo, no filtrado)
  const totalTareas = completadas[completadas.length - 1] || 0;
  const totalPlanificado = proyectado[proyectado.length - 1] || 0;
  
  // 1. DESVÍO ACTUAL
  const desvioActual = totalTareas - totalPlanificado;
  let desvioColor = 'text-emerald-600';
  let desvioEstado: 'success' | 'warning' | 'error' = 'success';
  if (desvioActual >= 0 && desvioActual >= -2) {
    desvioColor = 'text-emerald-600';
    desvioEstado = 'success';
  } else if (desvioActual >= -6) {
    desvioColor = 'text-amber-600';
    desvioEstado = 'warning';
  } else {
    desvioColor = 'text-red-600';
    desvioEstado = 'error';
  }
  
  // 2. PROYECCIÓN DE FECHA DE FIN
  // Calcular ritmo promedio real (últimas 4 semanas)
  const ultimasSemanas = Math.min(4, completadas.length);
  const tareasUltimasSemanas = completadas.slice(-ultimasSemanas);
  const ritmoReal = ultimasSemanas > 1 
    ? (tareasUltimasSemanas[ultimasSemanas - 1] - tareasUltimasSemanas[0]) / (ultimasSemanas - 1)
    : 2.4; // Fallback
  
  // Extender línea real 3 semanas más
  const semanasProyeccion = 3;
  const semanaFinPlanificado = semanas.length;
  const tareasRestantes = totalPlanificado - totalTareas;
  const semanasEstimadas = ritmoReal > 0 ? Math.max(1, Math.ceil(tareasRestantes / ritmoReal)) : semanasProyeccion;
  const semanaFinEstimada = semanaActual + semanasEstimadas;
  
  // Puntos proyectados (extensión de la línea real)
  const puntosProyeccion = [];
  for (let i = 1; i <= semanasProyeccion; i++) {
    const semana = semanaActual + i;
    const tareasProyectadas = totalTareas + (ritmoReal * i);
    // Calcular X considerando el viewBox completo (incluyendo proyección)
    const maxSemanas = semanas.length + semanasProyeccion;
    const x = paddingLeft + ((semana - 1) / Math.max(maxSemanas - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((tareasProyectadas - minTareas) / rangoTareas) * chartHeight;
    puntosProyeccion.push({ x, y, semana, tareas: tareasProyectadas });
  }
  
  // Path para la proyección (línea discontinua, conectada desde el último punto real)
  const pathProyeccion = puntosProyeccion.length > 0
    ? `M ${ultimoPunto.x} ${ultimoPunto.y} ${puntosProyeccion.map(p => `L ${p.x} ${p.y}`).join(' ')}`
    : '';
  
  // Calcular tareas ejecutadas por semana (para el tooltip)
  const tareasPorSemana = completadasParaGrafico.map((acum, index) => {
    if (index === 0) return acum;
    return acum - completadasParaGrafico[index - 1];
  });
  
  // Calcular ritmo comparativo (últimas 4 semanas vs anteriores)
  const ultimasSemanasCount = Math.min(4, completadas.length);
  const semanasAnterioresCount = Math.min(4, completadas.length - ultimasSemanasCount);
  
  let ritmoUltimas4 = 0;
  let ritmoAnteriores = 0;
  
  if (ultimasSemanasCount > 1) {
    const inicioUltimas = completadas.length - ultimasSemanasCount;
    ritmoUltimas4 = (completadas[completadas.length - 1] - completadas[inicioUltimas]) / (ultimasSemanasCount - 1);
  }
  
  if (semanasAnterioresCount > 1 && completadas.length > ultimasSemanasCount) {
    const inicioAnteriores = completadas.length - ultimasSemanasCount - semanasAnterioresCount;
    const finAnteriores = completadas.length - ultimasSemanasCount;
    ritmoAnteriores = (completadas[finAnteriores - 1] - completadas[inicioAnteriores]) / (semanasAnterioresCount - 1);
  }
  
  const diferenciaRitmo = ritmoUltimas4 - ritmoAnteriores;
  let ritmoTendencia = '→';
  let ritmoTexto = 'Ritmo estable';
  let ritmoColor = 'text-amber-600';
  
  if (Math.abs(diferenciaRitmo) < 0.1) {
    ritmoTendencia = '→';
    ritmoTexto = 'Ritmo estable';
    ritmoColor = 'text-amber-600';
  } else if (diferenciaRitmo > 0) {
    ritmoTendencia = '↑';
    ritmoTexto = `Ritmo en aumento (+${diferenciaRitmo.toFixed(1)} tareas/sem)`;
    ritmoColor = 'text-emerald-600';
  } else {
    ritmoTendencia = '↓';
    ritmoTexto = `Ritmo en baja (${diferenciaRitmo.toFixed(1)} tareas/sem)`;
    ritmoColor = 'text-red-600';
  }
  
  // Calcular estado del avance (para indicador abajo a la derecha)
  const diferencia = totalTareas - totalPlanificado;
  let estadoTexto = 'Dentro del plan';
  let estadoColor = 'text-emerald-600';
  if (diferencia < -6) {
    estadoTexto = 'Retraso acumulado';
    estadoColor = 'text-red-600';
  } else if (diferencia < -2) {
    estadoTexto = 'Requiere atención';
    estadoColor = 'text-amber-600';
  } else if (diferencia > 2) {
    estadoTexto = 'Adelanto';
    estadoColor = 'text-emerald-600';
  }
  
  // Agregar semana actual como hito
  const todosLosHitos = [
    ...milestones,
    { semana: semanaActual, nombre: 'Semana actual' }
  ];
  
  // Calcular puntos de hitos (milestones) en el rango visible
  const puntosHitos = todosLosHitos
    .filter(m => semanasParaGrafico.includes(m.semana))
    .map(milestone => {
      const index = semanasParaGrafico.indexOf(milestone.semana);
      if (index === -1) return null;
      const punto = puntosTareas[index];
      return { ...punto, nombre: milestone.nombre, semana: milestone.semana };
    })
    .filter(p => p !== null);
  
  // Calcular flecha de tendencia (dirección del último tramo)
  const ultimosTramos = puntosTareas.slice(-2);
  const tieneAceleracion = ultimosTramos.length === 2 && 
    ultimosTramos[1].y < ultimosTramos[0].y; // Y menor = más alto = más tareas
  
  // 3. RITMO PROMEDIO
  const ritmoPlanificado = semanas.length > 0 ? totalPlanificado / semanas.length : 0;
  const ritmoRealPromedio = semanas.length > 0 ? totalTareas / semanas.length : 0;
  const tendenciaRitmo = ritmoRealPromedio >= ritmoPlanificado ? '↑' : '↓';
  
  // 4. INSIGHT AUTOMÁTICO MEJORADO
  const ultimaReal = completadas[completadas.length - 1] || 0;
  const ultimaPlanificada = proyectado[proyectado.length - 1] || 0;
  // Nota: diferencia ya está declarada arriba, usar esa
  const porcentajeDiferencia = ultimaPlanificada > 0 ? (diferencia / ultimaPlanificada) * 100 : 0;
  
  // Detectar desde cuándo hay retraso
  let semanaInicioRetraso: number | null = null;
  for (let i = 0; i < completadas.length; i++) {
    if (completadas[i] < proyectado[i] - 2) {
      semanaInicioRetraso = i + 1;
      break;
    }
  }
  
  let insightCalculado: 'success' | 'warning' | 'error' = 'success';
  let insightTexto = 'La obra mantiene un avance estable y dentro del plan.';
  if (porcentajeDiferencia < -10 || desvioActual < -6) {
    insightCalculado = 'error';
    insightTexto = semanaInicioRetraso 
      ? `El atraso comenzó a partir de la semana ${semanaInicioRetraso}.`
      : 'Retraso acumulado en el cronograma.';
  } else if (porcentajeDiferencia < -3 || (desvioActual < -2 && desvioActual >= -6)) {
    insightCalculado = 'warning';
    insightTexto = 'Se detecta una leve desaceleración en las últimas semanas.';
  } else {
    insightCalculado = 'success';
    insightTexto = 'La obra mantiene un avance estable y dentro del plan.';
  }

  return (
    <div className="space-y-4 w-full">
      {/* Gráfico */}
      <div className="relative w-full" style={{ height: '380px', width: '100%' }}>
        <svg 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ display: 'block' }}
        >
          {/* Definiciones */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#16a34a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid horizontal (muy sutil, casi imperceptible) */}
          {ticksY.map((value, index) => {
            const y = paddingTop + chartHeight - ((value - minTareas) / rangoTareas) * chartHeight;
            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="0.2"
                  opacity="0.3"
                />
                <text
                  x={paddingLeft - 3.5}
                  y={y + 0.5}
                  fontSize="2"
                  fill="#9CA3AF"
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontWeight="300"
                >
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* Eje Y y Eje X (muy sutiles) */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="0.2"
            opacity="0.4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={paddingLeft + chartWidth}
            y2={paddingTop + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="0.2"
            opacity="0.4"
          />
          
          {/* Área bajo la línea real (degradado verde suave tipo Google Finance) */}
          <path
            d={pathArea}
            fill={`url(#${gradientId})`}
          />
          
          {/* Línea vertical para semana actual con label (solo si está en el rango visible) */}
          {semanaActual > 0 && semanasParaGrafico.includes(semanaActual) && (
            <g>
              <line
                x1={paddingLeft + ((semanasParaGrafico.indexOf(semanaActual)) / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth}
                y1={paddingTop}
                x2={paddingLeft + ((semanasParaGrafico.indexOf(semanaActual)) / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth}
                y2={paddingTop + chartHeight}
                stroke="#6366F1"
                strokeWidth="0.5"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              {/* Label "Semana actual" arriba */}
              <text
                x={paddingLeft + ((semanasParaGrafico.indexOf(semanaActual)) / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth}
                y={paddingTop - 2}
                fontSize="2"
                fill="#6366F1"
                textAnchor="middle"
                dominantBaseline="hanging"
                fontWeight="500"
                opacity="0.7"
              >
                Semana actual
              </text>
            </g>
          )}
          
          {/* Etiquetas del eje X (semanas) - mostrar semanas del rango filtrado */}
          {(() => {
            // Mostrar primera, última y algunas intermedias del rango visible
            const primeraSemana = semanasParaGrafico[0];
            const ultimaSemana = semanasParaGrafico[semanasParaGrafico.length - 1];
            const semanasAMostrar = [primeraSemana];
            
            // Agregar semanas intermedias si hay espacio
            if (semanasParaGrafico.length > 8) {
              const medio1 = semanasParaGrafico[Math.floor(semanasParaGrafico.length / 3)];
              const medio2 = semanasParaGrafico[Math.floor(semanasParaGrafico.length * 2 / 3)];
              semanasAMostrar.push(medio1, medio2);
            } else if (semanasParaGrafico.length > 4) {
              const medio = semanasParaGrafico[Math.floor(semanasParaGrafico.length / 2)];
              semanasAMostrar.push(medio);
            }
            
            semanasAMostrar.push(ultimaSemana);
            
            // Eliminar duplicados
            const semanasUnicas = [...new Set(semanasAMostrar)];
            
            return semanasUnicas.map((semana) => {
              const index = semanasParaGrafico.indexOf(semana);
              if (index === -1) return null;
              const x = paddingLeft + (index / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth;
              return (
                <g key={semana}>
                  <line
                    x1={x}
                    y1={paddingTop + chartHeight}
                    x2={x}
                    y2={paddingTop + chartHeight + 1.5}
                    stroke="#E5E7EB"
                    strokeWidth="0.3"
                    opacity="0.5"
                  />
                  <text
                    x={x}
                    y={paddingTop + chartHeight + 4.5}
                    fontSize="2.5"
                    fill="#6B7280"
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontWeight="400"
                  >
                    S{semana}
                  </text>
                </g>
              );
            });
          })()}
          
          {/* Línea proyectada (planificada - gris claro, discontinua, fina y sutil) */}
          <path
            d={pathProyectado}
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
          
          {/* Línea de tareas completadas (real - verde sólido, muy fina estilo fintech) */}
          <path
            d={pathTareas}
            stroke="#16a34a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Resaltar semana hovered (desde presupuesto) - solo si no es un hito */}
          {hoveredSemana && !hoveredHito && semanasParaGrafico.includes(hoveredSemana) && (
            (() => {
              const index = semanasParaGrafico.indexOf(hoveredSemana);
              const punto = puntosTareas[index];
              if (!punto) return null;
              return (
                <circle
                  cx={punto.x}
                  cy={punto.y}
                  r="6"
                  fill="#3B82F6"
                  opacity="0.2"
                />
              );
            })()
          )}
          
          {/* Hitos de obra (milestones) - marcadores circulares azules/violetas */}
          {puntosHitos.map((hito, index) => {
            if (!hito) return null;
            const esActual = hito.semana === semanaActual;
            const esHovered = hoveredSemana === hito.semana;
            return (
              <g key={`hito-${hito.semana}`}>
                {/* Círculo del hito (más pequeño para estilo fino) */}
                <circle
                  cx={hito.x}
                  cy={hito.y}
                  r={esActual ? "4" : "4"}
                  fill="white"
                  stroke={esActual ? "#16a34a" : "#6366F1"}
                  strokeWidth={esHovered ? "2" : (esActual ? "1.5" : "1.5")}
                  opacity={esHovered ? 1 : 0.9}
                />
                <circle
                  cx={hito.x}
                  cy={hito.y}
                  r={esActual ? "2.5" : "2.5"}
                  fill={esActual ? "#16a34a" : "#6366F1"}
                  opacity={esHovered ? 1 : 0.9}
                />
              </g>
            );
          })}
          
          {/* Flecha de tendencia sobre el último tramo */}
          {ultimosTramos.length === 2 && (
            <g>
              <path
                d={`M ${ultimosTramos[0].x} ${ultimosTramos[0].y} L ${ultimosTramos[1].x} ${ultimosTramos[1].y}`}
                stroke={tieneAceleracion ? "#16a34a" : "#ef4444"}
                strokeWidth="1.5"
                strokeLinecap="round"
                markerEnd={`url(#arrow-${tieneAceleracion ? 'up' : 'down'})`}
                opacity="0.6"
              />
              {/* Definir marcadores de flecha */}
              <defs>
                <marker
                  id="arrow-up"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 0 6 L 6 3 z" fill="#16a34a" />
                </marker>
                <marker
                  id="arrow-down"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M 0 6 L 0 0 L 6 3 z" fill="#ef4444" />
                </marker>
              </defs>
            </g>
          )}
          
          {/* Punto destacado en la semana actual (pequeño con halo sutil) */}
          <circle
            cx={ultimoPunto.x}
            cy={ultimoPunto.y}
            r="3.5"
            fill="#16a34a"
            stroke="white"
            strokeWidth="1.5"
          />
          {/* Halo sutil */}
          <circle
            cx={ultimoPunto.x}
            cy={ultimoPunto.y}
            r="5"
            fill="none"
            stroke="#16a34a"
            strokeWidth="0.5"
            opacity="0.2"
          />
        </svg>
        
        {/* Etiquetas de ejes fuera del SVG */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 -rotate-90 text-[10px] font-medium text-gray-500">
          Tareas acumuladas
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-[10px] font-medium text-gray-500">
          Semanas
        </div>
        
        {/* Tooltip tipo mercado (Google Finance style) - solo si no es un hito */}
        {hoveredIndex !== null && !hoveredHito && tooltipPos && (
          <div
            className="absolute z-10 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-3 pointer-events-none min-w-[140px]"
            style={{
              left: `${tooltipPos.x}%`,
              top: `${tooltipPos.y}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px'
            }}
          >
            <div className="text-xs font-semibold text-gray-300 mb-2">
              Semana {semanasParaGrafico[hoveredIndex]}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Tareas acumuladas:</span>
                <span className="font-semibold text-white">{completadasParaGrafico[hoveredIndex]}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Tareas ejecutadas:</span>
                <span className="font-semibold text-white">{tareasPorSemana[hoveredIndex]}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                <span className="text-gray-400">Planificado:</span>
                <span className="font-semibold text-gray-300">{proyectadoParaGrafico[hoveredIndex]}</span>
              </div>
              <button className="w-full mt-2 pt-1.5 border-t border-gray-700 text-xs text-blue-400 hover:text-blue-300 text-left">
                Ver tareas de esta semana →
              </button>
            </div>
          </div>
        )}
        
        {/* Zonas interactivas para tooltip y click - usando coordenadas del SVG */}
        {puntosTareas.map((punto, index) => {
          const semanaClick = semanasParaGrafico[index];
          return (
            <circle
              key={index}
              cx={punto.x}
              cy={punto.y}
              r="12"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                // Navegar a la semana correspondiente
                // window.location.href = `/cliente/tareas?semana=${semanaClick}`;
                console.log(`Navegar a semana ${semanaClick}`);
              }}
              onMouseMove={(e) => {
                const svg = e.currentTarget.ownerSVGElement;
                if (!svg) return;
                const svgRect = svg.getBoundingClientRect();
                const point = svg.createSVGPoint();
                point.x = e.clientX;
                point.y = e.clientY;
                const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
                
                setHoveredIndex(index);
                setHoveredHito(null); // Limpiar hover de hito
                setTooltipPos({
                  x: (svgPoint.x / viewBoxWidth) * 100,
                  y: (svgPoint.y / viewBoxHeight) * 100
                });
                // Notificar al componente padre para sincronización
                if (onHover) {
                  onHover(semanasParaGrafico[index]);
                }
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setTooltipPos(null);
                if (onHover) {
                  onHover(null);
                }
              }}
            />
          );
        })}
        
        {/* Zonas interactivas para hitos */}
        {puntosHitos.map((hito, index) => {
          if (!hito) return null;
          const hitoIndex = semanasParaGrafico.indexOf(hito.semana);
          const tareasHito = hitoIndex >= 0 ? completadasParaGrafico[hitoIndex] : 0;
          return (
            <g key={`hito-interactive-${hito.semana}`}>
              <circle
                cx={hito.x}
                cy={hito.y}
                r="12"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // Navegar a la fase correspondiente
                  console.log(`Navegar a hito: ${hito.nombre} (Semana ${hito.semana})`);
                }}
              onMouseEnter={(e) => {
                const svg = e.currentTarget.ownerSVGElement;
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const point = svg.createSVGPoint();
                point.x = e.clientX;
                point.y = e.clientY;
                const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
                
                setHoveredHito(hito.semana);
                setHoveredIndex(null); // Limpiar hover de punto normal
                setTooltipPos({
                  x: (svgPoint.x / viewBoxWidth) * 100,
                  y: (svgPoint.y / viewBoxHeight) * 100
                });
                if (onHover) {
                  onHover(hito.semana);
                }
              }}
              onMouseLeave={() => {
                setHoveredHito(null);
                setTooltipPos(null);
                if (onHover) {
                  onHover(null);
                }
              }}
              />
            </g>
          );
        })}
        
        {/* Tooltip para hitos (solo cuando hover directamente en un hito) */}
        {hoveredHito && tooltipPos && (() => {
          const hitoHovered = puntosHitos.find(h => h && h.semana === hoveredHito);
          if (!hitoHovered) return null;
          const hitoIndex = semanasParaGrafico.indexOf(hitoHovered.semana);
          if (hitoIndex === -1) return null;
          
          return (
            <div
              className="absolute z-10 bg-indigo-600 rounded-lg shadow-xl border border-indigo-700 p-3 pointer-events-none min-w-[160px]"
              style={{
                left: `${tooltipPos.x}%`,
                top: `${tooltipPos.y}%`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px'
              }}
            >
              <div className="text-xs font-semibold text-white mb-2">
                {hitoHovered.nombre}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-indigo-200">Semana:</span>
                  <span className="font-semibold text-white">{hitoHovered.semana}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-indigo-200">Tareas acumuladas:</span>
                  <span className="font-semibold text-white">{completadasParaGrafico[hitoIndex]}</span>
                </div>
                <button className="w-full mt-2 pt-1.5 border-t border-indigo-500 text-xs text-white hover:text-indigo-100 text-left font-medium">
                  Ver tareas del hito →
                </button>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* Información operativa debajo del gráfico */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        {/* Primera fila: Leyenda y Ritmo */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Leyenda */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600 rounded-full"></div>
              <span className="text-xs text-gray-600 font-medium">Real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t border-dashed border-gray-400"></div>
              <span className="text-xs text-gray-600 font-medium">Planificado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border-2 border-indigo-500 bg-white"></div>
              <span className="text-xs text-gray-600 font-medium">Hitos</span>
            </div>
          </div>
          
          {/* Indicador de ritmo */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="font-medium">Ritmo promedio:</span>
            <span>Planificado: {ritmoPlanificado.toFixed(1)} tareas/sem</span>
            <span className={`flex items-center gap-1 ${ritmoColor}`}>
              Real: {ritmoRealPromedio.toFixed(1)} tareas/sem
              <span className="text-base">{ritmoTendencia}</span>
            </span>
          </div>
          
          {/* Desvío acumulado */}
          <div className="text-xs">
            <span className="text-gray-600">Desvío acumulado:</span>
            <span className={`ml-2 font-semibold ${
              desvioEstado === 'success' ? 'text-emerald-600' :
              desvioEstado === 'warning' ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {desvioActual >= 0 ? '+' : ''}{desvioActual} tareas
            </span>
          </div>
        </div>
        
        {/* Segunda fila: Estado y Acción */}
        <div className="flex items-center justify-between">
          <div className={`text-sm font-medium ${estadoColor}`}>
            {estadoTexto}
          </div>
          
          {/* Botón de acción */}
          <button 
            onClick={() => {
              // Navegar a tareas de esta semana
              // window.location.href = `/cliente/tareas?semana=${semanaActual}`;
              console.log(`Ver tareas de semana ${semanaActual}`);
            }}
            className="text-xs font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Ver tareas de esta semana →
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetChart({ 
  presupuestoSemanal, 
  formatCurrency, 
  rangoTemporal,
  onHover,
  hoveredSemana,
  onRangoChange
}: { 
  presupuestoSemanal: Array<{ semana: number; proyectado: number; ejecutado: number; tareasPagadas: number }>;
  formatCurrency: (v: number) => string;
  rangoTemporal: number;
  onHover?: (semana: number | null) => void;
  hoveredSemana?: number | null;
  onRangoChange?: (rango: number) => void;
}) {
  // Filtrar datos según rango temporal (últimas semanas + 2 semanas futuras)
  const totalSemanas = presupuestoSemanal.length;
  const inicioSlice = rangoTemporal >= totalSemanas 
    ? 0 
    : totalSemanas - rangoTemporal;
  
  // Obtener semanas pasadas según el rango
  const semanasPasadas = presupuestoSemanal.slice(inicioSlice);
  
  // Agregar 2 semanas futuras (proyectadas) basadas en el promedio o tendencia
  const ultimaSemana = presupuestoSemanal[presupuestoSemanal.length - 1];
  const promedioProyectado = semanasPasadas.reduce((sum, d) => sum + d.proyectado, 0) / semanasPasadas.length;
  
  const semanasFuturas = [
    { 
      semana: totalSemanas + 1, 
      proyectado: promedioProyectado, 
      ejecutado: 0, 
      tareasPagadas: 0,
      esFutura: true
    },
    { 
      semana: totalSemanas + 2, 
      proyectado: promedioProyectado, 
      ejecutado: 0, 
      tareasPagadas: 0,
      esFutura: true
    }
  ];
  
  const datosFiltrados = [...semanasPasadas, ...semanasFuturas];
  
  // Calcular totales (solo semanas pasadas, no futuras)
  const semanasPasadasParaTotal = semanasPasadas;
  const totalProyectado = semanasPasadasParaTotal.reduce((sum, d) => sum + d.proyectado, 0);
  const totalEjecutado = semanasPasadasParaTotal.reduce((sum, d) => sum + d.ejecutado, 0);
  const porcentajeEjecutado = totalProyectado > 0 ? (totalEjecutado / totalProyectado) * 100 : 0;
  const diferencia = totalEjecutado - totalProyectado;
  
  // Determinar estado (escrow - sin sobrecosto)
  let estadoTexto = 'Dentro de lo aprobado';
  let estadoColor = 'text-emerald-600';
  
  if (totalEjecutado === 0 && semanasPasadasParaTotal.length > 0) {
    estadoTexto = 'Sin movimientos en el período';
    estadoColor = 'text-gray-500';
  } else if (porcentajeEjecutado < 50) {
    estadoTexto = 'Ejecución según avance';
    estadoColor = 'text-blue-600';
  } else if (porcentajeEjecutado >= 50 && porcentajeEjecutado < 90) {
    estadoTexto = 'Dentro de lo aprobado';
    estadoColor = 'text-emerald-600';
  } else {
    estadoTexto = 'Dentro de lo aprobado';
    estadoColor = 'text-emerald-600';
  }
  
  // Calcular semanas sin ejecución (solo semanas pasadas, no futuras)
  const semanasSinEjecucion = semanasPasadasParaTotal.filter(d => d.ejecutado === 0).length;
  
  // Calcular máximo para escala (incluir tanto proyectado como ejecutado)
  const maxValorProyectado = Math.max(...datosFiltrados.map(d => d.proyectado), 1);
  const maxValorEjecutado = Math.max(...datosFiltrados.map(d => d.ejecutado), 0);
  const maxValor = Math.max(maxValorProyectado, maxValorEjecutado, 1);
  const maxValorConMargen = maxValor * 1.1; // 10% de margen superior
  const alturaMax = 150; // Altura fija del área de barras
  
  // Calcular valores del eje Y en miles de pesos (redondeados hacia arriba)
  // Asegurar que el máximo redondeado sea al menos 10k para visualización clara
  const maxValorRedondeado = Math.max(
    Math.ceil(maxValorConMargen / 5000) * 5000,
    10000
  ); // Redondear a múltiplos de 5k, mínimo 10k
  
  const numTicks = 5; // Número de divisiones en el eje Y
  const pasoY = maxValorRedondeado / (numTicks - 1); // Paso entre ticks
  const valoresY: number[] = [];
  for (let i = 0; i < numTicks; i++) {
    valoresY.push((pasoY * i));
  }
  
  // Estado para tooltip
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  return (
    <div className="space-y-4">
      {/* KPIs arriba */}
      <div className="grid grid-cols-5 gap-4 text-xs mb-4">
        <div>
          <div className="text-gray-500 mb-1">Total aprobado</div>
          <div className="font-semibold text-gray-900">{formatCurrency(totalProyectado)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Total ejecutado</div>
          <div className="font-semibold text-gray-900">{formatCurrency(totalEjecutado)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">% ejecutado</div>
          <div className="font-semibold text-gray-900">{porcentajeEjecutado.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Semanas sin ejecución</div>
          <div className="font-semibold text-gray-900">{semanasSinEjecucion}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Saldo escrow</div>
          <div className="font-semibold text-blue-600">{formatCurrency(totalProyectado - totalEjecutado)}</div>
        </div>
      </div>
      
      {/* Gráfico de barras semanales - escala coherente desde 0 */}
      <div className="relative h-48 w-full overflow-visible" id="budget-chart-container">
        {/* Eje Y con valores en miles de pesos - 0 abajo, máximo arriba */}
        <div className="absolute left-0 top-0 bottom-7 w-14 flex flex-col justify-between pr-2 pointer-events-none">
          {valoresY.slice().reverse().map((valor, idx) => (
            <div 
              key={`y-${valor}-${idx}`} 
              className="flex items-center justify-end h-full"
              style={{ 
                alignItems: idx === 0 ? 'flex-end' : idx === valoresY.length - 1 ? 'flex-start' : 'center'
              }}
            >
              <div className="text-[9px] text-gray-500 font-medium">
                ${(valor / 1000).toFixed(0)}k
              </div>
              <div className="w-2 h-px bg-gray-200 ml-1" />
            </div>
          ))}
        </div>
        
        {/* Contenedor de barras con área del gráfico */}
        <div className="ml-14 mr-2 h-full px-2 pb-7 relative">
          {/* Área de gráfico con altura fija para las barras */}
          <div className="relative" style={{ height: `${alturaMax - 25}px` }}>
            {/* Líneas de referencia horizontales del eje Y */}
            {valoresY.map((valor, idx) => {
              // Calcular posición desde abajo: 0 = bottom, maxValorRedondeado = top
              const porcentajeDesdeAbajo = (valor / maxValorRedondeado) * 100;
              const posicionDesdeBottom = (porcentajeDesdeAbajo / 100) * (alturaMax - 25);
              return (
                <div
                  key={`grid-${valor}-${idx}`}
                  className="absolute left-0 right-0 h-px bg-gray-100 z-0"
                  style={{
                    bottom: `${posicionDesdeBottom}px`
                  }}
                />
              );
            })}
            
            {/* Eje X (línea base en 0) - TODAS LAS BARRAS EMPIEZAN DESDE AQUÍ */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 z-10" />
            
            {/* Contenedor de barras: distribuidas horizontalmente, todas alineadas desde abajo */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-1.5" style={{ height: `${alturaMax - 25}px` }}>
              {datosFiltrados.map((dato, index) => {
                // ESCALA UNIFICADA: ambas barras usan la misma escala desde 0 hasta maxValorRedondeado
                // Domain: [0, maxValorRedondeado]
                const alturaDisponible = alturaMax - 25;
                const alturaProyectado = (dato.proyectado / maxValorRedondeado) * alturaDisponible;
                const alturaEjecutado = (dato.ejecutado / maxValorRedondeado) * alturaDisponible;
                
                const sinEjecucion = dato.ejecutado === 0 && !(dato as any).esFutura;
                const esFutura = (dato as any).esFutura;
                const esHovered = hoveredSemana === dato.semana || hoveredIndex === index;
                
                return (
                  <div 
                    key={dato.semana}
                    className="flex-1 flex flex-col items-center justify-end group relative transition-all cursor-pointer"
                    style={{ height: `${alturaDisponible}px` }}
                    onClick={() => {
                      // Handler mock: navegar a detalle de movimientos escrow
                      console.log(`Click en semana ${dato.semana} - Ver movimientos escrow`);
                      // TODO: router.push(`/obra/${obraId}/presupuesto?semana=${dato.semana}`);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredIndex(index);
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Buscar el contenedor principal del gráfico por ID
                      const graphContainer = document.getElementById('budget-chart-container');
                      if (graphContainer) {
                        const containerRect = graphContainer.getBoundingClientRect();
                        setTooltipPos({
                          x: ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100,
                          y: ((rect.top - containerRect.top) / containerRect.height) * 100
                        });
                      } else {
                        // Fallback: usar posición absoluta
                        setTooltipPos({
                          x: rect.left + rect.width / 2,
                          y: rect.top
                        });
                      }
                      if (onHover) {
                        onHover(dato.semana);
                      }
                    }}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        if (hoveredIndex === index) {
                          setHoveredIndex(null);
                          setTooltipPos(null);
                          if (onHover) {
                            onHover(null);
                          }
                        }
                      }, 100);
                    }}
                  >
                    {/* Una sola barra por semana: contenedor gris con relleno verde */}
                    <div 
                      className="w-full relative rounded-t transition-all"
                      style={{ 
                        height: `${alturaProyectado}px`,
                        minHeight: alturaProyectado > 0 ? '3px' : '0px',
                        opacity: esHovered ? 1 : 0.85
                      }}
                    >
                      {/* Contenedor gris (aprobado/proyectado) - más visible */}
                      <div 
                        className="absolute inset-0 bg-slate-300 rounded-t"
                        style={{ 
                          opacity: esHovered ? 0.9 : 0.7
                        }}
                      />
                      
                      {/* Relleno verde (ejecutado) - dentro del contenedor gris, desde abajo */}
                      {!esFutura && (
                        <div 
                          className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${
                            sinEjecucion ? 'bg-gray-400/30' : 'bg-green-500'
                          }`}
                          style={{ 
                            height: `${alturaEjecutado}px`,
                            minHeight: alturaEjecutado > 0 ? '2px' : '0px',
                            opacity: esHovered ? 1 : (sinEjecucion ? 0.4 : 0.9)
                          }}
                        />
                      )}
                      
                      {/* Indicador de semana futura */}
                      {esFutura && (
                        <div 
                          className="absolute inset-0 rounded-t bg-slate-300/30 border-t-2 border-dashed border-slate-400/50"
                        />
                      )}
                      
                      {/* Indicador sutil para semanas sin ejecución */}
                      {sinEjecucion && !esFutura && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Labels del eje X (semanas) - alineadas con el baseline */}
          <div className="flex items-center justify-between gap-1 mt-1">
            {datosFiltrados.map((dato, index) => {
              const total = datosFiltrados.length;
              const interval = total > 16 ? 3 : total > 12 ? 2 : 2;
              const mostrar = index % interval === 0 || index === total - 1;
              const esFutura = (dato as any).esFutura;
              
              return (
                <div 
                  key={`label-${dato.semana}`}
                  className={`flex-1 text-center ${mostrar ? '' : 'invisible'}`}
                >
                  {mostrar && (
                    <span className={`text-[10px] leading-none font-medium ${esFutura ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                      {esFutura ? `S${dato.semana}*` : `S${dato.semana}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tooltip mejorado - siempre visible al hover */}
        {hoveredIndex !== null && tooltipPos && datosFiltrados[hoveredIndex] && (
          <div
            className="absolute z-50 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-3 pointer-events-none min-w-[200px]"
            style={{
              left: typeof tooltipPos.x === 'number' && tooltipPos.x > 100 
                ? `${tooltipPos.x}px` 
                : `${tooltipPos.x}%`,
              top: typeof tooltipPos.y === 'number' && tooltipPos.y > 100
                ? `${tooltipPos.y - 10}px`
                : `${tooltipPos.y}%`,
              transform: typeof tooltipPos.x === 'number' && tooltipPos.x > 100
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, -100%)',
              marginTop: '-8px'
            }}
            onMouseEnter={(e) => {
              // Mantener tooltip visible si el mouse entra en él
              e.stopPropagation();
            }}
          >
            <div className="text-xs font-semibold text-gray-300 mb-2">
              Semana {datosFiltrados[hoveredIndex].semana}
            </div>
            <div className="space-y-1.5 text-xs">
              {(datosFiltrados[hoveredIndex] as any).esFutura ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Semana:</span>
                    <span className="font-semibold text-white">S{datosFiltrados[hoveredIndex].semana} (Planificada)</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Aprobado previsto:</span>
                    <span className="font-semibold text-white">{formatCurrency(datosFiltrados[hoveredIndex].proyectado)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                    <span className="text-gray-400">Ejecutado:</span>
                    <span className="font-semibold text-gray-400">Aún no ejecutado</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Aprobado:</span>
                    <span className="font-semibold text-white">{formatCurrency(datosFiltrados[hoveredIndex].proyectado)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Ejecutado:</span>
                    <span className={`font-semibold ${datosFiltrados[hoveredIndex].ejecutado === 0 ? 'text-gray-400' : 'text-white'}`}>
                      {datosFiltrados[hoveredIndex].ejecutado === 0 ? 'Sin ejecución' : formatCurrency(datosFiltrados[hoveredIndex].ejecutado)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Diferencia:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(datosFiltrados[hoveredIndex].proyectado - datosFiltrados[hoveredIndex].ejecutado)}
                    </span>
                  </div>
                  {datosFiltrados[hoveredIndex].ejecutado === 0 && (
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                      <span className="text-gray-400 text-[10px] italic">Sin ejecución esta semana</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                    <span className="text-gray-400">Tareas pagadas:</span>
                    <span className="font-semibold text-white">{datosFiltrados[hoveredIndex].tareasPagadas}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer con estado */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Estado:</span>
          <span className={`font-medium ${estadoColor}`}>{estadoTexto}</span>
        </div>
      </div>
    </div>
  );
}

function SidebarActions({ router, handleCrearObra, handleCrearTarea }: any) {
  return (
    <>
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          ¿Qué querés hacer ahora?
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleCrearObra}
            className="w-full bg-[#0052CC] hover:bg-[#003d99] text-white font-medium px-6 py-4 rounded-xl transition-colors text-left flex items-center justify-between group"
          >
            <div>
              <div className="font-semibold mb-1">Crear una obra</div>
              <div className="text-sm text-white/80 font-light">
                Proceso completo dentro de Grows
              </div>
            </div>
            <Building2 className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleCrearTarea}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium px-6 py-4 rounded-xl transition-colors border-2 border-gray-200 hover:border-gray-300 text-left flex items-center justify-between group"
          >
            <div>
              <div className="font-semibold mb-1">Crear tareas puntuales</div>
              <div className="text-sm text-gray-500 font-light">
                Trabajos sueltos: yesero, plomero, albañil, etc.
              </div>
            </div>
            <Wrench className="h-5 w-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-2">
        <button
          onClick={() => router.push('/cliente/dashboard?section=billetera')}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-3"
        >
          <DollarSign className="h-4 w-4 text-gray-500" />
          Ver presupuestos
        </button>
        <button
          onClick={() => router.push('/cliente/dashboard?section=notificaciones')}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-3"
        >
          <FileText className="h-4 w-4 text-gray-500" />
          Ver notificaciones
        </button>
      </div>
    </>
  );
}

function ObraCard({ obra, esSeleccionada, onSelect }: { obra: any; esSeleccionada: boolean; onSelect: () => void }) {
  const estadoColor = obra.estado === 'ACTIVA' ? 'emerald' : obra.estado === 'PAUSADA' ? 'amber' : obra.estado === 'FINALIZADA' ? 'blue' : 'red';
  const estadoTexto = obra.estado === 'ACTIVA' ? 'Activa' : obra.estado === 'PAUSADA' ? 'Pausada' : obra.estado === 'FINALIZADA' ? 'Terminada' : 'Cancelada';
  const colorClasses = {
    emerald: 'bg-emerald-100 border-emerald-300 text-emerald-700',
    amber: 'bg-amber-100 border-amber-300 text-amber-700',
    blue: 'bg-blue-100 border-blue-300 text-blue-700',
    red: 'bg-red-100 border-red-300 text-red-700',
    gray: 'bg-gray-100 border-gray-300 text-gray-700',
  };
  const dotColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-lg border-2 transition-all ${
        esSeleccionada
          ? 'border-blue-400 bg-blue-50/50 shadow-sm ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate mb-2 ${esSeleccionada ? 'text-gray-900' : 'text-gray-800'}`}>
            {obra.name}
          </p>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${colorClasses[estadoColor as keyof typeof colorClasses]}`}>
            <div className={`w-2 h-2 rounded-full ${dotColors[estadoColor as keyof typeof dotColors]}`} />
            {estadoTexto}
          </div>
        </div>
        {esSeleccionada && <div className="w-2 h-2 rounded-full bg-blue-500" />}
      </div>
    </button>
  );
}

// ============================================
// DASHBOARD FINAL — ENFOCADO EN DATOS, MÁS DENSIDAD
// ============================================
function DashboardFinal({ mockData, formatCurrency, router, handleCrearObra, handleCrearTarea }: any) {
  const [obraSeleccionada, setObraSeleccionada] = useState(mockData.obras[0].id);
  
  // Estado compartido para sincronización entre gráficos
  const [rangoTemporalCompartido, setRangoTemporalCompartido] = useState<number>(22);
  const [hoveredSemanaCompartida, setHoveredSemanaCompartida] = useState<number | null>(null);
  
  // Obtener datos de la obra seleccionada
  const obraActual = mockData.obras.find((obra: any) => obra.id === obraSeleccionada) || mockData.obras[0];
  const tareasActuales = obraActual.tareas;
  const actividadActual = obraActual.actividad;
  const presupuestoActual = obraActual.presupuesto;
  const presupuestoSemanalActual = (obraActual as any).presupuestoSemanal || [];

  return (
    <div>
      <div className="bg-blue-50/30 rounded-xl p-8 mb-6 border border-blue-100/50 shadow-sm">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">Bienvenido a Grows</h1>
        <p className="text-base text-gray-700 font-normal">Desde acá gestionás tus obras, tareas y presupuesto</p>
      </div>

      <div className="mb-6">
        <div className="bg-emerald-50/60 border-l-2 border-emerald-400/60 pl-4 py-2.5 rounded-r-lg">
          <p className="text-sm font-normal text-gray-700">Todo está bajo control · Última actividad hace 3 días</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6 w-full min-w-0">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wide">Tus obras</h3>
            <div className="grid grid-cols-3 gap-3">
              {mockData.obras.map((obra: any) => {
                const esSeleccionada = obraSeleccionada === obra.id;
                const estadoColor = obra.estado === 'ACTIVA' ? 'emerald' : obra.estado === 'PAUSADA' ? 'amber' : obra.estado === 'FINALIZADA' ? 'blue' : 'red';
                const estadoTexto = obra.estado === 'ACTIVA' ? 'Activa' : obra.estado === 'PAUSADA' ? 'Pausada' : obra.estado === 'FINALIZADA' ? 'Terminada' : 'Cancelada';
                return (
                  <button
                    key={obra.id}
                    onClick={() => setObraSeleccionada(obra.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      esSeleccionada 
                        ? 'border-blue-400 bg-blue-50/50 shadow-sm ring-1 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-2 truncate leading-tight ${esSeleccionada ? 'text-gray-900' : 'text-gray-800'}`}>
                      {obra.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        estadoColor === 'emerald' ? 'bg-emerald-500' :
                        estadoColor === 'amber' ? 'bg-amber-500' :
                        estadoColor === 'blue' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-[10px] font-medium text-gray-600">
                        {estadoTexto}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector global de período */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Período de análisis</h4>
                <p className="text-xs text-gray-500">Afecta todos los gráficos del dashboard</p>
              </div>
              <PeriodSelector
                rangoTemporal={rangoTemporalCompartido}
                totalSemanas={Math.max(
                  tareasActuales.weeklyCompleted?.length || 24,
                  presupuestoSemanalActual.length || 24,
                  actividadActual.tareasCompletadasPorSemana?.length || 22
                )}
                onPeriodChange={setRangoTemporalCompartido}
              />
            </div>
          </div>

          {/* Tareas y Presupuesto (arriba) */}
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Tareas</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Estado y avance de tareas</p>
                </div>
                {/* Badge de período (solo lectura) */}
                {(() => {
                  const totalSemanas = tareasActuales.weeklyCompleted?.length || 24;
                  const inicioSlice = rangoTemporalCompartido >= totalSemanas ? 0 : totalSemanas - rangoTemporalCompartido;
                  const semanaInicio = inicioSlice + 1;
                  const semanaFin = inicioSlice + (rangoTemporalCompartido >= totalSemanas ? totalSemanas : rangoTemporalCompartido);
                  const periodoTexto = rangoTemporalCompartido >= totalSemanas ? 'Total obra' : `${rangoTemporalCompartido} sem`;
                  return (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-medium text-gray-600">Período: {periodoTexto}</span>
                      <span className="text-[10px] text-gray-500">Mostrando: S{semanaInicio}–S{semanaFin}</span>
                    </div>
                  );
                })()}
              </div>
              <TasksChart 
                tareas={tareasActuales} 
                rangoTemporal={rangoTemporalCompartido}
                obraId={obraSeleccionada}
                onSegmentClick={(estado) => {
                  // Handler mock: navegar a tareas filtradas por estado
                  console.log(`Navegar a tareas estado: ${estado} de obra ${obraSeleccionada}`);
                  // TODO: router.push(`/cliente/obra/${obraSeleccionada}/tareas?estado=${estado}`);
                }}
              />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Ejecución presupuestaria</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Presupuesto aprobado vs ejecutado por semana</p>
                </div>
                {/* Badge de período (solo lectura) */}
                {(() => {
                  const totalSemanas = presupuestoSemanalActual.length || 24;
                  const inicioSlice = rangoTemporalCompartido >= totalSemanas ? 0 : totalSemanas - rangoTemporalCompartido;
                  const semanaInicio = inicioSlice + 1;
                  const semanaFin = inicioSlice + (rangoTemporalCompartido >= totalSemanas ? totalSemanas : rangoTemporalCompartido);
                  const periodoTexto = rangoTemporalCompartido >= totalSemanas ? 'Total obra' : `${rangoTemporalCompartido} sem`;
                  return (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-medium text-gray-600">Período: {periodoTexto}</span>
                      <span className="text-[10px] text-gray-500">Mostrando: S{semanaInicio}–S{semanaFin}</span>
                    </div>
                  );
                })()}
              </div>
              <BudgetChart 
                presupuestoSemanal={presupuestoSemanalActual}
                formatCurrency={formatCurrency}
                rangoTemporal={rangoTemporalCompartido}
                onHover={setHoveredSemanaCompartida}
                hoveredSemana={hoveredSemanaCompartida}
                onRangoChange={setRangoTemporalCompartido}
              />
            </div>
          </div>

          {/* Actividad de la obra (abajo, ancho completo) */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Actividad de la obra</h3>
                <p className="text-xs text-gray-500 mt-0.5">Evolución del avance real vs planificado</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Indicador arriba a la derecha: tareas acumuladas */}
                <div className="text-right">
                  <div className="text-2xl font-semibold text-gray-900">{actividadActual.tareasCompletadasPorSemana[actividadActual.tareasCompletadasPorSemana.length - 1]?.completadas || 0}</div>
                  <div className="text-xs text-gray-500">tareas acumuladas</div>
                </div>
                
                {/* Badge de período (solo lectura) */}
                {(() => {
                  const totalSemanas = actividadActual.tareasCompletadasPorSemana?.length || 22;
                  const inicioSlice = rangoTemporalCompartido >= totalSemanas ? 0 : totalSemanas - rangoTemporalCompartido;
                  const semanaInicio = inicioSlice + 1;
                  const semanaFin = inicioSlice + (rangoTemporalCompartido >= totalSemanas ? totalSemanas : rangoTemporalCompartido);
                  const periodoTexto = rangoTemporalCompartido >= totalSemanas ? 'Total obra' : `${rangoTemporalCompartido} sem`;
                  return (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-medium text-gray-600">Período: {periodoTexto}</span>
                      <span className="text-[10px] text-gray-500">Mostrando: S{semanaInicio}–S{semanaFin}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <ActivityChart 
              actividad={actividadActual} 
              rangoTemporal={rangoTemporalCompartido}
              onHover={setHoveredSemanaCompartida}
              hoveredSemana={hoveredSemanaCompartida}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-8 h-fit space-y-3">
          <SidebarActions router={router} handleCrearObra={handleCrearObra} handleCrearTarea={handleCrearTarea} />
        </div>
      </div>
    </div>
  );
}

export default function ClienteDashboardPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [activeSection, setActiveSection] = useState('home');

  const normalizedRole = useMemo(
    () => normalizeRole(currentUser?.role),
    [currentUser?.role]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get('section');
      if (sectionParam && ['home', 'obras', 'tareas', 'cuadrillas', 'billetera', 'notificaciones', 'calendario', 'cuenta'].includes(sectionParam)) {
        setActiveSection(sectionParam);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else if (!sectionParam) {
        setActiveSection('home');
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.isDevUser) {
      return;
    }

    if (normalizedRole === 'CLIENTE_TECNICO' && !currentUser.orgId) {
      router.replace('/onboarding' as Route);
    }
  }, [currentUser, normalizedRole, router]);

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeCliente />;
      case 'obras':
        return <ObrasSection />;
      case 'tareas':
        return <TareasSection />;
      case 'cuadrillas':
        return <CuadrillasSection onNavigate={setActiveSection} />;
      case 'billetera':
        return <BilleteraSection />;
      case 'notificaciones':
        return <NotificacionesSection onNavigate={setActiveSection} />;
      case 'calendario':
        return <CalendarioSection onNavigate={setActiveSection} />;
      case 'cuenta':
        return <CuentaSection />;
      default:
        return <HomeCliente />;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secundario text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-3 text-sm text-white/70">Cargando panel…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secundario">
      <SidebarClienteTecnico
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="ml-[220px] flex-1 p-8">{renderSection()}</div>
    </div>
  );
}
