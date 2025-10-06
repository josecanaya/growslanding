'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit3, 
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings
} from 'lucide-react';
import catalogoData from '../../lib/catalogos/catalogo-elementos-constructivos.json';

// Tipos de datos
interface ElementoConstructivo {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria?: string;
  unidad: string;
  cantidad: number;
  descripcion?: string;
  opciones?: any;
  tareas?: string[];
  esPersonalizado?: boolean;
}

interface PasoElementosConstructivosProps {
  elementos: ElementoConstructivo[];
  onElementosChange: (elementos: ElementoConstructivo[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Cargar y aplanar el catálogo desde JSON
const cargarCatalogo = () => {
  const elementosPlanos: any[] = [];
  
  catalogoData.categorias.forEach(categoria => {
    categoria.subcategorias.forEach(subcategoria => {
      subcategoria.elementos.forEach(elemento => {
        elementosPlanos.push({
          id: elemento.id,
          nombre: elemento.nombre,
          categoria: categoria.categoria,
          subcategoria: subcategoria.nombre,
          unidad: elemento.unidad,
          opciones: elemento.opciones,
          tareas: elemento.tareas,
          descripcion: `${subcategoria.nombre} - ${elemento.nombre}`
        });
      });
    });
  });
  
  return elementosPlanos;
};

const CATALOGO_ELEMENTOS = cargarCatalogo();

// Extraer categorías únicas del catálogo
const CATEGORIAS = ['Todas', ...Array.from(new Set(CATALOGO_ELEMENTOS.map(el => el.categoria)))];

// Extraer subcategorías por categoría
const obtenerSubcategorias = (categoria: string) => {
  if (categoria === 'Todas') return [];
  const subcats = CATALOGO_ELEMENTOS
    .filter(el => el.categoria === categoria)
    .map(el => el.subcategoria)
    .filter((value, index, self) => self.indexOf(value) === index);
  return subcats;
};

// Modal para crear elemento personalizado
const ModalElementoPersonalizado = ({ 
  isOpen, 
  onClose, 
  onSave, 
  elemento 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (elemento: ElementoConstructivo) => void; 
  elemento?: ElementoConstructivo; 
}) => {
  const [formData, setFormData] = useState({
    nombre: elemento?.nombre || '',
    categoria: elemento?.categoria || '',
    unidad: elemento?.unidad || '',
    cantidad: elemento?.cantidad || 1,
    descripcion: elemento?.descripcion || ''
  });

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.categoria.trim() || !formData.unidad.trim()) {
      return;
    }

    const nuevoElemento: ElementoConstructivo = {
      id: elemento?.id || `custom-${Date.now()}`,
      nombre: formData.nombre.trim(),
      categoria: formData.categoria.trim(),
      unidad: formData.unidad.trim(),
      cantidad: formData.cantidad,
      descripcion: formData.descripcion.trim(),
      esPersonalizado: true
    };

    onSave(nuevoElemento);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {elemento ? 'Editar Elemento' : 'Crear Elemento Personalizado'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Muro de ladrillo hueco"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              {CATEGORIAS.filter(cat => cat !== 'Todas').map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidad *</label>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData(prev => ({ ...prev, unidad: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar unidad</option>
                <option value="m²">m² (metros cuadrados)</option>
                <option value="m³">m³ (metros cúbicos)</option>
                <option value="m">m (metros lineales)</option>
                <option value="kg">kg (kilogramos)</option>
                <option value="un">un (unidades)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del elemento..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Check className="h-4 w-4" />
            <span>{elemento ? 'Actualizar' : 'Crear'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function PasoElementosConstructivos({ 
  elementos, 
  onElementosChange, 
  onNext, 
  onPrevious 
}: PasoElementosConstructivosProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [showModalPersonalizado, setShowModalPersonalizado] = useState(false);
  const [editingElemento, setEditingElemento] = useState<ElementoConstructivo | undefined>();
  const [configuringElemento, setConfiguringElemento] = useState<any>(null);
  const [showResumen, setShowResumen] = useState(false);

  // Obtener categorías únicas del catálogo en orden
  const categoriasOrdenadas = useMemo(() => {
    return CATEGORIAS.filter(c => c !== 'Todas');
  }, []);

  const categoriaActual = categoriasOrdenadas[currentCategoryIndex];

  // Filtrar elementos de la categoría actual
  const elementosCategoriaActual = useMemo(() => {
    return CATALOGO_ELEMENTOS.filter(el => el.categoria === categoriaActual);
  }, [categoriaActual]);

  const handleAddElemento = (elementoCatalogo: any) => {
    const nuevoElemento: ElementoConstructivo = {
      id: `elemento-${Date.now()}`,
      nombre: elementoCatalogo.nombre,
      categoria: elementoCatalogo.categoria,
      subcategoria: elementoCatalogo.subcategoria,
      unidad: elementoCatalogo.unidad,
      cantidad: 1,
      descripcion: elementoCatalogo.descripcion,
      opciones: elementoCatalogo.opciones,
      tareas: elementoCatalogo.tareas,
      esPersonalizado: false
    };
    onElementosChange([...elementos, nuevoElemento]);
  };

  const handleRemoveElemento = (id: string) => {
    onElementosChange(elementos.filter(el => el.id !== id));
  };

  const handleEditElemento = (elemento: ElementoConstructivo) => {
    setEditingElemento(elemento);
    setShowModalPersonalizado(true);
  };

  const handleSaveElementoPersonalizado = (elemento: ElementoConstructivo) => {
    if (editingElemento) {
      // Actualizar elemento existente
      onElementosChange(elementos.map(el => el.id === elemento.id ? elemento : el));
    } else {
      // Agregar nuevo elemento
      onElementosChange([...elementos, elemento]);
    }
    setEditingElemento(undefined);
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < categoriasOrdenadas.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    } else {
      // Última categoría, ir al siguiente paso del wizard principal
      onNext();
    }
  };

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    } else {
      // Primera categoría, volver al paso anterior del wizard principal
      onPrevious();
    }
  };

  const handleSelectElemento = (elementoCatalogo: any) => {
    // Abrir panel de configuración
    setConfiguringElemento(elementoCatalogo);
  };

  const handleConfirmElement = (configuracion: any) => {
    handleAddElemento(configuringElemento);
    setConfiguringElemento(null);
  };

  // Obtener ícono según categoría
  const getCategoryIcon = (categoria: string) => {
    const icons: any = {
      'Fundación y Estructura': '🏗️',
      'Muros y Cerramientos': '🧱',
      'Instalaciones': '⚡',
      'Cubiertas': '🏠',
      'Suelos / Pisos': '📐',
      'Amenities': '🌟',
      'Parquizado': '🌳'
    };
    return icons[categoria] || '📦';
  };

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Panel principal */}
      <div className="flex-1 flex flex-col">
        {/* Header con progreso */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-t-xl border-b border-gray-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {getCategoryIcon(categoriaActual)} {categoriaActual}
              </h2>
              <p className="text-gray-600 mt-1">
                Paso {currentCategoryIndex + 1} de {categoriasOrdenadas.length}
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center justify-between mb-4">
              {categoriasOrdenadas.map((cat, index) => (
                <div key={cat} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                      index < currentCategoryIndex 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : index === currentCategoryIndex
                          ? 'bg-blue-500 border-blue-500 text-white scale-110'
                          : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {index < currentCategoryIndex ? <Check className="h-5 w-5" /> : getCategoryIcon(cat)}
                    </div>
                    <div className={`text-xs mt-2 text-center font-medium ${
                      index === currentCategoryIndex ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {cat.split(' ')[0]}
                    </div>
                  </div>
                  {index < categoriasOrdenadas.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      index < currentCategoryIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido principal - Cards de elementos */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <p className="text-gray-600">
                Selecciona los elementos que necesitás para esta etapa de construcción
              </p>
            </div>

            {/* Grid de cards por subcategoría */}
            {Object.entries(
              elementosCategoriaActual.reduce((acc: any, el) => {
                const sub = el.subcategoria || 'General';
                if (!acc[sub]) acc[sub] = [];
                acc[sub].push(el);
                return acc;
              }, {})
            ).map(([subcategoria, elementosSubcat]: [string, any]) => (
              <div key={subcategoria} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-1 h-6 bg-blue-500 mr-3"></div>
                  {subcategoria}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elementosSubcat.map((elementoCatalogo: any, index: number) => {
                    const isSelected = elementos.some((e: ElementoConstructivo) => e.nombre === elementoCatalogo.nombre);
                    
                    return (
                      <div
                        key={`${elementoCatalogo.id}-${index}`}
                        onClick={() => handleSelectElemento(elementoCatalogo)}
                        className={`relative group bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        {/* Badge de seleccionado */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        {/* Ícono del elemento */}
                        <div className="flex items-start space-x-3">
                          <div className={`p-3 rounded-lg ${
                            isSelected ? 'bg-green-100' : 'bg-blue-50'
                          }`}>
                            <Package className={`h-6 w-6 ${
                              isSelected ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                              {elementoCatalogo.nombre}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span className="font-medium">Unidad:</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{elementoCatalogo.unidad}</span>
                            </div>
                          </div>
      </div>

                        {/* Footer con opciones disponibles */}
                        {(elementoCatalogo.opciones || elementoCatalogo.tareas) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {elementoCatalogo.opciones && (
                                <div className="flex items-center space-x-1">
                                  <Settings className="h-3 w-3" />
                                  <span>{Object.keys(elementoCatalogo.opciones).length} opciones</span>
                                </div>
                              )}
                              {elementoCatalogo.tareas && (
                                <div className="flex items-center space-x-1">
                                  <Check className="h-3 w-3" />
                                  <span>{elementoCatalogo.tareas.length} tareas</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-opacity pointer-events-none"></div>
                      </div>
                    );
                  })}
                </div>
        </div>
            ))}

            {/* Botón para crear elemento personalizado */}
            <div className="mt-6 text-center">
        <button
          onClick={() => setShowModalPersonalizado(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
                <span>Crear elemento personalizado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer con navegación */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePreviousCategory}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <div className="text-sm text-gray-600">
              {elementos.filter(e => e.categoria === categoriaActual).length} elemento(s) seleccionado(s) en esta categoría
            </div>

            <button
              onClick={handleNextCategory}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <span>{currentCategoryIndex === categoriasOrdenadas.length - 1 ? 'Finalizar selección' : 'Siguiente'}</span>
              <ChevronRight className="h-4 w-4" />
        </button>
          </div>
        </div>
      </div>

      {/* Panel lateral de resumen */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Resumen de Selección
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {elementos.length} elemento{elementos.length !== 1 ? 's' : ''} total{elementos.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {elementos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ningún elemento seleccionado</p>
            </div>
          ) : (
            <>
              {categoriasOrdenadas.map(cat => {
                const elementosCategoria = elementos.filter(e => e.categoria === cat);
                if (elementosCategoria.length === 0) return null;

                return (
                  <div key={cat} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">
                        {getCategoryIcon(cat)} {cat}
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {elementosCategoria.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {elementosCategoria.map(elemento => (
                        <div key={elemento.id} className="flex items-start justify-between text-xs">
                          <span className="text-gray-700 flex-1">{elemento.nombre}</span>
                          <button
                            onClick={() => handleRemoveElemento(elemento.id)}
                            className="text-red-400 hover:text-red-600 ml-2"
                            title="Quitar"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
            ))}
          </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Botón de ver resumen completo */}
        {elementos.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-200">
            <button
              onClick={() => setShowResumen(true)}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Ver Resumen Completo
            </button>
          </div>
        )}
      </div>

      {/* Modal de configuración de elemento */}
      {configuringElemento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{configuringElemento.nombre}</h3>
                <p className="text-sm text-gray-600 mt-1">{configuringElemento.subcategoria}</p>
              </div>
              <button
                onClick={() => setConfiguringElemento(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Opciones */}
              {configuringElemento.opciones && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-blue-600" />
                    Opciones de Configuración
                  </h4>
                  {Object.entries(configuringElemento.opciones).map(([key, values]: [string, any]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(values) ? (
                          values.map((value: string) => (
                            <label key={value} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
                              <input type="checkbox" className="rounded text-blue-600" />
                              <span className="text-sm text-gray-700">{value}</span>
                            </label>
                          ))
                        ) : (
                          <span className="text-sm text-gray-600">{values}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tareas */}
              {configuringElemento.tareas && configuringElemento.tareas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-600" />
                    Tareas Incluidas ({configuringElemento.tareas.length})
                  </h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {configuringElemento.tareas.map((tarea: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{tarea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Cantidad */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    defaultValue={1}
                    min="0.01"
                    step="0.01"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-600">{configuringElemento.unidad}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setConfiguringElemento(null)}
                className="px-6 py-2 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmElement({})}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Agregar a la Obra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resumen completo */}
      {showResumen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-green-500 text-white">
              <div>
                <h3 className="text-2xl font-bold">Resumen Completo de Elementos</h3>
                <p className="text-blue-100 mt-1">{elementos.length} elementos seleccionados</p>
              </div>
              <button
                onClick={() => setShowResumen(false)}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
      </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {categoriasOrdenadas.map(cat => {
                const elementosCategoria = elementos.filter(e => e.categoria === cat);
                if (elementosCategoria.length === 0) return null;

                return (
                  <div key={cat} className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl">{getCategoryIcon(cat)}</span>
                      <h4 className="text-lg font-semibold text-gray-900">{cat}</h4>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {elementosCategoria.length} elemento{elementosCategoria.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {elementosCategoria.map(elemento => (
                        <div key={elemento.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{elemento.nombre}</h5>
                              {elemento.subcategoria && (
                                <p className="text-sm text-gray-600 mt-1">{elemento.subcategoria}</p>
                              )}
                              <div className="mt-2 flex items-center space-x-3 text-sm">
                                <span className="text-gray-600">
                                  Cantidad: <span className="font-medium text-gray-900">{elemento.cantidad}</span>
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">{elemento.unidad}</span>
                              </div>
                            </div>
        <button
                              onClick={() => handleRemoveElemento(elemento.id)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Quitar elemento"
        >
                              <Trash2 className="h-4 w-4" />
        </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
        <button
                onClick={() => setShowResumen(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
                Cerrar
        </button>
      </div>
          </div>
        </div>
      )}

      {/* Modal para elemento personalizado */}
      <ModalElementoPersonalizado
        isOpen={showModalPersonalizado}
        onClose={() => {
          setShowModalPersonalizado(false);
          setEditingElemento(undefined);
        }}
        onSave={handleSaveElementoPersonalizado}
        elemento={editingElemento}
      />
    </div>
  );
}
