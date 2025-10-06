'use client';

import { useState } from 'react';
import { 
  Upload, 
  File, 
  Check, 
  AlertTriangle, 
  Edit3, 
  Building2,
  Layers,
  Filter,
  Search
} from 'lucide-react';

interface ElementoIFC {
  id: string;
  nombre: string;
  tipo: string;
  propiedades?: any;
  mapeado?: {
    elemento_catalogo?: string;
    opciones_disponibles?: string[];
    estado: 'mapeado' | 'no_mapeado' | 'pendiente';
    confianza?: number;
  };
}

interface ImportadorBIMSimpleProps {
  onElementosImportados: (elementos: ElementoIFC[]) => void;
  onCancel: () => void;
}

export function ImportadorBIMSimple({ onElementosImportados, onCancel }: ImportadorBIMSimpleProps) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [elementosMock, setElementosMock] = useState<ElementoIFC[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const handleArchivoSeleccionado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (archivo && archivo.name.toLowerCase().endsWith('.ifc')) {
      setArchivoSeleccionado(archivo);
    } else {
      alert('Por favor selecciona un archivo .ifc válido');
    }
  };

  const procesarArchivo = async () => {
    if (!archivoSeleccionado) return;

    setProcesando(true);
    
    // Simular procesamiento con elementos mock
    setTimeout(() => {
      const elementos: ElementoIFC[] = [
        {
          id: 'ifc_001',
          nombre: 'Muro Exterior Norte',
          tipo: 'IfcWall',
          propiedades: { nivel: 'Planta Baja', material: 'Ladrillo hueco 18cm' },
          mapeado: {
            elemento_catalogo: 'MUR001',
            opciones_disponibles: ['MUR001', 'MUR002', 'MUR003'],
            estado: 'mapeado',
            confianza: 0.9
          }
        },
        {
          id: 'ifc_002',
          nombre: 'Losa Planta Baja',
          tipo: 'IfcSlab',
          propiedades: { nivel: 'Planta Baja', material: 'Hormigón armado' },
          mapeado: {
            elemento_catalogo: 'LOS001',
            opciones_disponibles: ['LOS001', 'LOS002', 'LOS003'],
            estado: 'mapeado',
            confianza: 0.85
          }
        },
        {
          id: 'ifc_003',
          nombre: 'Elemento Desconocido',
          tipo: 'IfcBuildingElementProxy',
          propiedades: { nivel: 'Planta Baja', descripcion: 'Elemento sin clasificación' },
          mapeado: {
            elemento_catalogo: undefined,
            opciones_disponibles: [],
            estado: 'no_mapeado',
            confianza: 0
          }
        }
      ];
      
      setElementosMock(elementos);
      setProcesando(false);
    }, 2000);
  };

  const confirmarImportacion = () => {
    onElementosImportados(elementosMock);
  };

  // Filtrar elementos
  const elementosFiltrados = elementosMock.filter(elemento => {
    // Filtro por estado
    if (filtroEstado !== 'todos') {
      if (elemento.mapeado?.estado !== filtroEstado) return false;
    }

    // Filtro por búsqueda
    if (busqueda) {
      const textoBusqueda = busqueda.toLowerCase();
      return (
        elemento.nombre.toLowerCase().includes(textoBusqueda) ||
        elemento.tipo.toLowerCase().includes(textoBusqueda)
      );
    }

    return true;
  });

  const estadisticas = {
    total: elementosMock.length,
    mapeados: elementosMock.filter(e => e.mapeado?.estado === 'mapeado').length,
    noMapeados: elementosMock.filter(e => e.mapeado?.estado === 'no_mapeado').length,
    porcentaje: elementosMock.length > 0 ? 
      Math.round((elementosMock.filter(e => e.mapeado?.estado === 'mapeado').length / elementosMock.length) * 100) : 0
  };

  // Si no hay archivo seleccionado
  if (!archivoSeleccionado) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Importar Modelo BIM (IFC)</h3>
            <p className="text-gray-600 mb-8">
              Selecciona un archivo IFC para importar los elementos constructivos automáticamente
            </p>
            
            <div className="space-y-4">
              <input
                type="file"
                accept=".ifc"
                onChange={handleArchivoSeleccionado}
                className="hidden"
                id="archivo-ifc"
              />
              <label
                htmlFor="archivo-ifc"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <File className="h-5 w-5" />
                <span>Seleccionar archivo .ifc</span>
              </label>
              
              <div className="text-sm text-gray-500">
                Formatos soportados: .ifc (Industry Foundation Classes)
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay archivo pero no se ha procesado
  if (!procesando && elementosMock.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <File className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Archivo seleccionado</h3>
                <p className="text-gray-600">{archivoSeleccionado.name}</p>
                <p className="text-sm text-gray-500">
                  Tamaño: {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  El procesamiento puede tomar unos minutos dependiendo del tamaño del archivo
                </span>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setArchivoSeleccionado(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cambiar archivo
              </button>
              <button
                onClick={procesarArchivo}
                disabled={procesando}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {procesando ? 'Procesando...' : 'Procesar archivo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si se está procesando
  if (procesando) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
              <Layers className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Procesando archivo IFC</h3>
            <p className="text-gray-600">
              Extrayendo elementos constructivos del modelo BIM...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Interfaz de elementos procesados
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con estadísticas */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Elementos Importados</h3>
            <p className="text-sm text-gray-600">Archivo: {archivoSeleccionado.name}</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">Mapeados</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {estadisticas.mapeados}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-800">No mapeados</span>
            </div>
            <div className="text-lg font-bold text-red-600">
              {estadisticas.noMapeados}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Total</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {estadisticas.total}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800">% Mapeado</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {estadisticas.porcentaje}%
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar elementos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="mapeado">Mapeados</option>
            <option value="no_mapeado">No mapeados</option>
          </select>
        </div>
      </div>

      {/* Lista de elementos */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {elementosFiltrados.map(elemento => (
            <div key={elemento.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      elemento.mapeado?.estado === 'mapeado' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <h4 className="font-semibold text-gray-900">{elemento.nombre}</h4>
                      <p className="text-sm text-gray-600">Tipo IFC: {elemento.tipo}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {elemento.mapeado?.estado === 'mapeado' ? (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {elemento.mapeado.elemento_catalogo}
                      </div>
                      <div className="text-xs text-gray-500">
                        Confianza: {Math.round((elemento.mapeado?.confianza || 0) * 100)}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm text-red-600">No mapeado</div>
                      <div className="text-xs text-gray-500">Requiere mapeo manual</div>
                    </div>
                  )}
                  
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar mapeo"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {elementosFiltrados.length === 0 && (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron elementos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {estadisticas.mapeados} de {estadisticas.total} elementos mapeados
            </span>
            <button
              onClick={confirmarImportacion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Confirmar Importación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
