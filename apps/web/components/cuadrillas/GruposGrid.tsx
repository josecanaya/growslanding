'use client';

import { useState } from 'react';
import { Especialidad } from '@/lib/types/cuadrillas';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { AlertCircle, CheckCircle, Hammer, PaintRoller, Ruler, Wrench, Zap, Paintbrush, User, BarChart, Users, Award, Edit, ClipboardList } from 'lucide-react';

const especialidades: Especialidad[] = [
  'Albañilería / Estructura',
  'Yesería / Terminaciones', 
  'Carpintería',
  'Plomería / Gas',
  'Electricidad',
  'Pintura'
];

interface GrupoCardProps {
  especialidad: Especialidad;
  totalCuadrillas: number;
  disponibles: number;
  tareasActivas: number;
  alertas: number;
  onDoubleClick: () => void;
}

function GrupoCard({ especialidad, totalCuadrillas, disponibles, tareasActivas, alertas, onDoubleClick }: GrupoCardProps) {
  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería / Estructura': Hammer,
      'Yesería / Terminaciones': PaintRoller,
      'Carpintería': Ruler,
      'Plomería / Gas': Wrench,
      'Electricidad': Zap,
      'Pintura': Paintbrush
    };
    return iconos[especialidad as keyof typeof iconos] || Hammer;
  };

  const getEstado = () => {
    if (totalCuadrillas === 0) return { 
      label: 'Sin cuadrillas', 
      borderColor: '#cdd3db',
      bgColor: '#f5f7fa',
      dotColor: '#9aa3af'
    };
    if (disponibles === 0) return { 
      label: 'Todas ocupadas', 
      borderColor: '#1B263B',
      bgColor: '#eaf0f6',
      dotColor: '#1B263B'
    };
    return { 
      label: disponibles === totalCuadrillas ? 'Todas disponibles' : 'Parcialmente disponible', 
      borderColor: '#f4e27e',
      bgColor: '#f5f7fa',
      dotColor: '#f4e27e'
    };
  };

  const estado = getEstado();
  const IconComponent = getEspecialidadIcon(especialidad);
  const isInactive = totalCuadrillas === 0;

  return (
    <div
      className="card-cuadrilla"
      style={{
        backgroundColor: estado.bgColor,
        borderRadius: '20px',
        border: `2px solid ${estado.borderColor}`,
        boxShadow: '0 6px 14px rgba(27, 38, 59, 0.08)',
        padding: '1.8rem',
        cursor: 'pointer',
        opacity: isInactive ? 0.6 : 1,
        position: 'relative',
        minHeight: '190px',
        transition: 'border 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease'
      }}
      onClick={onDoubleClick}
      onMouseEnter={(e) => {
        if (!isInactive) {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(27, 38, 59, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(27, 38, 59, 0.08)';
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isInactive) {
          e.preventDefault();
          onDoubleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalles de ${especialidad}`}
    >
      {/* Icono y título */}
      <div className="flex items-center gap-3 mb-4">
        <IconComponent 
          className="flex-shrink-0"
          style={{
            width: '24px',
            height: '24px',
            color: '#1B263B',
            opacity: isInactive ? 0.5 : 1
          }}
        />
        <div className="flex-1">
          <h3 
            className="font-semibold leading-tight"
            style={{ 
              color: '#1B263B',
              fontSize: '1.3rem'
            }}
          >
            {especialidad}
          </h3>
        </div>
      </div>

      {/* Información de cuadrillas */}
      <p className="mb-3" style={{ color: '#10161a', opacity: 0.7, fontSize: '0.95rem' }}>
        {totalCuadrillas} {totalCuadrillas === 1 ? 'cuadrilla' : 'cuadrillas'} — {disponibles} {disponibles === 1 ? 'disponible' : 'disponibles'}
      </p>

      {/* Estado */}
      <div className="mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: estado.dotColor }}
          ></div>
          <small 
            className="font-medium"
            style={{ color: '#1B263B' }}
          >
            {estado.label}
          </small>
        </div>
      </div>

      {/* Alertas y tareas activas */}
      {(tareasActivas > 0 || alertas > 0) && (
        <div className="pt-3 border-t" style={{ borderColor: '#eaf0f6' }}>
          <div className="flex items-center justify-between text-xs">
            {tareasActivas > 0 && (
              <div className="flex items-center space-x-1" style={{ color: '#1B263B' }}>
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{tareasActivas} {tareasActivas === 1 ? 'tarea activa' : 'tareas activas'}</span>
              </div>
            )}
            {alertas > 0 && (
              <div className="flex items-center space-x-1" style={{ color: '#1B263B', opacity: 0.8 }}>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{alertas} {alertas === 1 ? 'alerta' : 'alertas'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint de click */}
      {!isInactive && (
        <div 
          className="text-right mt-3"
          style={{ 
            color: '#1B263B',
            opacity: 0.7,
            fontSize: '0.85rem'
          }}
        >
          Click para ver
        </div>
      )}
    </div>
  );
}

interface DetalleGrupoProps {
  especialidad: Especialidad;
  cuadrillas: any[];
  onBack: () => void;
}

function DetalleGrupo({ especialidad, cuadrillas, onBack }: DetalleGrupoProps) {
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState<string | null>(null);

  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería / Estructura': Hammer,
      'Yesería / Terminaciones': PaintRoller,
      'Carpintería': Ruler,
      'Plomería / Gas': Wrench,
      'Electricidad': Zap,
      'Pintura': Paintbrush
    };
    return iconos[especialidad as keyof typeof iconos] || Hammer;
  };

  const IconComponent = getEspecialidadIcon(especialidad);

  const handleToggleDetalle = (cuadrillaId: string) => {
    setCuadrillaSeleccionada((prev) => (prev === cuadrillaId ? null : cuadrillaId));
  };

  const handleAgregarCuadrilla = () => {
    setShowModalAgregar(true);
  };

  return (
    <div 
      className="grupo-container"
      style={{
        backgroundColor: '#f5f7fa',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 6px 14px rgba(27, 38, 59, 0.06)'
      }}
    >
      {/* Header con botones */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="font-medium transition-all duration-200"
          style={{
            color: '#1B263B'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          ← Volver a grupos
        </button>
        
        <button 
          onClick={handleAgregarCuadrilla}
          className="font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
          style={{
            backgroundColor: '#f4e27e',
            color: '#1B263B'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 38, 59, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)';
          }}
        >
          + Agregar cuadrilla
        </button>
      </div>

      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <IconComponent 
          style={{
            width: '28px',
            height: '28px',
            color: '#1B263B'
          }}
        />
        <h2 
          className="text-xl font-semibold"
          style={{ color: '#1B263B' }}
        >
          Cuadrillas de {especialidad}
        </h2>
      </div>

      {/* Lista de cuadrillas */}
      <div className="space-y-4">
        {cuadrillas.length === 0 ? (
          <div 
            className="col-span-full text-center py-12"
            style={{ color: '#1B263B', opacity: 0.6 }}
          >
            <p className="text-lg mb-2">No hay cuadrillas en esta especialidad</p>
            <p className="text-sm">Agregá una nueva cuadrilla para comenzar</p>
          </div>
        ) : (
          cuadrillas.map((cuadrilla) => (
            <div key={cuadrilla.id}>
              {/* Tarjeta de cuadrilla */}
              <div
                onClick={() => handleToggleDetalle(cuadrilla.id)}
                className="card-cuadrilla transition-all duration-250"
                style={{
                  backgroundColor: '#ffffff',
                  border: cuadrillaSeleccionada === cuadrilla.id ? '2px solid #1B263B' : '2px solid #f4e27e',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (cuadrillaSeleccionada !== cuadrilla.id) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(27, 38, 59, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = cuadrillaSeleccionada === cuadrilla.id 
                    ? '0 6px 18px rgba(27, 38, 59, 0.1)' 
                    : 'none';
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 
                      className="font-semibold"
                      style={{ color: '#1B263B' }}
                    >
                      {cuadrilla.nombre}
                    </h4>
                    <p 
                      className="text-sm mt-1"
                      style={{ 
                        color: '#10161a',
                        opacity: 0.75
                      }}
                    >
                      {cuadrilla.estado === 'En obra' || cuadrilla.estado === 'Ocupado' ? '🟡 Disponible' : '⚫ Ocupada'}
                    </p>
                    <p 
                      className="text-xs mt-1"
                      style={{ 
                        color: '#10161a',
                        opacity: 0.6
                      }}
                    >
                      Encargado: {cuadrilla.encargado} — {cuadrilla.integrantes?.length || 0} integrantes
                    </p>
                  </div>
                  <IconComponent 
                    style={{
                      width: '20px',
                      height: '20px',
                      color: '#1B263B'
                    }}
                  />
                </div>
              </div>

              {/* Detalle desplegable */}
              {cuadrillaSeleccionada === cuadrilla.id && (
                <div 
                  className="detalle-cuadrilla mt-3 rounded-xl transition-all duration-300 ease-in-out"
                  style={{
                    backgroundColor: '#f5f7fa',
                    borderLeft: '4px solid #f4e27e',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 6px 12px rgba(27, 38, 59, 0.08)'
                  }}
                >
                  {/* Encargado */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User style={{ width: '16px', height: '16px', color: '#1B263B' }} />
                      <h5 className="font-semibold" style={{ color: '#1B263B' }}>Encargado</h5>
                    </div>
                    <p 
                      className="text-sm ml-6"
                      style={{ color: '#10161a', opacity: 0.8 }}
                    >
                      {cuadrilla.encargado}
                    </p>
                  </div>

                  {/* Estadísticas */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart style={{ width: '16px', height: '16px', color: '#1B263B' }} />
                      <h5 className="font-semibold" style={{ color: '#1B263B' }}>Estadísticas</h5>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="font-bold text-lg" style={{ color: '#1B263B' }}>
                          {cuadrilla.kpi?.tareasEnEjecucion || 0}
                        </p>
                        <small style={{ color: '#10161a', opacity: 0.7 }}>En ejecución</small>
                      </div>
                      <div>
                        <p className="font-bold text-lg" style={{ color: '#1B263B' }}>
                          {cuadrilla.kpi?.tareasTerminadas || 0}
                        </p>
                        <small style={{ color: '#10161a', opacity: 0.7 }}>Terminadas</small>
                      </div>
                      <div>
                        <p className="font-bold text-lg" style={{ color: '#1B263B' }}>
                          {cuadrilla.kpi?.cumplimiento || 0}%
                        </p>
                        <small style={{ color: '#10161a', opacity: 0.7 }}>Cumplimiento</small>
                      </div>
                    </div>
                  </div>

                  {/* Integrantes */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users style={{ width: '16px', height: '16px', color: '#1B263B' }} />
                      <h5 className="font-semibold" style={{ color: '#1B263B' }}>Integrantes</h5>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {cuadrilla.integrantes?.slice(0, 5).map((integrante: any, index: number) => (
                        <li 
                          key={index} 
                          className="flex justify-between text-sm"
                          style={{ color: '#10161a', opacity: 0.85 }}
                        >
                          <span>{integrante.nombre}</span>
                          <span style={{ opacity: 0.6 }}>{integrante.telefono || 'Sin teléfono'}</span>
                        </li>
                      ))}
                      {cuadrilla.integrantes?.length > 5 && (
                        <li 
                          className="text-sm"
                          style={{ color: '#1B263B', opacity: 0.7 }}
                        >
                          + {cuadrilla.integrantes.length - 5} más...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button 
                      className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                      style={{
                        backgroundColor: '#f4e27e',
                        color: '#1B263B'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 38, 59, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <ClipboardList style={{ width: '16px', height: '16px' }} />
                      Asignar Tarea
                    </button>
                    <button 
                      className="py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                      style={{
                        color: '#1B263B',
                        border: '1px solid #1B263B',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eaf0f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Edit style={{ width: '16px', height: '16px' }} />
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Agregar Cuadrilla */}
      {showModalAgregar && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={() => setShowModalAgregar(false)}
          >
            {/* Modal */}
            <div 
              className="relative rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
              style={{
                backgroundColor: '#ffffff'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: '#1B263B' }}
                >
                  Agregar Cuadrilla
                </h3>
                <button
                  onClick={() => setShowModalAgregar(false)}
                  className="rounded-lg p-1 transition-all duration-200"
                  style={{
                    color: '#1B263B'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eaf0f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Contenido */}
              <p 
                className="mb-6 text-sm"
                style={{ color: '#10161a', opacity: 0.7 }}
              >
                Funcionalidad de creación de cuadrilla en desarrollo.
                <br />
                Por ahora, las cuadrillas se gestionan desde el sistema principal.
              </p>

              {/* Footer */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModalAgregar(false)}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  style={{
                    backgroundColor: '#f5f7fa',
                    color: '#1B263B',
                    border: '1px solid #dce3ea'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eaf0f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function GruposGrid() {
  const { cuadrillas, setFiltros } = useCuadrillasStore();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Especialidad | null>(null);

  const handleOpenGrupo = (especialidad: Especialidad) => {
    setGrupoSeleccionado(especialidad);
  };

  const handleBack = () => {
    setGrupoSeleccionado(null);
  };

  // Calcular estadísticas por especialidad
  const getEstadisticasGrupo = (especialidad: Especialidad) => {
    const cuadrillasGrupo = cuadrillas.filter(c => c.especialidad === especialidad);
    const disponibles = cuadrillasGrupo.filter(c => c.estado === 'Disponible').length;
    
    // Simular tareas activas y alertas (puedes reemplazar con datos reales)
    const tareasActivas = cuadrillasGrupo.reduce((sum, c) => {
      // Si la cuadrilla está ocupada, cuenta como tarea activa
      return sum + (c.estado === 'Ocupado' ? 1 : 0);
    }, 0);
    
    const alertas = cuadrillasGrupo.reduce((sum, c) => {
      // Si hay alertas en la cuadrilla (puedes agregar esta lógica)
      return sum + (c.estado === 'Inactivo' ? 1 : 0);
    }, 0);

    return {
      totalCuadrillas: cuadrillasGrupo.length,
      disponibles,
      tareasActivas,
      alertas
    };
  };

  // Si hay un grupo seleccionado, mostrar la vista de detalle
  if (grupoSeleccionado) {
    const cuadrillasGrupo = cuadrillas.filter(c => c.especialidad === grupoSeleccionado);
    
    return (
      <DetalleGrupo
        especialidad={grupoSeleccionado}
        cuadrillas={cuadrillasGrupo}
        onBack={handleBack}
      />
    );
  }

  // Vista de grid principal
  return (
    <div 
      className="cuadrillas-container"
      style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))',
        gap: '2rem',
        padding: '1rem 2rem',
        backgroundColor: '#eaf0f6'
      }}
    >
      {especialidades.map((especialidad) => {
        const stats = getEstadisticasGrupo(especialidad);

        return (
          <GrupoCard
            key={especialidad}
            especialidad={especialidad}
            totalCuadrillas={stats.totalCuadrillas}
            disponibles={stats.disponibles}
            tareasActivas={stats.tareasActivas}
            alertas={stats.alertas}
            onDoubleClick={() => handleOpenGrupo(especialidad)}
          />
        );
      })}
    </div>
  );
}

