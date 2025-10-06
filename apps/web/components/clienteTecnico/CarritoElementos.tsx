'use client';

import { useState } from 'react';
import { ShoppingCart, Trash2, Edit3, Check, X, Calculator } from 'lucide-react';
import { ElementoSeleccionado } from '@/lib/types/elementos';

interface CarritoElementosProps {
  elementos: ElementoSeleccionado[];
  onActualizarCantidad: (id: string, cantidad: number) => void;
  onEliminarElemento: (id: string) => void;
  onConfirmarCarrito: () => void;
  onLimpiarCarrito: () => void;
}

export function CarritoElementos({
  elementos,
  onActualizarCantidad,
  onEliminarElemento,
  onConfirmarCarrito,
  onLimpiarCarrito
}: CarritoElementosProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cantidadTemporal, setCantidadTemporal] = useState<number>(0);

  const iniciarEdicion = (elemento: ElementoSeleccionado) => {
    setEditandoId(elemento.id);
    setCantidadTemporal(elemento.cantidad);
  };

  const confirmarEdicion = () => {
    if (editandoId && cantidadTemporal > 0) {
      onActualizarCantidad(editandoId, cantidadTemporal);
    }
    setEditandoId(null);
    setCantidadTemporal(0);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setCantidadTemporal(0);
  };

  const getTotalPorUnidad = () => {
    const totales = elementos.reduce((acc, elemento) => {
      acc[elemento.unidad] = (acc[elemento.unidad] || 0) + elemento.cantidad;
      return acc;
    }, {} as Record<string, number>);
    return totales;
  };

  const totales = getTotalPorUnidad();

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Carrito de Obra</span>
          </h3>
          {elementos.length > 0 && (
            <button
              onClick={onLimpiarCarrito}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Limpiar carrito"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {elementos.length} elemento{elementos.length !== 1 ? 's' : ''} seleccionado{elementos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {elementos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>El carrito está vacío</p>
            <p className="text-sm">Selecciona elementos para comenzar</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {elementos.map((elemento) => (
              <div key={elemento.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">{elemento.tipo}</h4>
                    <p className="text-xs text-gray-600">{elemento.categoria}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => iniciarEdicion(elemento)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar cantidad"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onEliminarElemento(elemento.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {editandoId === elemento.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={cantidadTemporal}
                      onChange={(e) => setCantidadTemporal(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-600">{elemento.unidad}</span>
                    <button
                      onClick={confirmarEdicion}
                      className="text-green-600 hover:text-green-800 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      {elemento.cantidad} {elemento.unidad}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {elementos.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Resumen Total</span>
            </h4>
            <div className="space-y-1">
              {Object.entries(totales).map(([unidad, cantidad]) => (
                <div key={unidad} className="flex justify-between text-sm">
                  <span className="text-gray-600">{unidad}:</span>
                  <span className="font-medium text-gray-800">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onConfirmarCarrito}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Confirmar y Generar Timeline</span>
          </button>
        </div>
      )}
    </div>
  );
}



