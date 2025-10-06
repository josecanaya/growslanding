'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, File, AlertTriangle, Building2, Layers, Search, Filter, RotateCcw } from 'lucide-react';

interface ImportarIFCInternalProps {
  onElementosImportados: (elementos: any[]) => void;
  onCancel: () => void;
}

interface ElementoIFC {
  id: string;
  nombre: string;
  tipo: string;
  guid: string;
  estado: 'mapeado' | 'pendiente' | 'error';
  elementoCatalogo?: string;
  opcionesDisponibles?: string[];
}

export default function ImportarIFCInternal({ onElementosImportados, onCancel }: ImportarIFCInternalProps) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [elementosProcesados, setElementosProcesados] = useState<ElementoIFC[]>([]);
  const [errorProcesamiento, setErrorProcesamiento] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'mapeados' | 'pendientes'>('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [elementoSeleccionado, setElementoSeleccionado] = useState<ElementoIFC | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);

  const handleArchivoSeleccionado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (archivo && archivo.name.toLowerCase().endsWith('.ifc')) {
      setArchivoSeleccionado(archivo);
      setErrorProcesamiento(false);
      setElementosProcesados([]);
    } else {
      alert('Por favor selecciona un archivo .ifc válido');
    }
  };

  const procesarArchivo = async () => {
    if (!archivoSeleccionado) return;

    setProcesando(true);
    setErrorProcesamiento(false);
    
    try {
      // Simular procesamiento con web-ifc-three
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generar elementos mock para demostración
      const elementosMock: ElementoIFC[] = [
        {
          id: 'ifc_001',
          nombre: 'Muro Exterior Principal',
          tipo: 'IfcWall',
          guid: 'wall_001',
          estado: 'pendiente',
          opcionesDisponibles: ['MUR001', 'MUR002', 'MUR003']
        },
        {
          id: 'ifc_002',
          nombre: 'Losa Planta Baja',
          tipo: 'IfcSlab',
          guid: 'slab_001',
          estado: 'mapeado',
          elementoCatalogo: 'LOS001'
        },
        {
          id: 'ifc_003',
          nombre: 'Viga Principal',
          tipo: 'IfcBeam',
          guid: 'beam_001',
          estado: 'pendiente',
          opcionesDisponibles: ['VIG001', 'VIG002']
        },
        {
          id: 'ifc_004',
          nombre: 'Columna A1',
          tipo: 'IfcColumn',
          guid: 'column_001',
          estado: 'error'
        }
      ];
      
      setElementosProcesados(elementosMock);
      
      // Renderizar modelo 3D mock
      await renderizarModelo3DMock();
      
    } catch (error) {
      console.error('Error al procesar archivo IFC:', error);
      setErrorProcesamiento(true);
    } finally {
      setProcesando(false);
    }
  };

  const renderizarModelo3DMock = async () => {
    if (!containerRef.current) return;

    try {
      // Limpiar el contenedor
      containerRef.current.innerHTML = '';
      
      // Crear canvas para el visor 3D
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.background = '#ffffff';
      
      // Agregar grid de fondo
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gridSize = 20;
        const width = canvas.width = containerRef.current.clientWidth;
        const height = canvas.height = containerRef.current.clientHeight;
        
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Dibujar líneas verticales
        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        
        // Dibujar líneas horizontales
        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        
        // Dibujar elementos mock del modelo
        const elementos = [
          { x: 100, y: 100, width: 200, height: 100, color: '#e3f2fd', border: '#1976d2', text: 'Muro Exterior' },
          { x: 350, y: 150, width: 150, height: 80, color: '#f3e5f5', border: '#7b1fa2', text: 'Losa' },
          { x: 200, y: 250, width: 100, height: 60, color: '#e8f5e8', border: '#388e3c', text: 'Columna' },
          { x: 350, y: 300, width: 120, height: 40, color: '#fff3e0', border: '#f57c00', text: 'Viga' }
        ];
        
        elementos.forEach((elemento) => {
          // Dibujar rectángulo
          ctx.fillStyle = elemento.color;
          ctx.fillRect(elemento.x, elemento.y, elemento.width, elemento.height);
          
          // Dibujar borde
          ctx.strokeStyle = elemento.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(elemento.x, elemento.y, elemento.width, elemento.height);
          
          // Dibujar texto
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(elemento.text, elemento.x + elemento.width / 2, elemento.y + elemento.height / 2 + 4);
        });
      }
      
      // Agregar al contenedor
      containerRef.current.appendChild(canvas);
      
    } catch (error) {
      console.error('Error al renderizar modelo 3D mock:', error);
    }
  };

  // Filtrar elementos según los filtros aplicados
  const elementosFiltrados = elementosProcesados.filter(elemento => {
    const cumpleBusqueda = elemento.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          elemento.tipo.toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleEstado = filtroEstado === 'todos' || 
                        (filtroEstado === 'mapeados' && elemento.estado === 'mapeado') ||
                        (filtroEstado === 'pendientes' && elemento.estado === 'pendiente');
    
    const cumpleTipo = filtroTipo === 'todos' || elemento.tipo === filtroTipo;
    
    return cumpleBusqueda && cumpleEstado && cumpleTipo;
  });

  const confirmarImportacion = () => {
    onElementosImportados(elementosProcesados);
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
  if (!procesando && elementosProcesados.length === 0) {
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

  // Si no hay archivo seleccionado, mostrar pantalla de selección
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

  // Si hay archivo pero se está procesando
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

  // Pantalla de confirmación del archivo seleccionado (como en la imagen)
  if (archivoSeleccionado && !procesando && !errorProcesamiento) {
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

  // Interfaz exacta como en la imagen
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con título */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900">PASO: Importar modelo BIM (IFC)</h2>
        <p className="text-gray-600">Cargá un modelo IFC para vincular los elementos del modelo con el catálogo de construcción, revisá, ajustá asignaciones y visualizá en 3D.</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Elementos IFC */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          {/* Header del panel izquierdo */}
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Elementos IFC</h3>
            
            {/* Archivo seleccionado */}
            {archivoSeleccionado && (
              <div className="mt-3 flex items-center space-x-2">
                <Upload className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{archivoSeleccionado.name}</span>
              </div>
            )}
            
            {/* Mensaje de error como en la imagen */}
            {errorProcesamiento && (
              <div className="mt-2 text-sm text-red-600">
                No se pudo procesar el archivo IFC. Intentalo nuevamente.
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="border-b border-gray-200 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar elementos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setFiltroEstado('todos')}
                  className={`px-3 py-1 text-sm rounded ${
                    filtroEstado === 'todos' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFiltroEstado('mapeados')}
                  className={`px-3 py-1 text-sm rounded ${
                    filtroEstado === 'mapeados' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Mapeados
                </button>
                <button 
                  onClick={() => setFiltroEstado('pendientes')}
                  className={`px-3 py-1 text-sm rounded ${
                    filtroEstado === 'pendientes' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Pendientes
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo IFC</label>
              <select 
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="IfcWall">IfcWall</option>
                <option value="IfcSlab">IfcSlab</option>
                <option value="IfcBeam">IfcBeam</option>
              </select>
            </div>
          </div>

          {/* Lista de elementos */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center text-gray-500 py-8">
              <div className="text-sm">Cargá un modelo IFC para ver los elementos detectados.</div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Vista 3D */}
        <div className="w-1/2 bg-gray-100 flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Vista previa 3D</h3>
            <p className="text-sm text-gray-600">Orbitá, acercá y seleccioná elementos para verificar el mapeo.</p>
          </div>
          
          <div className="flex-1 relative">
            <div 
              ref={containerRef}
              className="w-full h-full bg-white"
              style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
              {/* Vista 3D vacía como en la imagen */}
            </div>
            
            {/* Botón centrar vista */}
            <button className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50">
              <RotateCcw className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1 block">Centrar vista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-800">▲ Recordá verificar manualmente los elementos pendientes antes de continuar.</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Reintentar mapeo
            </button>
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmarImportacion}
              disabled={true}
              className="px-4 py-2 text-sm rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      {/* Navegación del wizard */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between">
          <button className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium">
            ← Anterior
          </button>
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
