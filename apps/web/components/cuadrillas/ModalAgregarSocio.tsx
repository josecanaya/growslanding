'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Search, Loader2, UserPlus } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';

interface Socio {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rol: string;
  status: string;
}

interface ModalAgregarSocioProps {
  cuadrillaId: string;
  cuadrillaNombre: string;
  onClose: () => void;
  onSocioAgregado: () => void;
}

export function ModalAgregarSocio({
  cuadrillaId,
  cuadrillaNombre,
  onClose,
  onSocioAgregado,
}: ModalAgregarSocioProps) {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [sociosEnCuadrilla, setSociosEnCuadrilla] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRol, setSelectedRol] = useState<'encargado' | 'oficial' | 'ayudante' | 'integrante'>('integrante');
  const [agregando, setAgregando] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();

  // Cargar socios disponibles y socios ya en la cuadrilla
  useEffect(() => {
    const cargarDatos = async () => {
      if (!currentUser?.orgId) return;

      try {
        setLoading(true);

        // 1. Cargar socios de la cuadrilla actual
        const responseCuadrilla = await fetch(`/api/cuadrillas/${cuadrillaId}/socios`, {
          headers: {
            'x-organizacion-id': currentUser.orgId,
          },
        });

        if (responseCuadrilla.ok) {
          const result = await responseCuadrilla.json();
          if (result.success) {
            const idsEnCuadrilla = result.data.map((item: any) => item.socio?.id || item.socio_id).filter(Boolean);
            setSociosEnCuadrilla(idsEnCuadrilla);
          }
        }

        // 2. Cargar todos los socios activos de la organización
        const { data: sociosData, error: sociosError } = await supabase
          .from('socios')
          .select('id, nombre, email, telefono, rol, status')
          .eq('org_id', currentUser.orgId)
          .eq('status', 'activo')
          .order('nombre', { ascending: true });

        if (sociosError) {
          console.error('[MODAL_AGREGAR_SOCIO] Error al cargar socios:', sociosError);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar los socios',
            variant: 'destructive',
          });
        } else {
          setSocios(sociosData || []);
        }
      } catch (error) {
        console.error('[MODAL_AGREGAR_SOCIO] Error:', error);
        toast({
          title: 'Error',
          description: 'Error al cargar los datos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [cuadrillaId, currentUser?.orgId, supabase, toast]);

  const handleAgregarSocio = async (socioId: string) => {
    if (!currentUser?.orgId) return;

    try {
      setAgregando(socioId);

      const response = await fetch(`/api/cuadrillas/${cuadrillaId}/socios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': currentUser.orgId,
        },
        body: JSON.stringify({
          socio_id: socioId,
          rol: selectedRol,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al agregar socio');
      }

      toast({
        title: 'Éxito',
        description: `Socio agregado a la cuadrilla como ${selectedRol}`,
      });

      // Actualizar lista local
      setSociosEnCuadrilla([...sociosEnCuadrilla, socioId]);
      onSocioAgregado();
    } catch (error) {
      console.error('[MODAL_AGREGAR_SOCIO] Error al agregar:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al agregar socio a la cuadrilla',
        variant: 'destructive',
      });
    } finally {
      setAgregando(null);
    }
  };

  const handleRemoverSocio = async (socioId: string) => {
    if (!currentUser?.orgId) return;

    try {
      setAgregando(socioId);

      const response = await fetch(`/api/cuadrillas/${cuadrillaId}/socios?socio_id=${socioId}`, {
        method: 'DELETE',
        headers: {
          'x-organizacion-id': currentUser.orgId,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al remover socio');
      }

      toast({
        title: 'Éxito',
        description: 'Socio removido de la cuadrilla',
      });

      // Actualizar lista local
      setSociosEnCuadrilla(sociosEnCuadrilla.filter(id => id !== socioId));
      onSocioAgregado();
    } catch (error) {
      console.error('[MODAL_AGREGAR_SOCIO] Error al remover:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al remover socio de la cuadrilla',
        variant: 'destructive',
      });
    } finally {
      setAgregando(null);
    }
  };

  // Filtrar socios
  const sociosFiltrados = socios.filter(socio => {
    if (sociosEnCuadrilla.includes(socio.id)) return false; // No mostrar los que ya están
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      socio.nombre?.toLowerCase().includes(searchLower) ||
      socio.email?.toLowerCase().includes(searchLower) ||
      socio.telefono?.includes(searchTerm)
    );
  });

  const sociosEnCuadrillaData = socios.filter(s => sociosEnCuadrilla.includes(s.id));

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-center text-gray-600">Cargando socios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestionar Socios de la Cuadrilla</h2>
            <p className="text-sm text-gray-600 mt-1">{cuadrillaNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol para nuevos socios:
            </label>
            <select
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="integrante">Integrante</option>
              <option value="encargado">Encargado</option>
              <option value="oficial">Oficial</option>
              <option value="ayudante">Ayudante</option>
            </select>
          </div>

          {/* Socios ya en la cuadrilla */}
          {sociosEnCuadrillaData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Socios en la cuadrilla ({sociosEnCuadrillaData.length})
              </h3>
              <div className="space-y-2">
                {sociosEnCuadrillaData.map((socio) => (
                  <div
                    key={socio.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {socio.nombre?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{socio.nombre}</p>
                        <p className="text-sm text-gray-600">{socio.email || socio.telefono || 'Sin contacto'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoverSocio(socio.id)}
                      disabled={agregando === socio.id}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {agregando === socio.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Remover'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buscar y agregar socios */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Agregar socio a la cuadrilla</h3>
            
            {/* Buscador */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Lista de socios disponibles */}
            {sociosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron socios con ese criterio' : 'Todos los socios ya están en la cuadrilla'}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sociosFiltrados.map((socio) => (
                  <div
                    key={socio.id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {socio.nombre?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{socio.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {socio.email || socio.telefono || 'Sin contacto'}
                        </p>
                        {socio.rol && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            {socio.rol}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAgregarSocio(socio.id)}
                      disabled={agregando === socio.id}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {agregando === socio.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Agregando...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

