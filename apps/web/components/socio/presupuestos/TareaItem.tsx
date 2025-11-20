'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatArgentineNumber, parseArgentineNumber } from '@/lib/utils/format';

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
}

interface TareaItemProps {
  presupuesto: PresupuestoItem;
  editing: {
    dias_reales: number | null;
    monto: number | null;
  };
  onFieldChange: (field: 'dias_reales' | 'monto', value: number | null) => void;
}

export function TareaItem({ presupuesto, editing, onFieldChange }: TareaItemProps) {
  // Debug: verificar datos del elemento
  console.log('[TareaItem] Presupuesto completo:', {
    tareaTitle: presupuesto.tarea?.title,
    tieneElemento: !!presupuesto.elemento,
    elemento: presupuesto.elemento,
    cantidad: presupuesto.elemento?.cantidad,
    unidad: presupuesto.elemento?.unidad,
  });

  // Solo mostrar planta y altura si existen, sin la etapa
  const ubicacion = [
    presupuesto.elemento?.planta,
    presupuesto.elemento?.altura,
  ].filter(Boolean).join(' • ');

  // Estado local para el input de monto (para formateo mientras escribe)
  const formatMontoForInput = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }
    const hasDecimals = value % 1 !== 0;
    if (hasDecimals) {
      return formatArgentineNumber(Math.round(value * 100) / 100);
    }
    return formatArgentineNumber(Math.round(value));
  };

  const [montoInputValue, setMontoInputValue] = useState<string>(
    editing.monto !== null ? formatMontoForInput(editing.monto) : ''
  );

  // Sincronizar cuando cambia el valor desde fuera
  useEffect(() => {
    setMontoInputValue(editing.monto !== null ? formatMontoForInput(editing.monto) : '');
  }, [editing.monto]);

  const handleDiasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? null : parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onFieldChange('dias_reales', numValue);
    }
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Si está vacío, permitir borrar
    if (value === '') {
      setMontoInputValue('');
      onFieldChange('monto', null);
      return;
    }
    
    // Remover todo excepto números, puntos y comas
    value = value.replace(/[^\d.,]/g, '');
    
    // Permitir solo una coma para decimales
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Limitar decimales a 2 dígitos
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    setMontoInputValue(value);
    
    // Parsear usando formato argentino
    const numValue = parseArgentineNumber(value);
    
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onFieldChange('monto', numValue);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-slate-50 last:border-b-0 bg-white">
      {/* Nombre de tarea */}
      <div className="mb-3">
        <div className="text-sm font-medium text-slate-900 mb-2">
          {presupuesto.tarea?.title || 'Sin título'}
        </div>
        
        {/* Cantidad destacada - más grande e importante */}
        {presupuesto.elemento && presupuesto.elemento.cantidad != null && presupuesto.elemento.unidad && (
          <div className="text-base font-semibold text-slate-900">
            {presupuesto.elemento.cantidad.toLocaleString('es-AR', { 
              minimumFractionDigits: presupuesto.elemento.cantidad % 1 === 0 ? 0 : 2,
              maximumFractionDigits: 2 
            })} {presupuesto.elemento.unidad}
          </div>
        )}
        
        {/* Ubicación (solo planta y altura, sin etapa) */}
        {ubicacion && (
          <div className="text-xs text-slate-500 mt-1">{ubicacion}</div>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Días {presupuesto.tarea?.duracion_sugerida != null && presupuesto.tarea.duracion_sugerida !== undefined ? `(${presupuesto.tarea.duracion_sugerida})` : ''}
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={editing.dias_reales !== null && editing.dias_reales !== undefined ? editing.dias_reales.toString() : ''}
            onChange={handleDiasChange}
            className="h-8 text-sm border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Monto
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={montoInputValue}
            onChange={handleMontoChange}
            onBlur={(e) => {
              // Al perder el foco, formatear correctamente con puntos de miles
              const numValue = parseArgentineNumber(e.target.value);
              if (numValue !== null && !isNaN(numValue)) {
                const formatted = formatMontoForInput(numValue);
                setMontoInputValue(formatted);
                // Asegurar que el valor numérico esté actualizado
                onFieldChange('monto', numValue);
              } else if (e.target.value === '') {
                setMontoInputValue('');
              }
            }}
            className="h-8 text-sm border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}

