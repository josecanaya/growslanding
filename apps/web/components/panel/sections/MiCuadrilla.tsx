'use client';

import { useState, useEffect } from 'react';
import { Users, Phone, Mail, MapPin, Calendar, Award, Shield, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

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
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();

  // Cargar datos de la cuadrilla del socio desde Supabase
  useEffect(() => {
    const cargarDatosCuadrilla = async () => {
      if (!currentUser?.orgId || !currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar el socio del usuario actual
        let socioId: string | null = null;
        
        // Buscar socio por user_id o email
        if (currentUser.email) {
          const { data: socioData, error: socioError } = await supabase
            .from('socios')
            .select('id, nombre, email, org_id')
            .eq('org_id', currentUser.orgId)
            .eq('email', currentUser.email)
            .maybeSingle();

          if (socioData && !socioError) {
            socioId = socioData.id;
          }
        }

        if (!socioId) {
          // Si no se encontró por email, buscar por user_id
          const { data: socioData, error: socioError } = await supabase
            .from('socios')
            .select('id, nombre, user_id, org_id')
            .eq('org_id', currentUser.orgId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (socioData && !socioError) {
            socioId = socioData.id;
          }
        }

        if (!socioId) {
          console.warn('[MI_CUADRILLA] No se encontró socio para el usuario actual');
          setIntegrantes([]);
          setDocumentos([]);
          setLoading(false);
          return;
        }

        // Buscar cuadrillas donde el socio está asignado
        const { data: relacionesCuadrilla, error: relacionesError } = await supabase
          .from('cuadrilla_socios')
          .select('cuadrilla_id, rol_en_cuadrilla')
          .eq('socio_id', socioId)
          .eq('activo', true)
          .limit(1);

        if (relacionesError || !relacionesCuadrilla || relacionesCuadrilla.length === 0) {
          console.warn('[MI_CUADRILLA] El socio no está asignado a ninguna cuadrilla');
          setIntegrantes([]);
          setDocumentos([]);
          setLoading(false);
          return;
        }

        const cuadrillaId = relacionesCuadrilla[0].cuadrilla_id;

        // Cargar socios de la cuadrilla
        const response = await fetch(`/api/cuadrillas/${cuadrillaId}/socios`, {
          headers: {
            'x-organizacion-id': currentUser.orgId,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Mapear socios a integrantes
            const integrantesData: Integrante[] = result.data.map((socio: any) => ({
              id: socio.socio?.id || socio.id || '',
              nombre: socio.socio?.nombre || socio.nombre || '',
              rol: socio.rol_en_cuadrilla || socio.rol || '',
              telefono: socio.socio?.telefono || socio.telefono || '',
              seguroVigente: socio.socio?.seguro_vigente || socio.seguro_vigente || false,
              fechaIngreso: socio.fecha_ingreso || socio.fechaIngreso || '',
              especialidad: '' // Se puede obtener de la cuadrilla si es necesario
            }));
            setIntegrantes(integrantesData);
          }
        }

        // Cargar documentos de la cuadrilla (si existe endpoint)
        // Por ahora, dejar documentos vacío hasta que se implemente el endpoint
        setDocumentos([]);

      } catch (err) {
        console.error('[MI_CUADRILLA] Error al cargar datos:', err);
        setError('Error al cargar los datos de la cuadrilla');
        setIntegrantes([]);
        setDocumentos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosCuadrilla();
  }, [currentUser, supabase]);

  const integrantesSinSeguro = integrantes.filter(i => !i.seguroVigente);
  const documentosVencidos = documentos.filter(d => !d.vigente);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de la cuadrilla...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-800 mt-2">{error}</p>
        </div>
      </div>
    );
  }

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
        {integrantes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No hay integrantes asignados a tu cuadrilla</p>
            <p className="text-sm text-gray-500 mt-2">Los integrantes se cargarán cuando estén disponibles</p>
          </div>
        ) : (
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
                  {integrante.telefono && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{integrante.telefono}</span>
                    </div>
                  )}
                  {integrante.fechaIngreso && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Ingreso: {new Date(integrante.fechaIngreso).toLocaleDateString()}</span>
                    </div>
                  )}
                  {integrante.especialidad && (
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{integrante.especialidad}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentación */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-600" />
          Documentación
        </h3>
        {documentos.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No hay documentos disponibles</p>
            <p className="text-sm text-gray-500 mt-2">Los documentos se cargarán cuando estén disponibles</p>
          </div>
        ) : (
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
        )}
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