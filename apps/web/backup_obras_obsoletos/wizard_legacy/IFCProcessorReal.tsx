'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Building2, Filter, File as FileIcon, Layers, RotateCcw, Search, Upload } from 'lucide-react';
import type { IFCElement } from '../../../lib/services/ifcReader';
import { elementos as catalogoElementos } from '../../../lib/catalogos/elementos';
type ThreeModule = typeof import('three');
type OrbitControlsType = import('three/examples/jsm/controls/OrbitControls').OrbitControls;
type IFCLoaderType = import('web-ifc-three/IFCLoader').IFCLoader;

type EstadoMapeo = 'mapeado' | 'pendiente';
interface CatalogEntry {
  categoria: string;
  nombre: string;
  normalized: string;
  opciones: string[];
}

interface IfcElemento {
  guid: string;
  type: string;
  name: string;
  ifcType: string;
  expressID: number;
  category: string | null;
  idCatalogo: string | null;
  opcionesCatalogo: string[];
  estadoMapeo: EstadoMapeo;
  mapped: boolean;
  confidence: number;
  reason?: string;
}
interface ImportadorBIMProps {
  onElementosImportados: (elementos: IfcElemento[]) => void;
  onCancel: () => void;
}

interface ViewerContext {
  THREE: ThreeModule | null;
  renderer: import('three').WebGLRenderer | null;
  scene: import('three').Scene | null;
  camera: import('three').PerspectiveCamera | null;
  controls: OrbitControlsType | null;
  ifcLoader: IFCLoaderType | null;
  highlightMaterial: import('three').MeshLambertMaterial | null;
  model: import('three').Mesh | null;
  selectedSubset: import('three').Object3D | null;
  animationId?: number;
  resizeListener?: () => void;
}
const KEYWORDS_BY_TYPE: Record<string, string[]> = {
  IfcWall: ['muro', 'pared', 'tabique'],
  IfcSlab: ['losa', 'platea', 'entrepis'],
  IfcBeam: ['viga'],
  IfcColumn: ['columna', 'pilar'],
  IfcDoor: ['puerta'],
  IfcWindow: ['ventana'],
  IfcFooting: ['cimiento', 'fundacion'],
  IfcPlate: ['placa', 'panel'],
  IfcSpace: ['espacio', 'ambiente'],
  IfcRoof: ['techo', 'cubierta'],
};
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function formatFileSize(bytes: number): string {
  if (!bytes) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, index);
  const precision = size >= 10 ? 0 : 1;
  return size.toFixed(precision) + ' ' + units[index];
}
function disposeModel(model: import('three').Object3D | null, three: ThreeModule | null): void {
  if (!model || !three) {
    return;
  }
  model.traverse((child: any) => {
    if (child.isMesh) {
      if (child.geometry?.dispose) {
        child.geometry.dispose();
      }
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat: any) => mat?.dispose?.());
      } else if (material?.dispose) {
        material.dispose();
      }
    }
  });
}

