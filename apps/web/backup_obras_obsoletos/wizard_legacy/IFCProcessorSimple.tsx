'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, File, AlertTriangle, Building2, Layers, Search, Filter, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { leerArchivoIFC } from '../../lib/services/ifcReader';

interface IfcElemento {
  guid: string;
  type: string;
  name: string;
  ifcType: string;
  expressID?: number;
  category?: string;
  idCatalogo: string | null;
  opcionesCatalogo: string[];
  estadoMapeo: 'mapeado' | 'pendiente';
  mapped: boolean;
  confidence: number;
  reason?: string;
  geometry?: THREE.Object3D;
}

interface ImportadorBIMProps {
  onElementosImportados: (elementos: any[]) => void;
  onCancel: () => void;
}

export default function ImportadorBIM({ onElementosImportados, onCancel }: ImportadorBIMProps) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [elementosProcesados, setElementosProcesados] = useState<IfcElemento[]>([]);
  const [errorProcesamiento, setErrorProcesamiento] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'mapeados' | 'pendientes'>('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [elementoSeleccionado, setElementoSeleccionado] = useState<IfcElemento | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modeloRef = useRef<THREE.Group | null>(null);

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
    setElementosProcesados([]);
    
    try {
      console.log(`🚀 Iniciando procesamiento de archivo IFC: ${archivoSeleccionado.name}`);
      
      // Procesar archivo IFC real
      const elementos = await leerArchivoIFC(archivoSeleccionado);
      
      console.log(`✅ Elementos procesados: ${elementos.length}`);
      setElementosProcesados(elementos);
      
      // Renderizar modelo 3D real
      await renderizarModelo3DReal(archivoSeleccionado);
      
    } catch (error) {
      console.error('❌ Error al procesar archivo IFC:', error);
      setErrorProcesamiento(true);
      setElementosProcesados([]);
    } finally {
      setProcesando(false);
    }
  };

  const renderizarModelo3DReal = async (archivo: File) => {
    if (!containerRef.current) return;

    try {
      // Limpiar el contenedor
      containerRef.current.innerHTML = '';
      
      // Crear escena Three.js
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      
      // Crear cámara
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(10, 10, 10);
      
      // Crear renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Crear controles de órbita
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Agregar al DOM
      containerRef.current.appendChild(renderer.domElement);
      
      // Agregar iluminación
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Cargar modelo IFC real
      const { IFCLoader } = await import('web-ifc-three/IFCLoader');
      const ifcLoader = new IFCLoader();
      ifcLoader.ifcManager.setWasmPath('/wasm/');
      
      const buffer = await archivo.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buffer]));
      const modelo = await ifcLoader.loadAsync(url) as THREE.Group;
      URL.revokeObjectURL(url);
      
      // Guardar referencias para resaltado
      const modelID = modelo.userData.modelID || 0;
      modelo.userData.ifcLoader = ifcLoader;
      modelo.userData.modelID = modelID;
      
      // Configurar el modelo
      modelo.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Guardar color original para resaltado
          if (!child.userData.originalColor) {
            child.userData.originalColor = child.material.color.getHex();
          }
        }
      });
      
      scene.add(modelo);
      modeloRef.current = modelo;
      
      // Calcular el bounding box y centrar la cámara
      const box = new THREE.Box3().setFromObject(modelo);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));
      cameraDistance *= 2; // Añadir margen
      
      camera.position.set(
        center.x + cameraDistance,
        center.y + cameraDistance,
        center.z + cameraDistance
      );
      controls.target.copy(center);
      controls.update();
      
      // Guardar referencias
      sceneRef.current = scene;
      rendererRef.current = renderer;
      controlsRef.current = controls;
      
      // Función de renderizado
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
      
      // Manejar redimensionamiento
      const handleResize = () => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        controls.dispose();
      };
      
    } catch (error) {
      console.error('Error al renderizar modelo 3D mock:', error);
      // Fallback: mostrar mensaje de error
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa;">
            <div style="text-align: center; color: #dc3545;">
              <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
              <div>No se pudo cargar el modelo 3D</div>
              <div style="font-size: 12px; margin-top: 4px;">Archivo no cargado</div>
            </div>
          </div>
        `;
      }
    }
  };

  // Filtrar elementos según los filtros aplicados
  const elementosFiltrados = elementosProcesados.filter(elemento => {
    const cumpleBusqueda = elemento.name.toLowerCase().includes(busqueda.toLowerCase()) ||
                          elemento.type.toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleEstado = filtroEstado === 'todos' || 
                        (filtroEstado === 'mapeados' && elemento.estadoMapeo === 'mapeado') ||
                        (filtroEstado === 'pendientes' && elemento.estadoMapeo === 'pendiente');
    
    const cumpleTipo = filtroTipo === 'todos' || elemento.type === filtroTipo;
    
    return cumpleBusqueda && cumpleEstado && cumpleTipo;
  });

  const confirmarImportacion = () => {
    onElementosImportados(elementosProcesados);
  };

  const centrarVista = () => {
    if (controlsRef.current && modeloRef.current) {
      const box = new THREE.Box3().setFromObject(modeloRef.current);
      const center = box.getCenter(new THREE.Vector3());
      
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  const resaltarElemento = (elemento: IfcElemento) => {
    if (modeloRef.current && elemento.expressID) {
      // Resetear colores de todos los elementos
      modeloRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.originalColor) {
          child.material.color.setHex(child.userData.originalColor);
        }
      });
      
      // Resaltar el elemento seleccionado usando el sistema de web-ifc-three
      if (modeloRef.current.userData.ifcLoader) {
        const ifcLoader = modeloRef.current.userData.ifcLoader;
        const modelID = modeloRef.current.userData.modelID || 0;
        
        // Obtener el mesh del elemento por expressID
        const mesh = ifcLoader.ifcManager.getMesh(modelID, elemento.expressID);
        if (mesh) {
          // Resaltar el mesh específico
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              if (mat.color) mat.color.setHex(0x007bff);
            });
          } else if (mesh.material.color) {
            mesh.material.color.setHex(0x007bff);
          }
        }
      }
    }
  };

  // Pantalla de selección de archivo
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

  // Pantalla de confirmación del archivo seleccionado
  if (archivoSeleccionado && !procesando && !errorProcesamiento && elementosProcesados.length === 0) {
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

  // Pantalla de procesamiento
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

  // Interfaz principal con sidebar izquierdo y visor 3D derecho (diseño original)
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con título */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900">PASO: Importar modelo BIM (IFC)</h2>
        <p className="text-gray-600">Cargá un modelo IFC para vincular los elementos del modelo con el catálogo de construcción, revisá, ajustá asignaciones y visualizá en 3D.</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar izquierdo - Elementos IFC */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          {/* Header del sidebar */}
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Elementos IFC</h3>
            
            {/* Archivo seleccionado */}
            {archivoSeleccionado && (
              <div className="mt-3 flex items-center space-x-2">
                <Upload className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{archivoSeleccionado.name}</span>
              </div>
            )}
            
            {/* Mensaje de error */}
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
                <option value="IfcColumn">IfcColumn</option>
                <option value="IfcDoor">IfcDoor</option>
                <option value="IfcWindow">IfcWindow</option>
              </select>
            </div>
          </div>

          {/* Lista de elementos */}
          <div className="flex-1 overflow-y-auto p-4">
            {elementosFiltrados.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">
                  {errorProcesamiento 
                    ? "No se pudieron cargar elementos del archivo IFC" 
                    : "Cargá un modelo IFC para ver los elementos detectados."
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {elementosFiltrados.map(elemento => (
                  <div 
                    key={elemento.guid} 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      elementoSeleccionado?.guid === elemento.guid 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setElementoSeleccionado(elemento);
                      resaltarElemento(elemento);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          elemento.estadoMapeo === 'mapeado' ? 'bg-green-500' :
                          elemento.estadoMapeo === 'pendiente' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{elemento.name}</div>
                          <div className="text-xs text-gray-500">{elemento.type}</div>
                        </div>
                      </div>
                      <div className="text-xs">
                        {elemento.estadoMapeo === 'mapeado' ? (
                          <span className="text-green-600">Mapeado</span>
                        ) : (
                          <span className="text-yellow-600">Pendiente</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Visor 3D derecho */}
        <div className="w-1/2 bg-gray-100 flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Vista previa 3D</h3>
            <p className="text-sm text-gray-600">Orbitá, acercá y seleccioná elementos para verificar el mapeo.</p>
          </div>
          
          <div className="flex-1 relative">
            <div 
              ref={containerRef}
              className="w-full h-full bg-white"
            >
              {/* Visor 3D con modelo mock */}
            </div>
            
            {/* Botón centrar vista */}
            <button 
              onClick={centrarVista}
              className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50"
            >
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
              disabled={elementosProcesados.length === 0}
              className={`px-4 py-2 text-sm rounded-lg ${
                elementosProcesados.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
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
