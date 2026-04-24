'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checklistPlantillas, type ChecklistItem } from '@/data/checklists';

interface ChecklistModalProps {
  tarea: {
    id: string;
    nombre: string;
    title?: string;
  };
  onClose: () => void;
  onSave: (items: ChecklistItem[]) => Promise<void>;
  /** Si se pasa (ej. demo), se usa en lugar de cargar desde API */
  initialItems?: ChecklistItem[];
}

// Checklist genérico por defecto
const checklistDefault: ChecklistItem[] = [
  { id: "gen1", label: "Verificar materiales", done: false },
  { id: "gen2", label: "Preparar superficie", done: false },
  { id: "gen3", label: "Revisar nivelación", done: false },
  { id: "gen4", label: "Ejecutar tarea", done: false },
  { id: "gen5", label: "Control de calidad", done: false },
];

export function ChecklistModal({ tarea, onClose, onSave, initialItems }: ChecklistModalProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!(initialItems && initialItems.length > 0));
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      setLoading(false);
      return;
    }
    const cargarChecklist = async () => {
      try {
        setLoading(true);

        // 1. Intentar obtener checklist desde eventos previos
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos')
          .select('checklist, created_at')
          .eq('tarea_id', tarea.id)
          .not('checklist', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!eventosError && eventosData && eventosData.length > 0) {
          const checklistEvento = eventosData[0].checklist;
          if (Array.isArray(checklistEvento) && checklistEvento.length > 0) {
            // Convertir formato del evento a formato del componente
            // El evento puede tener { id, label, checked } o { id, label, done }
            const itemsConvertidos = checklistEvento.map((item: any) => ({
              id: item.id || `item-${Math.random()}`,
              label: item.label || '',
              done: item.checked !== undefined ? item.checked : item.done !== undefined ? item.done : false,
            }));
            setItems(itemsConvertidos);
            setLoading(false);
            return;
          }
        }

        // 2. Si no hay checklist previo, buscar en plantillas
        const nombreTarea = tarea.title || tarea.nombre || '';
        
        // Buscar plantilla exacta
        let plantilla = checklistPlantillas[nombreTarea];
        
        // Si no existe, buscar por coincidencia parcial
        if (!plantilla) {
          const nombreLower = nombreTarea.toLowerCase();
          const claveEncontrada = Object.keys(checklistPlantillas).find(
            clave => nombreLower.includes(clave.toLowerCase()) || clave.toLowerCase().includes(nombreLower)
          );
          if (claveEncontrada) {
            plantilla = checklistPlantillas[claveEncontrada];
          }
        }

        // 3. Si no se encuentra plantilla, usar checklist genérico
        if (!plantilla) {
          plantilla = checklistDefault;
        }

        // Clonar items para evitar mutación
        setItems(plantilla.map(item => ({ ...item })));
      } catch (error) {
        console.error('[CHECKLIST_MODAL] Error al cargar checklist:', error);
        // En caso de error, usar checklist genérico
        setItems(checklistDefault.map(item => ({ ...item })));
      } finally {
        setLoading(false);
      }
    };

    cargarChecklist();
  }, [tarea.id, tarea.title, tarea.nombre, supabase, initialItems]);

  const handleToggleItem = async (itemId: string) => {
    const nuevosItems = items.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    setItems(nuevosItems);
    
    // Auto-save: guardar automáticamente al marcar/desmarcar
    try {
      await onSave(nuevosItems);
    } catch (error) {
      console.error('[CHECKLIST_MODAL] Error en auto-save:', error);
      // No mostrar error al usuario en auto-save, solo loguear
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(items);
      // Cerrar modal después de guardar exitosamente
      onClose();
    } catch (error) {
      console.error('[CHECKLIST_MODAL] Error al guardar:', error);
      alert('Error al guardar el checklist. Por favor, intenta nuevamente.');
      setSaving(false);
    }
  };

  // Guardar al cerrar si hay cambios
  const handleClose = async () => {
    try {
      // Guardar antes de cerrar si hay items
      if (items.length > 0) {
        await onSave(items);
      }
    } catch (error) {
      console.error('[CHECKLIST_MODAL] Error al guardar al cerrar:', error);
      // No bloquear el cierre por error de guardado
    }
    onClose();
  };

  const nombreTarea = tarea.title || tarea.nombre || 'Tarea';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Checklist</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Título de la tarea */}
        <div className="px-6 pt-4">
          <p className="text-sm text-gray-600 mb-1">Tarea:</p>
          <p className="text-lg font-semibold text-gray-900">{nombreTarea}</p>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando checklist...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay items en el checklist</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border-2 border-transparent hover:border-blue-200"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleItem(item.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    disabled={saving}
                  />
                  <span
                    className={`ml-4 flex-1 text-base ${
                      item.done
                        ? 'text-gray-500 line-through'
                        : 'text-gray-900 font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.done && (
                    <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0A4D68' }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

