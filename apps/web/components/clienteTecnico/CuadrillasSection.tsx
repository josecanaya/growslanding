'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, UserCheck, FileText, MapPin, Calendar, MoreVertical, Edit3, Trash2, Eye, Loader2, X } from 'lucide-react';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import { usePlanLimitGuard } from '@/lib/subscriptions';
import { usePlanUsage } from '@/lib/subscriptions/use-plan-usage';
import { SUBSCRIPTION_UI_COPY } from '@/lib/subscriptions/texts';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Cuadrilla, Obra, Tarea } from '@/lib/types/cuadrillas';

export default function CuadrillasSection() {
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const { 
    cuadrillas, 
    isLoading, 
    error,
    fetchCuadrillas,
    crearCuadrilla,
    eliminarCuadrilla
  } = useCuadrillasStore();
  
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);
  const [showModalInvitarSocio, setShowModalInvitarSocio] = useState(false);
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState<Cuadrilla | null>(null);
  const upgradeModal = useUpgradeModal();
  const cuadrillasGuard = usePlanLimitGuard('cuadrillas');
  const cuadrillasUsage = usePlanUsage('cuadrillas');

  const activeCuadrillasCount = cuadrillas.filter(
    (item) => item.estado !== 'Inactiva'
  ).length;
  const usageCount =
    cuadrillasGuard.threshold === 0 || cuadrillasUsage.error
      ? activeCuadrillasCount
      : cuadrillasUsage.usage ?? activeCuadrillasCount;
  const cuadrillasBloqueadas = cuadrillasGuard.threshold === 0;
  const cuadrillasAlLimite =
    cuadrillasGuard.threshold !== null &&
    cuadrillasGuard.threshold > 0 &&
    usageCount >= cuadrillasGuard.threshold;

  const cuadrillasLimitLabel =
    cuadrillasGuard.threshold === null
      ? SUBSCRIPTION_UI_COPY.usageUnlimited
      : `${cuadrillasGuard.threshold} ${cuadrillasGuard.rule?.unit ?? 'cuadrillas'}`;

  const cuadrillasUsageSummary =
    cuadrillasGuard.threshold === 0
      ? SUBSCRIPTION_UI_COPY.readOnlyBadge
      : cuadrillasUsage.isLoading
      ? SUBSCRIPTION_UI_COPY.usageLoading
      : cuadrillasUsage.error
      ? SUBSCRIPTION_UI_COPY.usageFallback
      : SUBSCRIPTION_UI_COPY.usageLabel(usageCount, cuadrillasLimitLabel);

  // Cargar cuadrillas desde Supabase al montar el componente
  useEffect(() => {
    if (currentUser?.orgId) {
      fetchCuadrillas(currentUser.orgId);
    }
  }, [currentUser?.orgId, fetchCuadrillas]);

  const requestCuadrillasUpgrade = (source: string) => {
    upgradeModal.open({
      targetPlanId: cuadrillasGuard.upgradeTarget ?? 'PRO',
      limitId: 'cuadrillas',
      source,
      contextCopy: {
        title: 'Límite de cuadrillas alcanzado',
        description: `Tu plan actual permite hasta ${cuadrillasGuard.threshold} cuadrillas. Actualiza tu plan para agregar más.`,
        actionLabel: 'Actualizar plan',
      },
    });
  };

  const bloqueoInteractivo = (source: string) => {
    if (cuadrillasBloqueadas || cuadrillasAlLimite) {
      requestCuadrillasUpgrade(source);
      return true;
    }
    return false;
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, string> = {
      'Disponible': 'bg-green-100 text-green-800',
      'Inactiva': 'bg-gray-100 text-gray-800',
      'Ocupada': 'bg-yellow-100 text-yellow-800',
      'En obra': 'bg-blue-100 text-blue-800',
      // Mantener compatibilidad con estados antiguos
      'activa': 'bg-green-100 text-green-800',
      'inactiva': 'bg-gray-100 text-gray-800',
      'ocupada': 'bg-yellow-100 text-yellow-800'
    };
    return estados[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería': '🔨',
      'Yesería': '🧱',
      'Carpintería': '🔧',
      'Electricidad': '⚡',
      'Plomería': '🔧'
    };
    return iconos[especialidad as keyof typeof iconos] || '👷';
  };

  const handleVerDetalle = (cuadrilla: Cuadrilla) => {
    if (bloqueoInteractivo('cuadrillas-detalle')) {
      return;
    }
    setCuadrillaSeleccionada(cuadrilla);
    setShowModalDetalle(true);
  };

  const handleAsignarTarea = (cuadrilla: Cuadrilla) => {
    if (bloqueoInteractivo('cuadrillas-asignacion')) {
      return;
    }
    setCuadrillaSeleccionada(cuadrilla);
    setShowModalAsignacion(true);
  };

  const calcularPorcentajeCompletado = (asignadas: number, completadas: number) => {
    if (asignadas === 0) return 0;
    return Math.round((completadas / asignadas) * 100);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuadrillas</h1>
          <p className="text-gray-600 mt-1">Gestiona tus equipos de trabajo</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{cuadrillasUsageSummary}</span>
          <button
            onClick={() => setShowModalInvitarSocio(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserCheck className="h-5 w-5" />
            Invitar Socio
          </button>
          <button
            onClick={() => {
              if (bloqueoInteractivo('cuadrillas-nueva')) {
                return;
              }
              setShowModalNueva(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nueva Cuadrilla
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando cuadrillas...</span>
        </div>
      )}

      {/* Debug info - remover en producción */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <p>Debug: isLoading={isLoading ? 'true' : 'false'}, error={error || 'null'}, cuadrillas.length={cuadrillas.length}</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error cargando cuadrillas: {error}</p>
          <button
            onClick={() => currentUser?.orgId && fetchCuadrillas(currentUser.orgId)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Resumen de estadísticas - mostrar siempre que haya cuadrillas o esté cargando */}
      {(isLoading || cuadrillas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cuadrillas</p>
              <p className="text-2xl font-bold text-gray-900">{cuadrillas.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cuadrillas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{activeCuadrillasCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tareas Asignadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {cuadrillas.reduce((total, cuadrilla) => total + (cuadrilla.kpi?.tareasAsignadas || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de cuadrillas */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando cuadrillas...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Error al cargar cuadrillas</p>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={() => currentUser?.orgId && fetchCuadrillas(currentUser.orgId)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : cuadrillas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No hay cuadrillas registradas</p>
            <p className="text-sm text-gray-500 mb-4">Crea tu primera cuadrilla para comenzar</p>
            <button
              onClick={() => setShowModalNueva(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Nueva Cuadrilla
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cuadrillas.map((cuadrilla) => (
              <div
                key={cuadrilla.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">{getEspecialidadIcon(cuadrilla.especialidad)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cuadrilla.nombre}</h3>
                      <p className="text-sm text-gray-600">{cuadrilla.encargado}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cuadrilla.estado)}`}>
                      {cuadrilla.estado}
                    </span>
                    {/* Badge de datos incompletos */}
                    {!cuadrilla.telefonoEncargado && !cuadrilla.emailEncargado && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Datos pendientes del encargado">
                        🟡 Incompleta
                      </span>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Estás seguro de eliminar la cuadrilla "${cuadrilla.nombre}"?`)) {
                          if (currentUser?.orgId) {
                            eliminarCuadrilla(cuadrilla.id, currentUser.orgId).then((exito) => {
                              if (exito) {
                                toast({
                                  title: 'Cuadrilla eliminada',
                                  description: 'La cuadrilla fue eliminada correctamente.',
                                });
                              } else {
                                toast({
                                  title: 'Error',
                                  description: error || 'No se pudo eliminar la cuadrilla',
                                });
                              }
                            });
                          }
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar cuadrilla"
                    >
                      <Trash2 className="h-5 w-5 text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{cuadrilla.integrantes.length} integrantes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{cuadrilla.especialidad}</span>
                  </div>
                </div>

                {/* Estadísticas de tareas */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso de Tareas</span>
                    <span className="text-sm text-gray-600">
                      {cuadrilla.kpi?.tareasTerminadas || 0}/{cuadrilla.kpi?.tareasAsignadas || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${calcularPorcentajeCompletado(cuadrilla.kpi?.tareasAsignadas || 0, cuadrilla.kpi?.tareasTerminadas || 0)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {calcularPorcentajeCompletado(cuadrilla.kpi?.tareasAsignadas || 0, cuadrilla.kpi?.tareasTerminadas || 0)}% completado
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerDetalle(cuadrilla)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver Detalle</span>
                  </button>
                  <button
                    onClick={() => handleAsignarTarea(cuadrilla)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Asignar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nueva Cuadrilla */}
      {showModalNueva && (
        <ModalNuevaCuadrilla
          onClose={() => setShowModalNueva(false)}
          onGuardar={async (nuevaCuadrilla) => {
            if (currentUser?.orgId) {
              const resultado = await crearCuadrilla(nuevaCuadrilla, currentUser.orgId);
              if (resultado) {
                toast({
                  title: 'Cuadrilla creada',
                  description: 'La cuadrilla fue creada. El encargado podrá completar sus datos desde su app.',
                });
                setShowModalNueva(false);
              } else {
                toast({
                  title: 'Error',
                  description: error || 'No se pudo crear la cuadrilla',
                });
              }
            }
          }}
        />
      )}

      {/* Modal Detalle Cuadrilla */}
      {showModalDetalle && cuadrillaSeleccionada && (
        <ModalDetalleCuadrilla
          cuadrilla={cuadrillaSeleccionada}
          onClose={() => {
            setShowModalDetalle(false);
            setCuadrillaSeleccionada(null);
          }}
        />
      )}

      {/* Modal Asignación de Tareas */}
      {showModalAsignacion && cuadrillaSeleccionada && (
        <ModalAsignacionTareas
          cuadrilla={cuadrillaSeleccionada}
          obras={obrasActivas}
          tareas={[]}
          onClose={() => setShowModalAsignacion(false)}
          onAsignar={async (tareaId) => {
            // La asignación se hace dentro del modal, solo recargamos aquí
            if (currentUser?.orgId) {
              await fetchCuadrillas(currentUser.orgId);
            }
            toast({
              title: 'Tarea asignada',
              description: 'La tarea fue asignada correctamente a la cuadrilla.',
            });
          }}
        />
      )}

      {/* Modal Invitar Socio */}
      {showModalInvitarSocio && (
        <ModalInvitarSocio
          onClose={() => setShowModalInvitarSocio(false)}
          onInvitar={async (socioData) => {
              if (!currentUser?.orgId || !currentUser?.id) {
                toast({
                  title: 'Error',
                  description: 'No estás autenticado',
                });
                return;
              }

            try {
              const response = await fetch('/api/socios/invitar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-organizacion-id': currentUser.orgId,
                  'x-usuario-id': currentUser.id,
                },
                body: JSON.stringify(socioData),
              });

              const result = await response.json();

              if (result.success) {
                // Si se creó una cuadrilla, recargar la lista
                if (result.data?.cuadrilla_id && currentUser?.orgId) {
                  await fetchCuadrillas(currentUser.orgId);
                }
                
                toast({
                  title: 'Socio invitado',
                  description: result.message || 'Se envió un link de acceso al socio.',
                });
                setShowModalInvitarSocio(false);
              } else {
                toast({
                  title: 'Error',
                  description: result.error || 'No se pudo invitar al socio',
                });
              }
            } catch (error) {
              console.error('[ERROR_INVITAR_SOCIO]', error);
              toast({
                title: 'Error',
                description: 'Error al invitar al socio',
              });
            }
          }}
        />
      )}
    </div>
  );
}

// Componente Modal Invitar Socio
function ModalInvitarSocio({ onClose, onInvitar }: { 
  onClose: () => void; 
  onInvitar: (socioData: { nombre: string; email?: string; telefono?: string; rol?: string; especialidad?: string }) => Promise<void>;
}) {
  const especialidades: string[] = [
    'Albañilería / Estructura',
    'Yesería / Terminaciones',
    'Carpintería',
    'Plomería / Gas',
    'Electricidad',
    'Pintura'
  ];

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'constructor' as 'constructor' | 'lider' | 'socio',
    especialidad: '' as string
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || (!formData.email && !formData.telefono)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvitar({
        nombre: formData.nombre,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        rol: formData.rol,
        especialidad: formData.especialidad || undefined,
      });
    } catch (error) {
      console.error('[ERROR_MODAL_INVITAR_SOCIO]', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invitar Socio</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Juan Pérez"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="ejemplo@email.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="+54 9 11 1234-5678"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                <option value="constructor">Constructor</option>
                <option value="lider">Líder de Cuadrilla</option>
                <option value="socio">Socio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad
              </label>
              <select
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                <option value="">Seleccionar especialidad (opcional)</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Si seleccionás una especialidad y el rol es &quot;Líder de Cuadrilla&quot;, se creará automáticamente una cuadrilla.
              </p>
            </div>

            <p className="text-xs text-gray-500">
              * Debe proporcionar email o teléfono. Se enviará un link de acceso para que el socio se registre.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !formData.nombre || (!formData.email && !formData.telefono)}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente Modal Nueva Cuadrilla - Simplificado (solo datos mínimos)
function ModalNuevaCuadrilla({ onClose, onGuardar }: { onClose: () => void; onGuardar: (cuadrilla: Partial<Cuadrilla>) => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    encargado: '',
    especialidad: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGuardar = async () => {
    if (!formData.nombre || !formData.encargado || !formData.especialidad) {
      return;
    }

    setIsSubmitting(true);
    
    // Solo enviar los datos mínimos - el resto lo completará el encargado
    const nuevaCuadrilla: Partial<Cuadrilla> = {
      nombre: formData.nombre,
      encargado: formData.encargado,
      especialidad: formData.especialidad as any,
      estado: 'Disponible' as any,
      // No enviamos: telefonoEncargado, whatsappEncargado, emailEncargado, integrantes, documentos
      // Estos los completará el encargado desde su app
    };
    
    await onGuardar(nuevaCuadrilla);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Registrar nueva cuadrilla</h2>
        <p className="text-sm text-gray-600 mb-6">
          Ingresá los datos básicos. El encargado completará el resto desde su app.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la cuadrilla <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cuadrilla Albañilería Norte"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Seleccionar especialidad...</option>
              <option value="Albañilería / Estructura">Albañilería / Estructura</option>
              <option value="Yesería / Terminaciones">Yesería / Terminaciones</option>
              <option value="Carpintería">Carpintería</option>
              <option value="Plomería / Gas">Plomería / Gas</option>
              <option value="Electricidad">Electricidad</option>
              <option value="Pintura">Pintura</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encargado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.encargado}
              onChange={(e) => setFormData({ ...formData, encargado: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del encargado"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              El encargado podrá agregar su teléfono y email desde su app
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!formData.nombre || !formData.encargado || !formData.especialidad || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creando...' : 'Crear cuadrilla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Modal Detalle Cuadrilla
function ModalDetalleCuadrilla({ cuadrilla, onClose }: { cuadrilla: Cuadrilla; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{cuadrilla.nombre}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información General</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Encargado:</span> {cuadrilla.encargado}</p>
              <p><span className="font-medium">Especialidad:</span> {cuadrilla.especialidad}</p>
              <p><span className="font-medium">Estado:</span> {cuadrilla.estado}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Integrantes</h3>
            <div className="space-y-2">
              {cuadrilla.integrantes.map((integrante) => (
                <div key={integrante.id} className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{integrante.nombre} - {integrante.rol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{cuadrilla.kpi?.tareasAsignadas || 0}</p>
              <p className="text-sm text-gray-600">Tareas Asignadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{cuadrilla.kpi?.tareasTerminadas || 0}</p>
              <p className="text-sm text-gray-600">Completadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {(cuadrilla.kpi?.tareasAsignadas || 0) > 0 
                  ? Math.round(((cuadrilla.kpi?.tareasTerminadas || 0) / (cuadrilla.kpi?.tareasAsignadas || 1)) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">Cumplimiento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Modal Asignación de Tareas
function ModalAsignacionTareas({ cuadrilla, obras, tareas, onClose, onAsignar }: {
  cuadrilla: Cuadrilla;
  obras: Obra[];
  tareas: Tarea[];
  onClose: () => void;
  onAsignar: (tareaId: string) => void;
}) {
  const [tareasDisponibles, setTareasDisponibles] = useState<any[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string>('');
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const { currentUser } = useCurrentUser();
  const supabase = createClientComponentClient();

  // Cargar tareas reales desde Supabase
  useEffect(() => {
    const cargarTareas = async () => {
      if (!currentUser?.orgId) return;
      
      setLoadingTareas(true);
      try {
        // Primero intentar cargar todas las tareas sin asignar (sin filtrar por estado)
        let query = supabase
          .from('tareas')
          .select(`
            id,
            title,
            descripcion,
            estado,
            obra_id,
            elemento_id,
            cuadrilla_id,
            elemento:elementos(id, nombre, categoria),
            obra:obras(id, name)
          `)
          .eq('org_id', currentUser.orgId)
          .is('cuadrilla_id', null); // Solo tareas sin asignar

        // No filtrar por estado por defecto - mostrar todas las pendientes, en_progreso, etc.
        // Solo excluir las finalizadas o validadas
        query = query.not('estado', 'eq', 'finalizado').not('estado', 'eq', 'validado');
        
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error('[ERROR_CARGAR_TAREAS]', error);
        } else {
          setTareasDisponibles(data || []);
        }
      } catch (err) {
        console.error('[ERROR_CARGAR_TAREAS_EXCEPTION]', err);
      } finally {
        setLoadingTareas(false);
      }
    };

    cargarTareas();
  }, [currentUser?.orgId, supabase]);

  const handleAsignar = async () => {
    if (!tareaSeleccionada || !currentUser?.orgId) return;

    try {
      // Llamar a la API para asignar la tarea
      const response = await fetch(`/api/tareas/${tareaSeleccionada}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': currentUser.orgId,
          'x-usuario-id': currentUser.id,
        },
        body: JSON.stringify({
          cuadrilla_id: cuadrilla.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onAsignar(tareaSeleccionada);
        onClose();
      } else {
        alert(`Error: ${result.error || 'No se pudo asignar la tarea'}`);
      }
    } catch (err) {
      console.error('[ERROR_ASIGNAR_TAREA]', err);
      alert('Error al asignar la tarea');
    }
  };

  const tareasFiltradas = tareasDisponibles.filter(tarea => {
    if (obraSeleccionada && tarea.obra_id !== obraSeleccionada) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Asignar Tareas a {cuadrilla.nombre}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <p className="text-gray-600 mb-4">Selecciona una tarea pendiente para asignarla a esta cuadrilla.</p>

        {/* Filtro por obra */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por obra (opcional)
          </label>
          <select
            value={obraSeleccionada}
            onChange={(e) => setObraSeleccionada(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todas las obras ({tareasDisponibles.length} tareas)</option>
            {obras.map(obra => {
              const count = tareasDisponibles.filter(t => t.obra_id === obra.id).length;
              return (
                <option key={obra.id} value={obra.id}>
                  {obra.nombre} ({count} tareas)
                </option>
              );
            })}
          </select>
        </div>
        
        {/* Info de tareas disponibles */}
        {tareasDisponibles.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{tareasDisponibles.length}</strong> {tareasDisponibles.length === 1 ? 'tarea disponible' : 'tareas disponibles'} sin asignar
              {obraSeleccionada && (
                <span className="ml-2">
                  ({tareasFiltradas.length} para la obra seleccionada)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Lista de tareas */}
        {loadingTareas ? (
          <div className="text-center py-8 text-gray-500">Cargando tareas...</div>
        ) : tareasDisponibles.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center text-gray-600">
            <p className="mb-2">No hay tareas disponibles para asignar</p>
            <p className="text-sm text-gray-500">Todas las tareas ya están asignadas o finalizadas</p>
          </div>
        ) : tareasFiltradas.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg p-4 mb-4 text-center text-yellow-700">
            <p>No hay tareas disponibles para la obra seleccionada</p>
            <p className="text-sm text-yellow-600 mt-1">Selecciona otra obra o &quot;Todas las obras&quot;</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {tareasFiltradas.map(tarea => (
              <div
                key={tarea.id}
                onClick={() => setTareaSeleccionada(tarea.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  tareaSeleccionada === tarea.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{tarea.title}</h3>
                    <p className="text-sm text-gray-600">{tarea.descripcion || 'Sin descripción'}</p>
                    <div className="flex gap-2 mt-1">
                      {tarea.elemento && (
                        <span className="text-xs text-gray-500">
                          Elemento: {tarea.elemento.nombre}
                        </span>
                      )}
                      {tarea.obra && (
                        <span className="text-xs text-gray-500">
                          Obra: {tarea.obra.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {tareaSeleccionada === tarea.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            disabled={!tareaSeleccionada || loadingTareas}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Asignar Tarea
          </button>
        </div>
      </div>
    </div>
  );
}
