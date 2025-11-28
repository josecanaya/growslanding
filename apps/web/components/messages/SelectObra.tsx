'use client';

import { useEffect, useState } from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Obra {
  id: string;
  nombre: string;
  direccion?: string | null;
}

interface SelectObraProps {
  value?: string | null;
  onValueChange: (obraId: string | null) => void;
  role: 'cliente' | 'socio';
}

/**
 * Selector de obra para el chat
 * Cliente: muestra obras donde es responsable
 * Socio: muestra obras donde está asignado (cuadrilla_socios)
 */
export function SelectObra({ value, onValueChange, role }: SelectObraProps) {
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarObras = async () => {
      if (!currentUser?.orgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabaseAny = supabase as any;

        if (role === 'cliente') {
          // Cliente: obras donde es owner o responsable
          const { data, error } = await supabaseAny
            .from('obras')
            .select('id, nombre, direccion_completa')
            .eq('org_id', currentUser.orgId)
            .order('nombre', { ascending: true });

          if (error) throw error;

          const obrasList = (data || []).map((obra: any) => ({
            id: obra.id,
            nombre: obra.nombre || 'Obra sin nombre',
            direccion: obra.direccion_completa,
          }));

          setObras(obrasList);

          // Si solo hay una obra, seleccionarla automáticamente
          if (obrasList.length === 1 && !value) {
            onValueChange(obrasList[0].id);
          }
        } else {
          // Socio: obras donde está asignado (cuadrilla_socios)
          // Primero obtener el socio_id
          const { data: socioData } = await supabaseAny
            .from('socios')
            .select('id')
            .eq('org_id', currentUser.orgId)
            .or(`email.eq.${currentUser.email},user_id.eq.${currentUser.id}`)
            .maybeSingle();

          if (!socioData?.id) {
            setObras([]);
            setLoading(false);
            return;
          }

          // Obtener cuadrillas del socio
          const { data: cuadrillasData } = await supabaseAny
            .from('cuadrilla_socios')
            .select('cuadrilla_id')
            .eq('socio_id', socioData.id)
            .eq('activo', true);

          if (!cuadrillasData || cuadrillasData.length === 0) {
            setObras([]);
            setLoading(false);
            return;
          }

          const cuadrillaIds = cuadrillasData.map((c: any) => c.cuadrilla_id);

          // Obtener obras de esas cuadrillas
          const { data: obrasData, error } = await supabaseAny
            .from('cuadrillas')
            .select('obra_id, obras:id,nombre,direccion_completa')
            .in('id', cuadrillaIds);

          if (error) throw error;

          // Extraer obras únicas
          const obrasUnicas = new Map<string, Obra>();
          (obrasData || []).forEach((item: any) => {
            if (item.obra_id && item.obras) {
              obrasUnicas.set(item.obra_id, {
                id: item.obra_id,
                nombre: item.obras.nombre || 'Obra sin nombre',
                direccion: item.obras.direccion_completa,
              });
            }
          });

          const obrasList = Array.from(obrasUnicas.values());
          setObras(obrasList);

          // Si solo hay una obra, seleccionarla automáticamente
          if (obrasList.length === 1 && !value) {
            onValueChange(obrasList[0].id);
          }
        }
      } catch (error) {
        console.error('[SelectObra] Error cargando obras:', error);
        setObras([]);
      } finally {
        setLoading(false);
      }
    };

    cargarObras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.orgId, currentUser?.email, currentUser?.id, role, value]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Cargando obras...</span>
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">No hay obras disponibles</span>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Elegir obra" />
      </SelectTrigger>
      <SelectContent>
        {obras.map((obra) => (
          <SelectItem key={obra.id} value={obra.id}>
            {obra.nombre}
            {obra.direccion && ` - ${obra.direccion}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

