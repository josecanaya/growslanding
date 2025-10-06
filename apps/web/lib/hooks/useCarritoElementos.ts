import { useState, useCallback } from 'react';
import { ElementoSeleccionado } from '@/lib/types/elementos';

export function useCarritoElementos() {
  const [elementos, setElementos] = useState<ElementoSeleccionado[]>([]);

  const agregarElemento = useCallback((elemento: ElementoSeleccionado) => {
    setElementos(prev => {
      const existe = prev.find(e => e.id === elemento.id);
      if (existe) {
        return prev.map(e => 
          e.id === elemento.id 
            ? { ...e, cantidad: e.cantidad + elemento.cantidad }
            : e
        );
      }
      return [...prev, elemento];
    });
  }, []);

  const actualizarCantidad = useCallback((id: string, cantidad: number) => {
    setElementos(prev => 
      prev.map(e => e.id === id ? { ...e, cantidad } : e)
    );
  }, []);

  const eliminarElemento = useCallback((id: string) => {
    setElementos(prev => prev.filter(e => e.id !== id));
  }, []);

  const limpiarCarrito = useCallback(() => {
    setElementos([]);
  }, []);

  const getTotalPorUnidad = useCallback(() => {
    const totales = elementos.reduce((acc, elemento) => {
      acc[elemento.unidad] = (acc[elemento.unidad] || 0) + elemento.cantidad;
      return acc;
    }, {} as Record<string, number>);
    return totales;
  }, [elementos]);

  return {
    elementos,
    agregarElemento,
    actualizarCantidad,
    eliminarElemento,
    limpiarCarrito,
    getTotalPorUnidad
  };
}