function getWasmBasePath(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/wasm/';
  }
  return '/wasm/';
}
export default function IFCProcessorReal({ onElementosImportados, onCancel }: ImportadorBIMProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ViewerContext>({
    THREE: null,
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    ifcLoader: null,
    highlightMaterial: null,
    model: null,
    selectedSubset: null,
  });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [elementosProcesados, setElementosProcesados] = useState<IfcElemento[]>([]);
  const [errorProcesamiento, setErrorProcesamiento] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'mapeados' | 'pendientes'>('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [elementoSeleccionado, setElementoSeleccionado] = useState<IfcElemento | null>(null);
  const catalogEntries = useMemo<CatalogEntry[]>(() => {
    return catalogoElementos.flatMap((categoria) =>
      categoria.tipos.map((tipo) => ({
        categoria: categoria.categoria,
        nombre: tipo.nombre,
        normalized: normalizeText(tipo.nombre),
        opciones: Array.from(
          new Set([
            ...(tipo.fases?.estructura ?? []),
            ...(tipo.fases?.obra_gris ?? []),
            ...(tipo.fases?.terminaciones ?? []),
          ])
        ),
      }))
    );
  }, []);
  const matchCatalog = useCallback(
    (ifcType: string, candidateName: string) => {
      const normalizedCandidate = normalizeText(candidateName);
      const exact = catalogEntries.find((entry) => entry.normalized === normalizedCandidate);
      if (exact) {
        return {
          categoria: exact.categoria,
          idCatalogo: exact.nombre,
          opciones: exact.opciones,
          reason: 'Coincidencia exacta por nombre',
        };
      }

      const keywords = KEYWORDS_BY_TYPE[ifcType] ?? [];
      for (const keyword of keywords) {
        const match = catalogEntries.find((entry) => entry.normalized.includes(keyword));
        if (match) {
          return {
            categoria: match.categoria,
            idCatalogo: match.nombre,
            opciones: match.opciones,
            reason: 'Coincidencia por palabra clave "' + keyword + '"',
          };
        }
      }

      const typeKey = normalizeText(ifcType.replace(/^Ifc/, ''));
      const fallback = catalogEntries.find(
        (entry) =>
          entry.normalized.includes(typeKey) || typeKey.includes(entry.normalized)
      );
      if (fallback) {
        return {
          categoria: fallback.categoria,
          idCatalogo: fallback.nombre,
          opciones: fallback.opciones,
          reason: 'Coincidencia por tipo IFC',
        };
      }

      const partial = catalogEntries.find((entry) => normalizedCandidate.includes(entry.normalized));
      if (partial) {
        return {
          categoria: partial.categoria,
          idCatalogo: partial.nombre,
          opciones: partial.opciones,
          reason: 'Coincidencia parcial por nombre',
        };
      }

      return null;
    },
    [catalogEntries]
  );
  const enrichElement = useCallback(
    (item: IFCElement): IfcElemento => {
      const match = matchCatalog(item.ifcType, item.name);
      const mapped = Boolean(match);
      return {
        guid: item.guid,
        type: item.ifcType,
        name: item.name,
        ifcType: item.ifcType,
        expressID: item.expressID,
        category: match?.categoria ?? null,
        idCatalogo: match?.idCatalogo ?? null,
        opcionesCatalogo: match?.opciones ?? [],
        estadoMapeo: mapped ? 'mapeado' : 'pendiente',
        mapped,
        confidence: mapped ? 0.9 : 0.25,
        reason: match?.reason ?? 'Sin coincidencias en catalogo',
      };
    },
    [matchCatalog]
  );
  const clearViewer = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    if (viewer.ifcLoader && viewer.highlightMaterial && viewer.scene && viewer.model) {
      viewer.ifcLoader.ifcManager.removeSubset(
        viewer.model.modelID,
        viewer.highlightMaterial,
        viewer.scene
      );
    }
    if (viewer.model && viewer.scene) {
      disposeModel(viewer.model, viewer.THREE);
      viewer.scene.remove(viewer.model);
      viewer.model = null;
    }
  }, []);
  const centerModel = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.model || !viewer.THREE || !viewer.camera || !viewer.controls) {
      return;
    }
    const { THREE } = viewer;
    const box = new THREE.Box3().setFromObject(viewer.model);
    if (box.isEmpty()) {
      return;
    }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const distance = maxSize ? maxSize * 1.6 : 10;

    viewer.controls.target.copy(center);
    viewer.camera.position.set(center.x + distance, center.y + distance, center.z + distance);
    viewer.camera.near = Math.max(distance / 1000, 0.1);
    viewer.camera.far = distance * 100;
    viewer.camera.updateProjectionMatrix();
  }, []);
  const highlightElement = useCallback((expressID?: number) => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.model || !viewer.ifcLoader || !viewer.scene || !viewer.highlightMaterial) {
      return;
    }
    if (expressID == null) {
      viewer.ifcLoader.ifcManager.removeSubset(
        viewer.model.modelID,
        viewer.highlightMaterial,
        viewer.scene
      );
      return;
    }
    viewer.ifcLoader.ifcManager.createSubset({
      modelID: viewer.model.modelID,
      ids: [expressID],
      material: viewer.highlightMaterial,
      scene: viewer.scene,
      removePrevious: true,
    });
  }, []);
  const loadModel = useCallback(
    async (file: File) => {
      const viewer = viewerRef.current;
      if (!viewer || !viewer.ifcLoader || !viewer.scene) {
        return;
      }

      const wasmBase = getWasmBasePath();
      viewer.ifcLoader.ifcManager.setWasmPath(wasmBase, true);

      if (viewer.model && viewer.scene) {
        if (viewer.ifcLoader && viewer.highlightMaterial) {
          viewer.ifcLoader.ifcManager.removeSubset(
            viewer.model.modelID,
            viewer.highlightMaterial,
            viewer.scene
          );
        }
        disposeModel(viewer.model, viewer.THREE);
        viewer.scene.remove(viewer.model);
        viewer.model = null;
      }

      const url = URL.createObjectURL(file);
      try {
        const mesh = await viewer.ifcLoader.loadAsync(url);
        mesh.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        viewer.scene.add(mesh);
        viewer.model = mesh;
        centerModel();
      } catch (error) {
        console.error('[IFC] Error al renderizar el modelo IFC', error);
        throw error;
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [centerModel]
  );
  const limpiarModelo = useCallback(() => {
    clearViewer();
    setArchivoSeleccionado(null);
    setElementosProcesados([]);
    setElementoSeleccionado(null);
    setErrorProcesamiento(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearViewer]);
  const handleArchivoSeleccionado = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      window.alert('Selecciona un archivo IFC valido');
      return;
    }
    clearViewer();
    setArchivoSeleccionado(file);
    setElementosProcesados([]);
    setElementoSeleccionado(null);
    setErrorProcesamiento(null);
  }, [clearViewer]);
  const procesarArchivo = useCallback(async () => {
    if (!archivoSeleccionado) {
      return;
    }

    setProcesando(true);
    setErrorProcesamiento(null);
    setElementosProcesados([]);

    try {
      const { leerArchivoIFC } = await import('../../../lib/services/ifcReader');
      const rawElements = await leerArchivoIFC(archivoSeleccionado);
      const mapped = rawElements.map(enrichElement);
      mapped.sort((a, b) => Number(b.mapped) - Number(a.mapped) || a.name.localeCompare(b.name));
      setElementosProcesados(mapped);
      setElementoSeleccionado(mapped[0] ?? null);
      await loadModel(archivoSeleccionado);
      centerModel();
    } catch (error) {
      console.error('[IFC] Error al procesar archivo IFC', error);
      setErrorProcesamiento('No se pudo leer el archivo IFC real');
      setElementosProcesados([]);
      clearViewer();
    } finally {
      setProcesando(false);
    }
  }, [archivoSeleccionado, centerModel, clearViewer, enrichElement, loadModel]);
  const confirmarImportacion = useCallback(() => {
    onElementosImportados(elementosProcesados);
  }, [elementosProcesados, onElementosImportados]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    let disposed = false;

    (async () => {
      const [{ default: THREE }, controlsModule, ifcModule] = await Promise.all([
        import('three'),
        import('three/examples/jsm/controls/OrbitControls'),
        import('web-ifc-three/IFCLoader'),
      ]);

      if (disposed) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const { OrbitControls } = controlsModule;
      const { IFCLoader } = ifcModule;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / Math.max(container.clientHeight, 1),
        0.1,
        1000
      );
      camera.position.set(12, 12, 12);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(15, 20, 12);
      scene.add(ambientLight);
      scene.add(directionalLight);

      const highlightMaterial = new THREE.MeshLambertMaterial({
        color: 0xff9800,
        transparent: true,
        opacity: 0.4,
      });

      const ifcLoader = new IFCLoader();
      ifcLoader.ifcManager.setWasmPath(getWasmBasePath(), true);

      viewerRef.current = {
        THREE,
        renderer,
        scene,
        camera,
        controls,
        ifcLoader,
        highlightMaterial,
        model: null,
        selectedSubset: null,
      };

      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        viewerRef.current.animationId = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current) {
          return;
        }
        const { clientWidth, clientHeight } = containerRef.current;
        renderer.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / Math.max(clientHeight, 1);
        camera.updateProjectionMatrix();
      };

      window.addEventListener('resize', handleResize);
      viewerRef.current.resizeListener = handleResize;
    })();
    return () => {
      disposed = true;
      const viewer = viewerRef.current;
      if (viewer.animationId) {
        cancelAnimationFrame(viewer.animationId);
      }
      if (viewer.resizeListener) {
        window.removeEventListener('resize', viewer.resizeListener);
      }
      if (viewer.controls) {
        viewer.controls.dispose();
      }
      if (viewer.renderer) {
        viewer.renderer.dispose();
      }
      if (viewer.scene && viewer.model) {
        disposeModel(viewer.model, viewer.THREE);
        viewer.scene.remove(viewer.model);
      }
      viewer.ifcLoader?.ifcManager?.dispose();
      viewerRef.current = {
        THREE: null,
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        ifcLoader: null,
        highlightMaterial: null,
        model: null,
        selectedSubset: null,
      };
    };
  }, []);
  useEffect(() => {
    if (!elementoSeleccionado) {
      highlightElement(undefined);
      return;
    }
    highlightElement(elementoSeleccionado.expressID);
  }, [elementoSeleccionado, highlightElement]);
  const tiposDisponibles = useMemo(() => {
    const tipos = Array.from(new Set(elementosProcesados.map((item) => item.ifcType))).sort();
    return ['todos', ...tipos];
  }, [elementosProcesados]);

  const elementosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return elementosProcesados.filter((elemento) => {
      const matchesSearch =
        term.length === 0 ||
        elemento.name.toLowerCase().includes(term) ||
        elemento.ifcType.toLowerCase().includes(term) ||
        (elemento.category ?? '').toLowerCase().includes(term);
      const matchesEstado = filtroEstado === 'todos' || elemento.estadoMapeo === filtroEstado;
      const matchesTipo = filtroTipo === 'todos' || elemento.ifcType === filtroTipo;
      return matchesSearch && matchesEstado && matchesTipo;
    });
  }, [elementosProcesados, busqueda, filtroEstado, filtroTipo]);

  const totalMapeados = useMemo(() => elementosProcesados.filter((item) => item.mapped).length, [elementosProcesados]);
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return null;
  }
  if (!archivoSeleccionado) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-8 text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Importar modelo BIM (IFC)</h2>
              <p className="text-gray-600 mt-2">
                Selecciona un archivo IFC real para identificar elementos constructivos y crear el visor 3D.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ifc"
                onChange={handleArchivoSeleccionado}
                className="hidden"
                id="ifc-file-input"
              />
              <label
                htmlFor="ifc-file-input"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
              >
                <Upload className="h-5 w-5 mr-2" />
                Seleccionar archivo IFC
              </label>
            </div>
            <p className="text-sm text-gray-500">Formatos soportados: .ifc (Industry Foundation Classes)</p>
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }
  const fileSizeLabel = archivoSeleccionado ? formatFileSize(archivoSeleccionado.size) : null;
  if (archivoSeleccionado && elementosProcesados.length === 0 && !procesando && !errorProcesamiento) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Archivo listo para procesar</h2>
            <p className="text-gray-600 mt-2">
              Se importara el archivo {archivoSeleccionado.name} y se generara el listado de elementos reales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <span className="text-sm text-gray-500">Nombre</span>
              <div className="font-medium text-gray-900 mt-1 break-all">{archivoSeleccionado.name}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <span className="text-sm text-gray-500">Tamaño</span>
              <div className="font-medium text-gray-900 mt-1">{fileSizeLabel}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <span className="text-sm text-gray-500">Fecha de carga</span>
              <div className="font-medium text-gray-900 mt-1">{new Date().toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={procesarArchivo}
              className="inline-flex items-center px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Procesar archivo IFC
            </button>
            <button
              onClick={limpiarModelo}
              className="inline-flex items-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cambiar archivo
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (archivoSeleccionado && errorProcesamiento && elementosProcesados.length === 0 && !procesando) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-red-200 rounded-lg shadow-sm p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-red-600">No fue posible leer el archivo IFC</h2>
              <p className="text-gray-600 mt-2">
                {errorProcesamiento}. Verifica que los binarios web-ifc esten disponibles y que el archivo no este dañado.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={procesarArchivo}
              className="inline-flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar procesamiento
            </button>
            <button
              onClick={limpiarModelo}
              className="inline-flex items-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Seleccionar otro archivo
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex flex-col h-full">
      {procesando && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-700">Procesando archivo IFC...</p>
        </div>
      )}
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Importacion de modelo real</h2>
            <p className="text-sm text-gray-600">
              Elementos mapeados: {totalMapeados} de {elementosProcesados.length}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={procesarArchivo}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reprocesar IFC
            </button>
            <button
              onClick={limpiarModelo}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cambiar archivo
            </button>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4 text-sm text-gray-700">
          <span className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-gray-500" />
            {archivoSeleccionado?.name}
          </span>
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            Tamano {fileSizeLabel}
          </span>
        </div>
        {errorProcesamiento && elementosProcesados.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
            <div>
              <p className="text-sm text-yellow-700">{errorProcesamiento}</p>
              <button
                onClick={procesarArchivo}
                className="mt-2 inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                Reintentar procesamiento
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="lg:w-1/2 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Elementos detectados</h3>
                <p className="text-sm text-gray-600">Lista de entidades IFC cargadas desde el archivo</p>
              </div>
              <div className="text-sm text-gray-500">
                {elementosProcesados.length} elementos
              </div>
            </div>
            <div className="p-4 space-y-4 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por nombre o tipo"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  Estado
                </div>
                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                  {['todos', 'mapeados', 'pendientes'].map((estado) => (
                    <button
                      key={estado}
                      onClick={() => setFiltroEstado(estado as 'todos' | 'mapeados' | 'pendientes')}
                      className={`px-3 py-1 text-sm rounded ${
                        filtroEstado === estado ? 'bg-white shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo IFC</label>
                <select
                  value={filtroTipo}
                  onChange={(event) => setFiltroTipo(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {tiposDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo === 'todos' ? 'Todos los tipos' : tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {elementosFiltrados.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  Carga un modelo IFC para ver los elementos detectados.
                </div>
              ) : (
                elementosFiltrados.map((elemento) => (
                  <button
                    key={elemento.guid}
                    onClick={() => setElementoSeleccionado(elemento)}
                    className={`w-full text-left border rounded-lg p-3 transition ${
                      elementoSeleccionado?.guid === elemento.guid
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-2.5 w-2.5 rounded-full ${
                            elemento.estadoMapeo === 'mapeado' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{elemento.name}</div>
                          <div className="text-xs text-gray-500">{elemento.ifcType}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Confianza {(elemento.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="lg:w-1/2 bg-gray-100 border border-gray-200 rounded-lg shadow-sm flex flex-col">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Visor 3D</h3>
                <p className="text-sm text-gray-600">Explora el modelo y resalta elementos individuales</p>
              </div>
            </div>
            <div className="relative flex-1 min-h-[320px]">
              <div ref={containerRef} className="w-full h-full bg-white" />
              <button
                onClick={centerModel}
                className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Centrar vista
                </div>
              </button>
            </div>
            <div className="border-t border-gray-200 bg-white p-4">
              {elementoSeleccionado ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{elementoSeleccionado.name}</h4>
                    <p className="text-sm text-gray-600">{elementoSeleccionado.ifcType}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <span className="text-gray-500">GUID</span>
                      <div className="font-medium text-gray-900 break-all">{elementoSeleccionado.guid}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Express ID</span>
                      <div className="font-medium text-gray-900">{elementoSeleccionado.expressID}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Categoria detectada</span>
                      <div className="font-medium text-gray-900">{elementoSeleccionado.category ?? 'Sin categoria'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Catalogo</span>
                      <div className="font-medium text-gray-900">{elementoSeleccionado.idCatalogo ?? 'Pendiente de asignar'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Confianza</span>
                      <div className="font-medium text-gray-900">{(elementoSeleccionado.confidence * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado</span>
                      <div className="font-medium text-gray-900">
                        {elementoSeleccionado.estadoMapeo === 'mapeado' ? 'Mapeado' : 'Pendiente'}
                      </div>
                    </div>
                  </div>
                  {elementoSeleccionado.opcionesCatalogo.length > 0 && (
                    <div className="text-sm text-gray-700">
                      <span className="text-gray-500 block mb-1">Opciones asociadas</span>
                      <div className="flex flex-wrap gap-2">
                        {elementoSeleccionado.opcionesCatalogo.map((opcion) => (
                          <span key={opcion} className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50">
                            {opcion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {elementoSeleccionado.reason && (
                    <p className="text-xs text-gray-500">{elementoSeleccionado.reason}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-6">
                  Selecciona un elemento para ver sus detalles y resaltarlo en el visor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-t border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Layers className="h-4 w-4" />
          <span>{totalMapeados} elementos listos para catalogo</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onElementosImportados(elementosProcesados)}
            disabled={elementosProcesados.length === 0}
            className={`inline-flex items-center px-4 py-2 rounded-lg ${
              elementosProcesados.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Confirmar elementos
          </button>
        </div>
      </div>
    </div>
  );
}
