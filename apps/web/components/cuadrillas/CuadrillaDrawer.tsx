'use client';

import { useState, useEffect } from 'react';
import { Cuadrilla } from '@/lib/types/cuadrillas';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ModalAgregarSocio } from './ModalAgregarSocio';
import { 
  X, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MapPin,
  Calendar,
  Settings,
  Plus,
  Download,
  Eye,
  Star,
  Award,
  TrendingUp,
  Phone,
  MessageCircle,
  Mail,
  Shield,
  MessageSquare,
  History
} from 'lucide-react';

interface CuadrillaDrawerProps {
  cuadrilla: Cuadrilla | null;
}

interface SocioEnCuadrilla {
  id: string;
  rol_cuadrilla: string;
  activo: boolean;
  socio: {
    id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
    rol: string;
    status: string;
  };
}

export function CuadrillaDrawer({ cuadrilla }: CuadrillaDrawerProps) {
  const { showDrawer, cerrarDrawer, abrirModalAsignacion } = useCuadrillasStore();
  const currentUser = useCurrentUser();
  const [showModalSocios, setShowModalSocios] = useState(false);
  const [sociosEnCuadrilla, setSociosEnCuadrilla] = useState<SocioEnCuadrilla[]>([]);
  const [loadingSocios, setLoadingSocios] = useState(false);

  // Cargar socios de la cuadrilla
  const cuadrillaId = cuadrilla?.id;

  useEffect(() => {
    const cargarSocios = async () => {
      if (!cuadrillaId || !currentUser?.orgId) return;

      try {
        setLoadingSocios(true);
        const response = await fetch(`/api/cuadrillas/${cuadrillaId}/socios`, {
          headers: {
            'x-organizacion-id': currentUser.orgId,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSociosEnCuadrilla(result.data || []);
          }
        }
      } catch (error) {
        console.error('[CUADRILLA_DRAWER] Error al cargar socios:', error);
      } finally {
        setLoadingSocios(false);
      }
    };

    if (showDrawer && cuadrillaId) {
      cargarSocios();
    }
  }, [cuadrillaId, currentUser?.orgId, showDrawer]);

  if (!showDrawer || !cuadrilla) return null;

  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería / Estructura': '🏗️',
      'Yesería / Terminaciones': '🎨',
      'Carpintería': '🔨',
      'Plomería / Gas': '🔧',
      'Electricidad': '⚡',
      'Pintura': '🖌️'
    };
    return iconos[especialidad as keyof typeof iconos] || '👷‍♂️';
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      'Disponible': 'bg-green-100 text-green-800',
      'Ocupada': 'bg-yellow-100 text-yellow-800',
      'En obra': 'bg-blue-100 text-blue-800',
      'Inactiva': 'bg-gray-100 text-gray-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEtapaColor = (etapa: string) => {
    const colores = {
      'estructura': 'bg-blue-100 text-blue-800',
      'obra_gris': 'bg-gray-100 text-gray-800',
      'terminaciones': 'bg-green-100 text-green-800'
    };
    return colores[etapa as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTareaColor = (estado: string) => {
    const colores = {
      'ASIGNADA': 'bg-yellow-100 text-yellow-800',
      'EN_EJECUCION': 'bg-blue-100 text-blue-800',
      'TERMINADA': 'bg-green-100 text-green-800',
      'VALIDADA': 'bg-purple-100 text-purple-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const integrantesSinSeguro = cuadrilla.integrantes.filter(i => !i.seguroVigente);
  const documentosVencidos = cuadrilla.documentos.filter(d => !d.vigente);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={cerrarDrawer}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getEspecialidadIcon(cuadrilla.especialidad)}</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{cuadrilla.nombre}</h2>
                <p className="text-sm text-gray-600">{cuadrilla.encargado}</p>
              </div>
            </div>
            <button
              onClick={cerrarDrawer}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Estado y especialidad */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(cuadrilla.estado)}`}>
                {cuadrilla.estado}
              </span>
              <span className="text-sm text-gray-600">{cuadrilla.especialidad}</span>
            </div>

            {/* Información del encargado */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Encargado
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {cuadrilla.encargado.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{cuadrilla.encargado}</p>
                  <p className="text-sm text-gray-600">{cuadrilla.antiguedad}</p>
                  <div className="flex items-center mt-1">
                    {renderStars(cuadrilla.valoracionPromedio)}
                    <span className="ml-2 text-sm text-gray-600">
                      ({cuadrilla.valoracionPromedio}/5)
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPIs expandidos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Estadísticas Detalladas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{cuadrilla.kpi.tareasEnEjecucion}</p>
                  <p className="text-xs text-gray-600">En ejecución</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{cuadrilla.kpi.tareasTerminadas}</p>
                  <p className="text-xs text-gray-600">Terminadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{cuadrilla.kpi.tareasAsignadas}</p>
                  <p className="text-xs text-gray-600">Asignadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{cuadrilla.cumplimientoTiempo}%</p>
                  <p className="text-xs text-gray-600">Cumplimiento</p>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cuadrilla.kpi.cumplimientoPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Badges */}
            {cuadrilla.badges.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Reconocimientos ({cuadrilla.badges.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {cuadrilla.badges.map((badge) => (
                    <div key={badge.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{badge.icono}</span>
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900">{badge.titulo}</p>
                          <p className="text-sm text-yellow-700">{badge.descripcion}</p>
                          <p className="text-xs text-yellow-600 mt-1">
                            Obtenido: {new Date(badge.fechaObtenido).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Socios de la cuadrilla (nuevo sistema con tabla cuadrilla_socios) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Socios ({sociosEnCuadrilla.length})
                </h3>
                <button 
                  onClick={() => setShowModalSocios(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar socio
                </button>
              </div>
              
              {loadingSocios ? (
                <div className="text-center py-4 text-gray-500">
                  Cargando socios...
                </div>
              ) : sociosEnCuadrilla.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay socios asignados a esta cuadrilla</p>
                  <button
                    onClick={() => setShowModalSocios(true)}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Agregar primer socio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sociosEnCuadrilla.map((item) => {
                    const socio = item.socio;
                    const rolBadgeColor = item.rol_cuadrilla === 'encargado' 
                      ? 'bg-blue-100 text-blue-800'
                      : item.rol_cuadrilla === 'oficial'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800';
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {socio.nombre?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900 text-sm">{socio.nombre}</p>
                              <span className={`px-2 py-0.5 text-xs rounded ${rolBadgeColor}`}>
                                {item.rol_cuadrilla}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {socio.email || socio.telefono || 'Sin contacto'}
                            </p>
                            {socio.rol && (
                              <p className="text-xs text-gray-500 mt-0.5">Rol: {socio.rol}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.activo ? (
                            <span className="inline-flex" title="Activo">
                              <CheckCircle className="h-4 w-4 text-green-500" aria-label="Activo" />
                            </span>
                          ) : (
                            <span className="inline-flex" title="Inactivo">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="Inactivo" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Integrantes */}
            {cuadrilla.integrantes && cuadrilla.integrantes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Integrantes adicionales ({cuadrilla.integrantes.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {cuadrilla.integrantes.map((integrante) => (
                    <div key={integrante.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {integrante.nombre.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{integrante.nombre}</p>
                          <p className="text-xs text-gray-600">{integrante.rol}</p>
                          {integrante.telefono && (
                            <p className="text-xs text-gray-500">{integrante.telefono}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {integrante.seguroVigente ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Alertas de seguros */}
                {integrantesSinSeguro.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {integrantesSinSeguro.length} integrante(s) sin seguro vigente
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documentos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentación ({cuadrilla.documentos.length})
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Agregar
                </button>
              </div>
              <div className="space-y-3">
                {cuadrilla.documentos.map((documento) => (
                  <div key={documento.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{documento.nombre}</p>
                        <p className="text-xs text-gray-600">{documento.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {documento.vigente ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Alertas de documentos */}
              {documentosVencidos.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {documentosVencidos.length} documento(s) vencido(s)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback histórico */}
            {cuadrilla.feedback.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback Histórico ({cuadrilla.feedback.length})
                </h3>
                <div className="space-y-3">
                  {cuadrilla.feedback.slice(0, 3).map((feedback) => (
                    <div key={feedback.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {renderStars(feedback.puntuacion)}
                            <span className="text-sm font-medium text-blue-900">
                              {feedback.obraNombre}
                            </span>
                          </div>
                          <p className="text-sm text-blue-800">{feedback.comentario}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {feedback.autor} • {new Date(feedback.fecha).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cuadrilla.feedback.length > 3 && (
                    <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
                      Ver {cuadrilla.feedback.length - 3} comentarios más
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Asignaciones activas */}
            {cuadrilla.asignaciones && cuadrilla.asignaciones.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Asignaciones Activas ({cuadrilla.asignaciones.length})
                  </h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <Plus className="h-4 w-4 mr-1 inline" />
                    Nueva
                  </button>
                </div>
                <div className="space-y-3">
                  {cuadrilla.asignaciones.map((asignacion, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 text-sm">{asignacion.tareaNombre}</p>
                          <p className="text-xs text-blue-700 mt-1">{asignacion.obraNombre}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEtapaColor(asignacion.etapa)}`}>
                              {asignacion.etapa}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoTareaColor(asignacion.estado)}`}>
                              {asignacion.estado}
                            </span>
                          </div>
                          {asignacion.fechaInicio && (
                            <p className="text-xs text-blue-600 mt-1">
                              Inicio: {new Date(asignacion.fechaInicio).toLocaleDateString('es-AR')}
                            </p>
                          )}
                        </div>
                        <button className="text-blue-400 hover:text-blue-600">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="border-t border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  abrirModalAsignacion();
                  cerrarDrawer();
                }}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Asignar Tarea</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                <Settings className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para gestionar socios */}
      {showModalSocios && cuadrilla && (
        <ModalAgregarSocio
          cuadrillaId={cuadrilla.id}
          cuadrillaNombre={cuadrilla.nombre}
          onClose={() => {
            setShowModalSocios(false);
            // Recargar socios después de cerrar
            if (cuadrilla?.id && currentUser?.orgId) {
              fetch(`/api/cuadrillas/${cuadrilla.id}/socios`, {
                headers: { 'x-organizacion-id': currentUser.orgId },
              })
                .then(res => res.json())
                .then(result => {
                  if (result.success) {
                    setSociosEnCuadrilla(result.data || []);
                  }
                })
                .catch(console.error);
            }
          }}
          onSocioAgregado={() => {
            // Recargar socios
            if (cuadrilla?.id && currentUser?.orgId) {
              fetch(`/api/cuadrillas/${cuadrilla.id}/socios`, {
                headers: { 'x-organizacion-id': currentUser.orgId },
              })
                .then(res => res.json())
                .then(result => {
                  if (result.success) {
                    setSociosEnCuadrilla(result.data || []);
                  }
                })
                .catch(console.error);
            }
          }}
        />
      )}
    </>
  );
}
