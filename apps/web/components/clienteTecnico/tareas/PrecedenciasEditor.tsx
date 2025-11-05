'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Clock } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface Tarea {
  id: string;
  title: string;
}

interface Precedencia {
  id: string;
  tarea_id: string;
  depende_de: string;
  lag_dias: number;
}

interface PrecedenciasEditorProps {
  obraId: string;
}

export function PrecedenciasEditor({ obraId }: PrecedenciasEditorProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [precedencias, setPrecedencias] = useState<Precedencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nuevaPrecedencia, setNuevaPrecedencia] = useState({
    tarea_id: '',
    depende_de: '',
    lag_dias: 0,
  });

  const supabase = createClientComponentClient();
  const currentUser = useCurrentUser();

  // Cargar tareas y precedencias
  useEffect(() => {
    const cargarDatos = async () => {
      if (!obraId || !currentUser?.orgId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Cargar tareas
        const { data: tareasData, error: tareasError } = await supabase
          .from('tareas')
          .select('id, title')
          .eq('obra_id', obraId)
          .eq('org_id', currentUser.orgId)
          .order('title', { ascending: true });

        if (tareasError) {
          console.error('Error cargando tareas:', tareasError);
          return;
        }

        setTareas(tareasData || []);

        // Cargar precedencias
        const tareaIds = (tareasData || []).map(t => t.id);
        if (tareaIds.length > 0) {
          const { data: precData, error: precError } = await supabase
            .from('tarea_precedencias')
            .select('id, tarea_id, depende_de, lag_dias')
            .in('tarea_id', tareaIds);

          if (precError) {
            console.error('Error cargando precedencias:', precError);
            // Si la tabla no existe, continuar sin precedencias
            setPrecedencias([]);
          } else {
            setPrecedencias(precData || []);
          }
        } else {
          setPrecedencias([]);
        }
      } catch (error) {
        console.error('Error en cargarDatos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [obraId, currentUser?.orgId, supabase]);

  const handleAgregarPrecedencia = async () => {
    if (!nuevaPrecedencia.tarea_id || !nuevaPrecedencia.depende_de) {
      alert('Por favor selecciona ambas tareas');
      return;
    }

    if (nuevaPrecedencia.tarea_id === nuevaPrecedencia.depende_de) {
      alert('Una tarea no puede depender de sí misma');
      return;
    }

    // Verificar si ya existe
    const existe = precedencias.some(
      p => p.tarea_id === nuevaPrecedencia.tarea_id && p.depende_de === nuevaPrecedencia.depende_de
    );

    if (existe) {
      alert('Esta precedencia ya existe');
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('tarea_precedencias')
        .insert({
          tarea_id: nuevaPrecedencia.tarea_id,
          depende_de: nuevaPrecedencia.depende_de,
          lag_dias: nuevaPrecedencia.lag_dias || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error insertando precedencia:', error);
        alert('Error al agregar precedencia: ' + error.message);
        return;
      }

      setPrecedencias([...precedencias, data]);
      setNuevaPrecedencia({ tarea_id: '', depende_de: '', lag_dias: 0 });
    } catch (error) {
      console.error('Error en handleAgregarPrecedencia:', error);
      alert('Error al agregar precedencia');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarPrecedencia = async (precedenciaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta precedencia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tarea_precedencias')
        .delete()
        .eq('id', precedenciaId);

      if (error) {
        console.error('Error eliminando precedencia:', error);
        alert('Error al eliminar precedencia: ' + error.message);
        return;
      }

      setPrecedencias(precedencias.filter(p => p.id !== precedenciaId));
    } catch (error) {
      console.error('Error en handleEliminarPrecedencia:', error);
      alert('Error al eliminar precedencia');
    }
  };

  const handleActualizarLag = async (precedenciaId: string, nuevoLag: number) => {
    try {
      const { error } = await supabase
        .from('tarea_precedencias')
        .update({ lag_dias: nuevoLag })
        .eq('id', precedenciaId);

      if (error) {
        console.error('Error actualizando lag:', error);
        return;
      }

      setPrecedencias(precedencias.map(p => 
        p.id === precedenciaId ? { ...p, lag_dias: nuevoLag } : p
      ));
    } catch (error) {
      console.error('Error en handleActualizarLag:', error);
    }
  };

  const obtenerNombreTarea = (tareaId: string) => {
    return tareas.find(t => t.id === tareaId)?.title || 'Sin nombre';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 text-gray-400 animate-spin mr-3" />
        <p className="text-gray-500">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Editor de Precedencias</h2>

        {/* Formulario para agregar precedencia */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar Precedencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarea
              </label>
              <select
                value={nuevaPrecedencia.tarea_id}
                onChange={(e) => setNuevaPrecedencia({ ...nuevaPrecedencia, tarea_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tarea</option>
                {tareas.map(tarea => (
                  <option key={tarea.id} value={tarea.id}>
                    {tarea.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depende de
              </label>
              <select
                value={nuevaPrecedencia.depende_de}
                onChange={(e) => setNuevaPrecedencia({ ...nuevaPrecedencia, depende_de: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tarea</option>
                {tareas.map(tarea => (
                  <option key={tarea.id} value={tarea.id}>
                    {tarea.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lag (días)
              </label>
              <input
                type="number"
                value={nuevaPrecedencia.lag_dias}
                onChange={(e) => setNuevaPrecedencia({ ...nuevaPrecedencia, lag_dias: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAgregarPrecedencia}
                disabled={saving || !nuevaPrecedencia.tarea_id || !nuevaPrecedencia.depende_de}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de precedencias */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tarea</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Depende de</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Lag (días)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {precedencias.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No hay precedencias definidas
                  </td>
                </tr>
              ) : (
                precedencias.map(prec => (
                  <tr key={prec.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {obtenerNombreTarea(prec.tarea_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {obtenerNombreTarea(prec.depende_de)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={prec.lag_dias}
                        onChange={(e) => handleActualizarLag(prec.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEliminarPrecedencia(prec.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

