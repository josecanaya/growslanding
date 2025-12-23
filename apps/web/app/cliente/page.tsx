'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Button, Card, EmptyState } from '@/components/ui/grows';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import {
  Building2,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Plus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Database } from '@/lib/types/supabase.gen';

interface Obra {
  id: string;
  nombre: string;
  estado: string;
  propietario?: string | null;
  tipo_obra?: string | null;
  fecha_inicio_estimada?: string | null;
  fecha_final_estimada?: string | null;
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
    return `${clienteCapitalizado} (${tipoCapitalizado})`;
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
      return `${clienteCapitalizado} (${tipoCapitalizado})`;
    }
  }

  return nombre;
}

// Función para formatear fecha
function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
}

// Badge de estado
const EstadoBadge = ({ estado }: { estado: string }) => {
  const styles: Record<string, string> = {
    ACTIVA: 'bg-blue-50 text-[#0052CC] border-blue-200',
    PAUSADA: 'bg-amber-50 text-amber-600 border-amber-200',
    FINALIZADA: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    CANCELADA: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  const badgeClasses = styles[estado] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClasses}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          estado === 'PAUSADA'
            ? 'bg-amber-500'
            : estado === 'FINALIZADA'
            ? 'bg-emerald-500'
            : estado === 'CANCELADA'
            ? 'bg-rose-500'
            : 'bg-[#0052CC]'
        }`}
      />
      {estado}
    </span>
  );
};

export default function ClienteHomePage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  
  const [loading, setLoading] = useState(true);
  const [obras, setObras] = useState<Obra[]>([]);
  const [pendingValidations, setPendingValidations] = useState(0);

  // Cargar datos
  const loadData = useCallback(async () => {
    if (!currentUser?.orgId) {
      setLoading(false);
      return;
    }

    try {
      // Cargar obras
      let { data: obrasData, error: obrasError } = await supabase
        .from('obras')
        .select('id, nombre, estado, propietario, tipo_obra, fecha_inicio_estimada, fecha_final_estimada')
        .eq('org_id', currentUser.orgId)
        .order('created_at', { ascending: false });

      // Fallback si las columnas de fecha estimada no existen
      if (obrasError && obrasError.message?.includes('column "fecha_inicio_estimada" does not exist')) {
        const fallbackQuery = supabase
          .from('obras')
          .select('id, nombre, estado, propietario, tipo_obra')
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        const fallbackResult = await fallbackQuery;
        obrasData = fallbackResult.data;
        obrasError = fallbackResult.error;
      }

      if (obrasError) throw obrasError;
      setObras((obrasData as Obra[]) || []);

      // Contar bloques pendientes de validación
      // Primero obtenemos todas las tareas del org
      const { data: tareasData, error: tareasError } = await supabase
        .from('tareas')
        .select('id')
        .eq('org_id', currentUser.orgId);

      if (tareasError) throw tareasError;

      const tareaIds = (tareasData || []).map((t: any) => t.id);

      if (tareaIds.length > 0) {
        // Luego contamos subtareas con estado 'para_validar'
        const { data: subtareasData, error: subtareasError } = await supabase
          .from('tareas_subtareas')
          .select('id')
          .in('tarea_id', tareaIds)
          .eq('estado', 'para_validar');

        if (subtareasError) throw subtareasError;
        setPendingValidations((subtareasData || []).length);
      } else {
        setPendingValidations(0);
      }
    } catch (error) {
      // Error loading data - silently handle
    } finally {
      setLoading(false);
    }
  }, [currentUser?.orgId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const obrasActivas = obras.filter(o => o.estado === 'ACTIVA').length;

  const handleCrearObra = () => {
    router.push('/cliente/obras/nueva');
  };

  const handleValidarBloques = () => {
    router.push('/cliente/validar');
  };

  const handleVerObra = (obraId: string) => {
    router.push(`/cliente/obras/${obraId}` as any);
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
        activeSection=""
        onSectionChange={(section) => {
          router.push(`/cliente/dashboard?section=${section}`);
        }}
      />

      <div className="ml-[220px] flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Inicio</h1>
          <p className="text-white/70">Bienvenido, {currentUser.name || 'Usuario'}</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grows-text-secondary mb-1">Obras activas</p>
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-grows-primary" />
                ) : (
                  <p className="text-4xl font-bold text-grows-primary">{obrasActivas}</p>
                )}
              </div>
              <Building2 className="h-10 w-10 text-grows-primary opacity-50" />
            </div>
          </Card>

          <Card className="bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grows-text-secondary mb-1">Bloques pendientes</p>
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-grows-primary" />
                ) : (
                  <p className="text-4xl font-bold text-grows-primary">{pendingValidations}</p>
                )}
              </div>
              <CheckCircle2 className="h-10 w-10 text-grows-primary opacity-50" />
            </div>
          </Card>
        </div>

        {/* Primary CTAs */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleValidarBloques}
            icon={<CheckCircle2 className="h-5 w-5" />}
            disabled={pendingValidations === 0}
          >
            Validar bloques
            {pendingValidations > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {pendingValidations}
              </span>
            )}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCrearObra}
            icon={<Plus className="h-5 w-5" />}
          >
            Crear obra
          </Button>
        </div>

        {/* Empty state for no pending validations */}
        {!loading && pendingValidations === 0 && obras.length > 0 && (
          <div className="mb-6">
            <EmptyState
              title="No tenés validaciones pendientes"
              description="Todos los bloques están validados."
              icon={<CheckCircle2 className="h-12 w-12" />}
            />
          </div>
        )}

        {/* Obras List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tus obras</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : obras.length === 0 ? (
            <EmptyState
              title="Todavía no tenés obras creadas"
              description="Empezá creando tu primera obra."
              icon={<Building2 className="h-12 w-12" />}
              action={
                <Button variant="primary" onClick={handleCrearObra} icon={<Plus className="h-4 w-4" />}>
                  Crear obra
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {obras.map((obra) => (
                <Card
                  key={obra.id}
                  className="bg-white hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleVerObra(obra.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-grows-primary flex-1 break-words line-clamp-2">
                      {formatearTituloObra(obra.nombre, obra.propietario, obra.tipo_obra)}
                    </h3>
                  </div>

                  <div className="mb-4">
                    <EstadoBadge estado={obra.estado} />
                  </div>

                  <div className="mb-4 space-y-2 text-sm text-grows-text-secondary">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-grows-primary flex-shrink-0" />
                      <span>
                        <strong className="text-grows-text-primary">Inicio estimado:</strong>{' '}
                        {formatDate(obra.fecha_inicio_estimada)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-grows-primary flex-shrink-0" />
                      <span>
                        <strong className="text-grows-text-primary">Finalización estimada:</strong>{' '}
                        {formatDate(obra.fecha_final_estimada)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerObra(obra.id);
                    }}
                    icon={<ArrowRight className="h-4 w-4" />}
                    className="w-full"
                  >
                    Entrar a la obra
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

