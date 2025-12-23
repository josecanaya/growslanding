'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Phone, Mail, MapPin, Calendar, Award, Shield, FileText, CheckCircle, AlertTriangle, Loader2, Camera, UserPlus, Upload } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

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

type SupabaseSocioRecord = {
  id: string;
  nombre?: string | null;
  email?: string | null;
  user_id?: string | null;
  org_id?: string | null;
};

type SupabaseCuadrillaSocioRecord = {
  cuadrilla_id: string;
  rol_en_cuadrilla?: string | null;
};

interface MiCuadrillaProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function MiCuadrilla({ user }: MiCuadrillaProps) {
  const router = useRouter();
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAgregarIntegrante, setShowAgregarIntegrante] = useState(false);
  const [showSubirDocumento, setShowSubirDocumento] = useState(false);
  
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  
  // Refs para scroll
  const integrantesRef = useRef<HTMLDivElement>(null);
  const documentosRef = useRef<HTMLDivElement>(null);

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

          const socioRecord = socioData as SupabaseSocioRecord | null;
          if (socioRecord && !socioError) {
            socioId = socioRecord.id;
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

          const socioRecord = socioData as SupabaseSocioRecord | null;
          if (socioRecord && !socioError) {
            socioId = socioRecord.id;
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

        const relaciones = (relacionesCuadrilla as SupabaseCuadrillaSocioRecord[] | null) ?? [];

        if (relacionesError || relaciones.length === 0) {
          console.warn('[MI_CUADRILLA] El socio no está asignado a ninguna cuadrilla');
          setIntegrantes([]);
          setDocumentos([]);
          setLoading(false);
          return;
        }

        const cuadrillaId = relaciones[0].cuadrilla_id;

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
  const segurosAlDia = integrantes.filter(i => i.seguroVigente).length;

  // Funciones para scroll
  const scrollToIntegrantes = () => {
    integrantesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToDocumentos = () => {
    documentosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center w-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de la cuadrilla...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full">
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
    <div className="w-full px-4 py-6 space-y-6">
      {/* Header compacto */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Mi cuadrilla</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Equipo de trabajo y documentación
        </p>
      </div>

      {/* Accesos rápidos circulares */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push('/socio/evidencias')}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200 group-active:scale-95">
            <Camera className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-colors" strokeWidth={2} />
          </div>
          <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 text-center leading-tight transition-colors">
            Historial
          </p>
        </button>

        <button
          onClick={scrollToIntegrantes}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200 group-active:scale-95">
            <Users className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-colors" strokeWidth={2} />
          </div>
          <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 text-center leading-tight transition-colors">
            Integrantes
          </p>
        </button>

        <button
          onClick={scrollToDocumentos}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200 group-active:scale-95">
            <FileText className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-colors" strokeWidth={2} />
          </div>
          <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 text-center leading-tight transition-colors">
            Documentos
          </p>
        </button>

        <button
          onClick={scrollToIntegrantes}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200 group-active:scale-95">
            <Shield className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-colors" strokeWidth={2} />
          </div>
          <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 text-center leading-tight transition-colors">
            Seguros
          </p>
        </button>
      </div>

      {/* Sección Integrantes */}
      <div ref={integrantesRef} className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Integrantes</h3>
          <button 
            onClick={() => setShowAgregarIntegrante(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:shadow-sm group"
          >
            <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-xs font-medium">Agregar</span>
          </button>
        </div>
        {integrantes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              No hay integrantes asignados a tu cuadrilla
            </p>
            <p className="text-xs text-gray-500">
              Los integrantes se cargarán cuando estén disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrantes.map((integrante) => (
              <div key={integrante.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{integrante.nombre}</h4>
                    <p className="text-xs text-gray-600">{integrante.rol}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {integrante.seguroVigente ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Seguro al día
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Sin seguro
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  {integrante.telefono && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-2 text-gray-400" />
                      <span>{integrante.telefono}</span>
                    </div>
                  )}
                  {integrante.fechaIngreso && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                      <span>Ingreso: {new Date(integrante.fechaIngreso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección Documentación */}
      <div ref={documentosRef} className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Documentación</h3>
          <button 
            onClick={() => setShowSubirDocumento(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-all duration-200 hover:shadow-sm group"
          >
            <Upload className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-xs font-medium">Subir</span>
          </button>
        </div>
        {documentos.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              No hay documentos disponibles
            </p>
            <p className="text-xs text-gray-500">
              Los documentos se cargarán cuando estén disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documentos.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{doc.nombre}</h4>
                    <p className="text-xs text-gray-600">{doc.tipo}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.vigente ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Vigente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Vencido
                      </span>
                    )}
                  </div>
                </div>
                {doc.fechaVencimiento && (
                  <div className="text-xs text-gray-600 flex items-center">
                    <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                    <span>Vencimiento: {new Date(doc.fechaVencimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar Integrante */}
      <Dialog open={showAgregarIntegrante} onOpenChange={setShowAgregarIntegrante}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar integrante</DialogTitle>
            <DialogDescription>
              Agrega un nuevo integrante a tu cuadrilla. Completa los datos requeridos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" placeholder="Ej: Juan Pérez" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="ejemplo@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" type="tel" placeholder="+54 9 11 1234-5678" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rol">Rol en la cuadrilla</Label>
              <Input id="rol" placeholder="Ej: Albañil, Capataz, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAgregarIntegrante(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: 'Funcionalidad en desarrollo',
                  description: 'La funcionalidad de agregar integrantes estará disponible próximamente.',
                });
                setShowAgregarIntegrante(false);
              }}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Subir Documento */}
      <Dialog open={showSubirDocumento} onOpenChange={setShowSubirDocumento}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
            <DialogDescription>
              Sube un documento para tu cuadrilla. Asegúrate de que esté actualizado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo-documento">Tipo de documento</Label>
              <Input id="tipo-documento" placeholder="Ej: Seguro, Certificado, etc." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nombre-documento">Nombre del documento</Label>
              <Input id="nombre-documento" placeholder="Ej: Seguro ARBA 2024" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="archivo">Archivo</Label>
              <Input id="archivo" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vencimiento">Fecha de vencimiento (opcional)</Label>
              <Input id="vencimiento" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubirDocumento(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: 'Funcionalidad en desarrollo',
                  description: 'La funcionalidad de subir documentos estará disponible próximamente.',
                });
                setShowSubirDocumento(false);
              }}
            >
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
