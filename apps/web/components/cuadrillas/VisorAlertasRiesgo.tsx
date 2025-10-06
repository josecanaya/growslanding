'use client';

import React, { useState } from 'react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Cuadrilla } from '@/lib/types/cuadrillas';
import { 
  X, 
  AlertTriangle, 
  Shield, 
  FileText, 
  CheckCircle, 
  Clock,
  Upload,
  Eye,
  Download,
  Calendar,
  Users,
  Phone,
  MessageCircle,
  Mail,
  Filter,
  Search
} from 'lucide-react';

interface VisorAlertasRiesgoProps {
  onClose: () => void;
}

interface AlertaRiesgo {
  id: string;
  tipo: 'SEGURO' | 'DOCUMENTO' | 'CERTIFICADO';
  cuadrillaId: string;
  cuadrillaNombre: string;
  encargado: string;
  descripcion: string;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  fechaVencimiento?: string;
  diasRestantes?: number;
  estado: 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO';
}

export function VisorAlertasRiesgo({ onClose }: VisorAlertasRiesgoProps) {
  const { cuadrillas } = useCuadrillasStore();
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Generar alertas basadas en los datos de cuadrillas
  const generarAlertas = (): AlertaRiesgo[] => {
    const alertas: AlertaRiesgo[] = [];

    cuadrillas.forEach(cuadrilla => {
      // Alertas por integrantes sin seguro
      cuadrilla.integrantes.forEach(integrante => {
        if (!integrante.seguroVigente) {
          alertas.push({
            id: `seguro-${integrante.id}`,
            tipo: 'SEGURO',
            cuadrillaId: cuadrilla.id,
            cuadrillaNombre: cuadrilla.nombre,
            encargado: cuadrilla.encargado,
            descripcion: `${integrante.nombre} (${integrante.rol || 'Integrante'}) - Sin seguro vigente`,
            severidad: 'ALTA',
            estado: 'PENDIENTE'
          });
        }
      });

      // Alertas por documentos vencidos
      cuadrilla.documentos.forEach(doc => {
        if (!doc.vigente) {
          const fechaVencimiento = doc.fechaVencimiento ? new Date(doc.fechaVencimiento) : null;
          const diasRestantes = fechaVencimiento ? Math.ceil((fechaVencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          
          alertas.push({
            id: `doc-${doc.id}`,
            tipo: 'DOCUMENTO',
            cuadrillaId: cuadrilla.id,
            cuadrillaNombre: cuadrilla.nombre,
            encargado: cuadrilla.encargado,
            descripcion: `${doc.nombre} (${doc.tipo})`,
            severidad: diasRestantes && diasRestantes < 0 ? 'ALTA' : diasRestantes && diasRestantes <= 30 ? 'MEDIA' : 'BAJA',
            fechaVencimiento: doc.fechaVencimiento,
            diasRestantes,
            estado: 'PENDIENTE'
          });
        }
      });

      // Alertas por seguridad general
      if (!cuadrilla.seguridadAlDia) {
        alertas.push({
          id: `seguridad-${cuadrilla.id}`,
          tipo: 'CERTIFICADO',
          cuadrillaId: cuadrilla.id,
          cuadrillaNombre: cuadrilla.nombre,
          encargado: cuadrilla.encargado,
          descripcion: 'Documentación de seguridad no al día',
          severidad: 'ALTA',
          estado: 'PENDIENTE'
        });
      }
    });

    return alertas;
  };

  const alertas = generarAlertas();

  // Filtrar alertas
  const alertasFiltradas = alertas.filter(alerta => {
    if (filtroTipo !== 'TODOS' && alerta.tipo !== filtroTipo) return false;
    if (filtroSeveridad !== 'TODOS' && alerta.severidad !== filtroSeveridad) return false;
    if (busqueda && !alerta.cuadrillaNombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !alerta.encargado.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Estadísticas
  const alertasAlta = alertas.filter(a => a.severidad === 'ALTA').length;
  const alertasMedia = alertas.filter(a => a.severidad === 'MEDIA').length;
  const alertasBaja = alertas.filter(a => a.severidad === 'BAJA').length;
  const alertasSeguro = alertas.filter(a => a.tipo === 'SEGURO').length;
  const alertasDocumento = alertas.filter(a => a.tipo === 'DOCUMENTO').length;

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'SEGURO': return <Shield className="h-4 w-4" />;
      case 'DOCUMENTO': return <FileText className="h-4 w-4" />;
      case 'CERTIFICADO': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'SEGURO': return 'text-red-600';
      case 'DOCUMENTO': return 'text-yellow-600';
      case 'CERTIFICADO': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas de Riesgo</h1>
            <p className="text-gray-600 mt-1">
              Gestión de documentación, seguros y certificaciones
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-900">{alertasAlta}</p>
                <p className="text-red-700">Alertas Críticas</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-900">{alertasMedia}</p>
                <p className="text-yellow-700">Alertas Medias</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-blue-900">{alertasBaja}</p>
                <p className="text-blue-700">Alertas Bajas</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-orange-900">{alertasSeguro}</p>
                <p className="text-orange-700">Sin Seguro</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-purple-900">{alertasDocumento}</p>
                <p className="text-purple-700">Docs Vencidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cuadrilla o encargado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="SEGURO">Seguros</option>
              <option value="DOCUMENTO">Documentos</option>
              <option value="CERTIFICADO">Certificados</option>
            </select>

            {/* Filtro por severidad */}
            <select
              value={filtroSeveridad}
              onChange={(e) => setFiltroSeveridad(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TODOS">Todas las severidades</option>
              <option value="ALTA">Alta severidad</option>
              <option value="MEDIA">Media severidad</option>
              <option value="BAJA">Baja severidad</option>
            </select>

            {/* Botón de acción */}
            <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Upload className="h-4 w-4" />
              <span>Subir Documento</span>
            </button>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alertasFiltradas.map(alerta => (
            <div key={alerta.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Icono del tipo */}
                  <div className={`p-3 rounded-lg ${getSeveridadColor(alerta.severidad)}`}>
                    <div className={getTipoColor(alerta.tipo)}>
                      {getTipoIcon(alerta.tipo)}
                    </div>
                  </div>

                  {/* Información de la alerta */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{alerta.cuadrillaNombre}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeveridadColor(alerta.severidad)}`}>
                        {alerta.severidad}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{alerta.descripcion}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{alerta.encargado}</span>
                      </div>
                      {alerta.fechaVencimiento && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Vence: {new Date(alerta.fechaVencimiento).toLocaleDateString()}</span>
                          {alerta.diasRestantes && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              alerta.diasRestantes < 0 ? 'bg-red-100 text-red-800' :
                              alerta.diasRestantes <= 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {alerta.diasRestantes < 0 ? 'Vencido' : 
                               alerta.diasRestantes === 0 ? 'Hoy' : 
                               `${alerta.diasRestantes} días`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Ver detalles">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Descargar">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Marcar Resuelto
                  </button>
                </div>
              </div>

              {/* Contacto rápido */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Contacto rápido:</span>
                  <button className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <Phone className="h-4 w-4" />
                    <span>Llamar</span>
                  </button>
                  <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay alertas */}
        {alertasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {alertas.length === 0 ? 'No hay alertas de riesgo' : 'No se encontraron alertas'}
            </h3>
            <p className="text-gray-600">
              {alertas.length === 0 
                ? 'Todas las cuadrillas tienen su documentación al día.' 
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Gestión de Riesgos</h4>
              <p className="text-sm text-blue-700 mt-1">
                Las alertas críticas requieren atención inmediata. Contacta a las cuadrillas para resolver 
                los problemas de documentación y seguros antes de asignar nuevas tareas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
