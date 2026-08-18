'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Usuario {
  id: string;
  nombre: string;
  tipo: 'cliente' | 'socio' | 'supervisor';
  email?: string;
}

interface SelectUsuarioProps {
  obraId: string | null;
  value?: string | null;
  onValueChange: (usuarioId: string | null, usuarioTipo: 'cliente' | 'socio' | null) => void;
  role: 'cliente' | 'socio';
  currentUserId: string;
}

// Función helper para convertir tipo de usuario al formato esperado
function normalizeUsuarioTipo(tipo: 'cliente' | 'socio' | 'supervisor' | undefined): 'cliente' | 'socio' | null {
  if (tipo === 'cliente') {
    return 'cliente';
  }
  if (tipo === 'socio') {
    return 'socio';
  }
  if (tipo === 'supervisor') {
    return 'socio'; // Tratar supervisor como socio para el chat
  }
  return null;
}

/**
 * Selector de usuario para el chat, filtrado por obra
 * Cliente: muestra socios asignados a la obra
 * Socio: muestra cliente técnico + otros socios de la obra
 */
export function SelectUsuario({
  obraId,
  value,
  onValueChange,
  role,
  currentUserId,
}: SelectUsuarioProps) {
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarUsuarios = async () => {
      if (!obraId || !currentUser?.orgId) {
        setUsuarios([]);
        return;
      }

      setLoading(true);
      try {
        const supabaseAny = supabase as any;

        if (role === 'cliente') {
          // Cliente: todos los socios de esa obra
          // Obtener cuadrillas de la obra
          const { data: cuadrillasData } = await supabaseAny
            .from('cuadrillas')
            .select('id')
            .eq('obra_id', obraId);

          if (!cuadrillasData || cuadrillasData.length === 0) {
            setUsuarios([]);
            setLoading(false);
            return;
          }

          const cuadrillaIds = cuadrillasData.map((c: any) => c.id);

          // Obtener socios de esas cuadrillas
          const { data: sociosData, error } = await supabaseAny
            .from('cuadrilla_socios')
            .select('socio_id, socios:id,nombre,email')
            .in('cuadrilla_id', cuadrillaIds)
            .eq('activo', true);

          if (error) throw error;

          // Extraer socios únicos
          const sociosUnicos = new Map<string, Usuario>();
          (sociosData || []).forEach((item: any) => {
            if (item.socio_id && item.socios && item.socio_id !== currentUserId) {
              sociosUnicos.set(item.socio_id, {
                id: item.socio_id,
                nombre: item.socios.nombre || 'Socio sin nombre',
                tipo: 'socio',
                email: item.socios.email,
              });
            }
          });

          setUsuarios(Array.from(sociosUnicos.values()));
        } else {
          // Socio: cliente técnico + otros socios de la obra
          const usuariosList: Usuario[] = [];

          // 1. Obtener cliente técnico (owner de la organización)
          const { data: orgData } = await supabaseAny
            .from('organizations')
            .select('user_id')
            .eq('id', currentUser.orgId)
            .maybeSingle();

          if (orgData?.user_id) {
            // Obtener datos del cliente técnico desde auth.users (si es posible)
            // Por ahora, usamos org_id como referencia
            usuariosList.push({
              id: currentUser.orgId, // Usar org_id como referencia del cliente
              nombre: 'Cliente técnico',
              tipo: 'cliente',
            });
          }

          // 2. Obtener otros socios de la obra
          const { data: cuadrillasData } = await supabaseAny
            .from('cuadrillas')
            .select('id')
            .eq('obra_id', obraId);

          if (cuadrillasData && cuadrillasData.length > 0) {
            const cuadrillaIds = cuadrillasData.map((c: any) => c.id);

            const { data: sociosData, error } = await supabaseAny
              .from('cuadrilla_socios')
              .select('socio_id, socios:id,nombre,email')
              .in('cuadrilla_id', cuadrillaIds)
              .eq('activo', true);

            if (!error && sociosData) {
              sociosData.forEach((item: any) => {
                if (item.socio_id && item.socios && item.socio_id !== currentUserId) {
                  usuariosList.push({
                    id: item.socio_id,
                    nombre: item.socios.nombre || 'Socio sin nombre',
                    tipo: 'socio',
                    email: item.socios.email,
                  });
                }
              });
            }
          }

          setUsuarios(usuariosList);
        }
      } catch (error) {
        console.error('[SelectUsuario] Error cargando usuarios:', error);
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, currentUser?.orgId, role, currentUserId]);

  if (!obraId) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Primero elegí una obra</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Cargando usuarios...</span>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">No hay usuarios disponibles en esta obra</span>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={(val) => {
      const usuario = usuarios.find(u => u.id === val);
      // Normalizar el tipo para asegurar compatibilidad con onValueChange
      const tipoNormalizado: 'cliente' | 'socio' | null = normalizeUsuarioTipo(usuario?.tipo);
      onValueChange(val, tipoNormalizado);
    }}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Elegir usuario" />
      </SelectTrigger>
      <SelectContent>
        {usuarios.map((usuario) => (
          <SelectItem key={usuario.id} value={usuario.id}>
            {usuario.nombre} ({usuario.tipo === 'cliente' ? 'Cliente técnico' : 'Socio'})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

