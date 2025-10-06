'use client';

import { useState } from 'react';
import { Users, Phone, Mail, MapPin, Calendar, Award, Shield, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface Integrante {
  id: string;
  nombre: string;
  rol: string;
  telefono: string;
  seguroVigente: boolean;
  fechaIngreso: string;
  especialidad: string;
}

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  vigente: boolean;
  fechaVencimiento?: string;
}

interface MiCuadrillaProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function MiCuadrilla({ user }: MiCuadrillaProps) {
  const [integrantes, setIntegrantes] = useState<Integrante[]>([
    {
      id: '1',
      nombre: 'Carlos Mendoza',
      rol: 'Encargado',
      telefono: '+54 11 1234-5678',
      seguroVigente: true,
      fechaIngreso: '2021-03-15',
      especialidad: 'Albañilería'
    },
    {
      id: '2',
      nombre: 'Roberto Silva',
      rol: 'Oficial',
      telefono: '+54 11 2345-6789',
      seguroVigente: true,
      fechaIngreso: '2021-06-20',
      especialidad: 'Albañilería'
    },
    {
      id: '3',
      nombre: 'Miguel Torres',
      rol: 'Ayudante',
      telefono: '+54 11 3456-7890',
      seguroVigente: false,
      fechaIngreso: '2022-01-10',
      especialidad: 'Albañilería'
    }
  ]);

  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      id: '1',
      tipo: 'ART',
      nombre: 'ART Albañilería Norte',
      vigente: true,
      fechaVencimiento: '2025-12-31'
    },
    {
      id: '2',
      tipo: 'Seguro',
      nombre: 'Seguro de Accidentes',
      vigente: true,
      fechaVencimiento: '2025-11-01'
    },
    {
      id: '3',
      tipo: 'Certificado',
      nombre: 'Certificado de Capacitación',
      vigente: false
    }
  ]);

  const integrantesSinSeguro = integrantes.filter(i => !i.seguroVigente);
  const documentosVencidos = documentos.filter(d => !d.vigente);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mi Cuadrilla</h2>
        <p className="text-sm text-gray-600">
          {integrantes.length} integrantes • {documentos.length} documentos
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: '#1A202C' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: '#A0AEC0' }}>Integrantes</div>
              <div className="text-2xl font-bold" style={{ color: '#FEEB70' }}>{integrantes.length}</div>
            </div>
            <Users className="h-8 w-8" style={{ color: '#FEEB70' }} />
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: '#008080' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: '#FFFFFF' }}>Seguros al día</div>
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {integrantes.filter(i => i.seguroVigente).length}
              </div>
            </div>
            <Shield className="h-8 w-8" style={{ color: '#FFFFFF' }} />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(integrantesSinSeguro.length > 0 || documentosVencidos.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Atención requerida</h3>
          </div>
          {integrantesSinSeguro.length > 0 && (
            <p className="text-sm text-red-700 mb-1">
              {integrantesSinSeguro.length} integrante(s) sin seguro vigente
            </p>
          )}
          {documentosVencidos.length > 0 && (
            <p className="text-sm text-red-700">
              {documentosVencidos.length} documento(s) vencido(s)
            </p>
          )}
        </div>
      )}

      {/* Integrantes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-gray-600" />
          Integrantes
        </h3>
        <div className="space-y-3">
          {integrantes.map((integrante) => (
            <div key={integrante.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{integrante.nombre}</h4>
                  <p className="text-sm text-gray-600">{integrante.rol}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {integrante.seguroVigente ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Seguro al día
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Sin seguro
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{integrante.telefono}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Ingreso: {new Date(integrante.fechaIngreso).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{integrante.especialidad}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentación */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-600" />
          Documentación
        </h3>
        <div className="space-y-3">
          {documentos.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{doc.nombre}</h4>
                  <p className="text-sm text-gray-600">{doc.tipo}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.vigente ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Vigente
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Vencido
                    </span>
                  )}
                </div>
              </div>
              {doc.fechaVencimiento && (
                <div className="text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Vencimiento: {new Date(doc.fechaVencimiento).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-lg p-4" style={{ backgroundColor: '#1A202C' }}>
        <h3 className="font-semibold mb-3" style={{ color: '#FFFFFF' }}>Acciones rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 text-white py-3 px-4 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
            <Users className="h-4 w-4" />
            <span>Agregar integrante</span>
          </button>
          <button className="flex items-center justify-center space-x-2 text-white py-3 px-4 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#008080', color: '#FFFFFF' }}>
            <FileText className="h-4 w-4" />
            <span>Subir documento</span>
          </button>
        </div>
      </div>
    </div>
  );
}