'use client';

import { useState } from 'react';
import { FolderOpen, CheckCircle } from 'lucide-react';
import { elementos } from '@/lib/elementos-vivienda';
import { ElementoSeleccionado, ExpansorElementos } from '@/lib/services/expansorElementos';
import { ModalSeleccionCantidad } from './modals/ModalSeleccionCantidad';

interface CargaElementosSectionProps {
  onCrearTareas: (tareas: any[]) => void;
}

export function CargaElementosSection({ onCrearTareas }: CargaElementosSectionProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [elementosCarrito, setElementosCarrito] = useState<ElementoSeleccionado[]>([]);
  const [showModalCantidad, setShowModalCantidad] = useState(false);
  const [elementoParaModal, setElementoParaModal] = useState<any>(null);
  const [tareasCreadas, setTareasCreadas] = useState<any[]>([]);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  const getCategoriaSeleccionada = () => {
    return elementos.find(e => e.categoria === categoriaSeleccionada);
  };

  const handleSeleccionarTipo = (tipo: any) => {
    setElementoParaModal({
      categoria: categoriaSeleccionada,
      tipo: tipo.nombre,
      cantidadTareas: tipo.fases.estructura.length + tipo.fases.obra_gris.length + tipo.fases.terminaciones.length
    });
    setShowModalCantidad(true);
  };

  const handleConfirmarCantidad = (cantidad: number, unidad: 'm²' | 'm³' | 'unidad') => {
    if (elementoParaModal) {
      const nuevoElemento: ElementoSeleccionado = {
        id: `${elementoParaModal.categoria}-${elementoParaModal.tipo}-${Date.now()}`,
        categoria: elementoParaModal.categoria,
        tipo: elementoParaModal.tipo,
        cantidad,
        unidad
      };
      
      setElementosCarrito(prev => [...prev, nuevoElemento]);
    }
  };

  const handleEliminarElemento = (id: string) => {
    setElementosCarrito(prev => prev.filter(e => e.id !== id));
  };

  const handleConfirmarCarrito = () => {
    try {
      // Expandir elementos a tareas usando la estructura existente
      const tareasGeneradas = ExpansorElementos.expandirElementos(elementosCarrito);
      
      // Guardar tareas creadas
      setTareasCreadas(tareasGeneradas);
      setMostrarResultado(true);
      
      // Llamar callback para crear tareas en el sistema
      onCrearTareas(tareasGeneradas);
      
      console.log('Tareas generadas:', tareasGeneradas);
      
    } catch (error) {
      console.error('Error al expandir elementos:', error);
    }
  };

  const handleVolverAElementos = () => {
    setMostrarResultado(false);
    setTareasCreadas([]);
    setElementosCarrito([]);
  };

  const getTotalTareas = () => {
    return elementosCarrito.reduce((total, elemento) => {
      const categoriaElemento = elementos.find(cat => cat.categoria === elemento.categoria);
      const tipoElemento = categoriaElemento?.tipos.find(tipo => tipo.nombre === elemento.tipo);
      if (tipoElemento) {
        return total + tipoElemento.fases.estructura.length + tipoElemento.fases.obra_gris.length + tipoElemento.fases.terminaciones.length;
      }
      return total;
    }, 0);
  };

  if (mostrarResultado) {
    return (
      <div className="h-full bg-white overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Tareas Creadas Exitosamente</h2>
              <p className="text-gray-600">Se han creado {tareasCreadas.length} tareas desde {elementosCarrito.length} elementos</p>
            </div>
            <button
              onClick={handleVolverAElementos}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cargar Más Elementos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tareasCreadas.map((tarea, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{tarea.nombre}</h4>
                    <p className="text-sm text-gray-600">Código: {tarea.id}</p>
                    <p className="text-sm text-gray-600">Fase: {tarea.fase}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{tarea.cantidad} {tarea.unidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiempo estimado:</span>
                    <span className="font-medium">{tarea.tiempoEstimado} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coef. operativo:</span>
                    <span className="font-medium">{tarea.coef_operativo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Elemento origen:</span>
                    <span className="font-medium text-xs">{tarea.elementoOrigen.tipo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex bg-gray-50">
        {/* Panel lateral - Categorías */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Elementos Constructivos</h2>
            <p className="text-sm text-gray-600">Selecciona una categoría</p>
          </div>
          
          <div className="p-2">
            {elementos.map((elemento, index) => (
              <div key={index} className="mb-1">
                <button
                  onClick={() => setCategoriaSeleccionada(elemento.categoria)}
                  className={`w-full p-3 text-left rounded-lg transition-colors flex items-center justify-between ${
                    categoriaSeleccionada === elemento.categoria
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="h-4 w-4" />
                    <span className="font-medium">{elemento.categoria}</span>
                  </div>
                  <span className="text-xs text-gray-500">{elemento.tipos.length}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel central - Tipos de elementos */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-800">
              {getCategoriaSeleccionada()?.categoria || 'Selecciona una categoría'}
            </h3>
            <p className="text-sm text-gray-600">Tipos de elementos</p>
          </div>
          
          {getCategoriaSeleccionada() && (
            <div className="p-2">
              {getCategoriaSeleccionada()!.tipos.map((tipo, index) => (
                <div key={index} className="mb-1">
                  <button
                    onClick={() => handleSeleccionarTipo(tipo)}
                    className="w-full p-3 text-left rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
                  >
                    <div className="font-medium">{tipo.nombre}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tipo.fases.estructura.length + tipo.fases.obra_gris.length + tipo.fases.terminaciones.length} tareas
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho - Carrito */}
        <div className="flex-1 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Carrito de Obra</h3>
            <p className="text-sm text-gray-600">
              {elementosCarrito.length} elemento{elementosCarrito.length !== 1 ? 's' : ''} seleccionado{elementosCarrito.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="p-4">
            {elementosCarrito.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>El carrito está vacío</p>
                <p className="text-sm">Selecciona elementos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {elementosCarrito.map((elemento) => (
                  <div key={elemento.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">{elemento.tipo}</h4>
                        <p className="text-xs text-gray-600">{elemento.categoria}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {elemento.cantidad} {elemento.unidad}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarElemento(elemento.id)}
                        className="text-red-600 hover:text-red-800 transition-colors text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleConfirmarCarrito}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Crear Tareas ({getTotalTareas()} tareas)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de selección de cantidad */}
      <ModalSeleccionCantidad
        isOpen={showModalCantidad}
        onClose={() => setShowModalCantidad(false)}
        onConfirm={handleConfirmarCantidad}
        elemento={elementoParaModal || { nombre: '', categoria: '', cantidadTareas: 0 }}
      />
    </>
  );
}
  