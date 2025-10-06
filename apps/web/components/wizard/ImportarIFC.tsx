'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { Upload, RefreshCw, CheckCircle2, AlertTriangle, Search, Filter, Layers, Box } from 'lucide-react';
import type { EstadoMapeoIFC, IfcElemento, ProcesamientoIFC } from '@/lib/services/ifcReader';
import { ifcReader } from '@/lib/services/ifcReader';

const COLOR_MAPEADO = 0x0f4c81;
const COLOR_PENDIENTE = 0xe63946;

type EstadoFiltro = 'todos' | 'mapeado' | 'pendiente';

interface ImportarIFCProps {
  onFinalizar?: (elementos: IfcElemento[]) => void;
  onCancelar?: () => void;
}

export function ImportarIFC({ onFinalizar, onCancelar }: ImportarIFCProps) {
  const [procesamiento, setProcesamiento] = useState<ProcesamientoIFC | null>(null);
  const [elementos, setElementos] = useState<IfcElemento[]>([]);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [archivoCargado, setArchivoCargado] = useState<File | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; name: string; type: string } | null>(null);

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const loaderRef = useRef<IFCLoader | null>(null);
  const modelIDRef = useRef<number | null>(null);
  const animationRef = useRef<number>();
  const elementosRef = useRef<IfcElemento[]>([]);
  const selectionMaterialRef = useRef(new THREE.MeshLambertMaterial({ color: 0xffd166, transparent: true, opacity: 0.6 }));
  const hoverMaterialRef = useRef(new THREE.MeshLambertMaterial({ color: 0xfff3bf, transparent: true, opacity: 0.6 }));

  useEffect(() => {
    elementosRef.current = elementos;
  }, [elementos]);

  const iniciarEscena = useCallback(async () => {
    if (!viewerRef.current || typeof window === 'undefined') {
      return;
    }

    const contenedor = viewerRef.current;
    const width = contenedor.clientWidth;
    const height = contenedor.clientHeight || 520;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    contenedor.innerHTML = '';
    contenedor.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(6, 6, 6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 1, 0);
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(10, 10, 10);
    scene.add(ambientLight, directional);

    const grid = new THREE.GridHelper(20, 40, 0xbfc0c0, 0xe0e2e4);
    scene.add(grid);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!contenedor) return;
      const w = contenedor.clientWidth;
      const h = contenedor.clientHeight || 520;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', onResize);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationRef.current ?? 0);
      controls.dispose();
      renderer.dispose();
      contenedor.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    iniciarEscena();
  }, [iniciarEscena]);

  const prepararIFCLoader = useCallback(async (): Promise<IFCLoader> => {
    if (loaderRef.current) {
      return loaderRef.current;
    }
    const modulo = await import('web-ifc-three/IFCLoader');
    const loader = new modulo.IFCLoader();
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const wasmBase = origin ? `${origin}/wasm/` : '/wasm/';
      loader.ifcManager.setWasmPath(wasmBase);
      try {
        loader.ifcManager.useWebWorkers(true, `${wasmBase}web-ifc-worker.js`);
      } catch (workerError) {
        console.warn('[ImportarIFC] No se pudo configurar web workers:', workerError);
      }

      const manager: any = loader.ifcManager;
      if (typeof manager.setOnProgress === 'function') {
        manager.setOnProgress((event: ProgressEvent) => {
          if (event.total > 0) {
            setProgreso(Math.round((event.loaded / event.total) * 100));
          }
        });
      }
    } catch (err) {
      console.warn('[ImportarIFC] No se pudo configurar la ruta WASM', err);
    }
    loaderRef.current = loader;
    return loader;
  }, []);

  const pintarModelo = useCallback((modelID: number, loader: IFCLoader, elementosModelo: IfcElemento[]) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    const materiales = {
      mapeado: new THREE.MeshLambertMaterial({ color: COLOR_MAPEADO, transparent: true, opacity: 0.6 }),
      pendiente: new THREE.MeshLambertMaterial({ color: COLOR_PENDIENTE, transparent: true, opacity: 0.6 })
    } as const;

    const grupos: Record<EstadoMapeoIFC, number[]> = {
      mapeado: [],
      pendiente: []
    };

    for (const elemento of elementosModelo) {
      if (typeof elemento.expressID !== 'number') continue;
      grupos[elemento.estadoMapeo].push(elemento.expressID);
    }

    scene.children
      .filter((child) => Boolean((child as any).isIFCSubset))
      .forEach((subset) => scene.remove(subset));

    (Object.keys(grupos) as EstadoMapeoIFC[]).forEach((estado) => {
      const ids = grupos[estado];
      if (!ids.length) return;
      try {
        const subset = loader.ifcManager.createSubset({
          modelID,
          ids,
          material: materiales[estado],
          removePrevious: true,
          customID: `estado-${estado}`
        });
        (subset as any).isIFCSubset = true;
        scene.add(subset);
      } catch (err) {
        console.warn('[ImportarIFC] Error creando subset', estado, err);
      }
    });
  }, []);

  const centrarVista = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const box = new THREE.Box3().setFromObject(scene);
    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      controls.target.copy(center);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 1.5 / Math.tan((camera.fov * Math.PI) / 360);
      const direction = new THREE.Vector3(1, 1, 1).normalize();
      camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
      controls.update();
    }
  }, []);

  const resetSelection = useCallback(() => {
    if (!loaderRef.current || modelIDRef.current == null) return;
    try {
      loaderRef.current.ifcManager.removeSubset(modelIDRef.current, selectionMaterialRef.current, 'seleccion');
      loaderRef.current.ifcManager.removeSubset(modelIDRef.current, hoverMaterialRef.current, 'hover');
    } catch (err) {
      console.warn('[ImportarIFC] No se pudo limpiar selección', err);
    }
  }, []);

  const resaltarElemento = useCallback((expressID: number | null) => {
    if (!loaderRef.current || modelIDRef.current == null) return;
    const loader = loaderRef.current;
    const modelID = modelIDRef.current;
    resetSelection();
    if (expressID == null) return;
    try {
      loader.ifcManager.createSubset({
        modelID,
        ids: [expressID],
        material: selectionMaterialRef.current,
        removePrevious: true,
        customID: 'seleccion'
      });
    } catch (err) {
      console.warn('[ImportarIFC] No se pudo resaltar elemento', err);
    }
  }, [resetSelection]);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !loaderRef.current) return;

    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const loader = loaderRef.current;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: PointerEvent) => {
      if (!renderer?.domElement || modelIDRef.current == null) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const intersection = intersects.find((item) => !!item.object.visible);

      if (!intersection || typeof intersection.faceIndex !== 'number') {
        setHoverInfo(null);
        try {
          loader.ifcManager.removeSubset(modelIDRef.current!, hoverMaterialRef.current, 'hover');
        } catch (err) {
          // ignore
        }
        return;
      }

      const expressID = loader.ifcManager.getExpressId(intersection.object.geometry, intersection.faceIndex);
      if (typeof expressID !== 'number') {
        setHoverInfo(null);
        return;
      }

      const elemento = elementosRef.current.find((el) => el.expressID === expressID);
      if (!elemento || !renderer.domElement) {
        setHoverInfo(null);
        return;
      }

      try {
        loader.ifcManager.createSubset({
          modelID: modelIDRef.current!,
          ids: [expressID],
          material: hoverMaterialRef.current,
          removePrevious: true,
          customID: 'hover'
        });
      } catch (err) {
        console.warn('[ImportarIFC] Error resaltando hover', err);
      }

      setHoverInfo({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        name: elemento.name,
        type: elemento.type
      });
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointermove', onPointerMove);

    return () => {
      domElement.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  const cargarArchivo = useCallback(async (file: File) => {
    setCargando(true);
    setProgreso(0);
    setError(null);
    setSeleccion(null);

    try {
      setArchivoCargado(file);
      const resultado = await ifcReader.procesarArchivoIFC(file);
      setProcesamiento(resultado);
      setElementos(resultado.elementos);
      resetSelection();

      const loader = await prepararIFCLoader();
      const blobURL = URL.createObjectURL(file);
      try {
        const escena = sceneRef.current;
        if (escena) {
          escena.children
            .filter((child) => Boolean((child as any).isIFCModel))
            .forEach((child) => escena.remove(child));
        }

        const mesh = await loader.loadAsync(blobURL);
        (mesh as any).isIFCModel = true;
        sceneRef.current?.add(mesh);
        modelIDRef.current = (mesh as any).modelID ?? null;
        if (modelIDRef.current != null) {
          pintarModelo(modelIDRef.current, loader, resultado.elementos);
        }
        centrarVista();
      } finally {
        URL.revokeObjectURL(blobURL);
      }
    } catch (err) {
      console.error('[ImportarIFC] Error cargando archivo', err);
      setError('No se pudo procesar el archivo IFC. Intentalo nuevamente.');
    } finally {
      setCargando(false);
      setTimeout(() => setProgreso(0), 1200);
    }
  }, [centrarVista, pintarModelo, prepararIFCLoader, resetSelection]);

  const handleArchivo = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      cargarArchivo(file);
    }
  }, [cargarArchivo]);

  const handleSeleccion = useCallback((elemento: IfcElemento) => {
    setSeleccion(elemento.guid);
    if (typeof elemento.expressID === 'number') {
      resaltarElemento(elemento.expressID);
    }
  }, [resaltarElemento]);

  const handleReintentar = () => {
    const remapeados = ifcReader.reintentarMapeo(elementos);
    setElementos(remapeados);
    if (modelIDRef.current && loaderRef.current) {
      pintarModelo(modelIDRef.current, loaderRef.current, remapeados);
    }
  };

  const handleFinalizar = () => {
    onFinalizar?.(elementos);
  };

  const tiposDisponibles = useMemo(() => {
    const conjunto = new Set<string>();
    elementos.forEach((elemento) => conjunto.add(elemento.type));
    return Array.from(conjunto).sort();
  }, [elementos]);

  const elementosFiltrados = useMemo(() => {
    return elementos.filter((elemento) => {
      if (filtroEstado !== 'todos' && elemento.estadoMapeo !== filtroEstado) return false;
      if (filtroTipo !== 'todos' && elemento.type !== filtroTipo) return false;
      if (filtroTexto && !`${elemento.name} ${elemento.type}`.toLowerCase().includes(filtroTexto.toLowerCase())) return false;
      return true;
    });
  }, [elementos, filtroEstado, filtroTexto, filtroTipo]);

  const elementosAgrupados = useMemo(() => {
    const grupos: Record<string, IfcElemento[]> = {};
    elementosFiltrados.forEach((elemento) => {
      grupos[elemento.type] = grupos[elemento.type] || [];
      grupos[elemento.type].push(elemento);
    });
    return grupos;
  }, [elementosFiltrados]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Paso</span>
        <h1 className="text-2xl font-semibold text-slate-900">Importar modelo BIM (IFC)</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Cargá un archivo IFC para vincular automáticamente los elementos del modelo con nuestro catálogo constructivo.
          Podés revisar, ajustar asignaciones y visualizar el modelo en 3D antes de continuar.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Layers className="h-4 w-4" /> Elementos IFC
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {elementos.length}
              </span>
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-400">
              <Upload className="h-4 w-4" />
              <span>{archivoCargado ? archivoCargado.name : 'Importar archivo IFC'}</span>
              <input type="file" accept=".ifc" className="hidden" onChange={handleArchivo} />
            </label>
            {progreso > 0 && progreso < 100 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cargando</span>
                  <span>{progreso}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progreso}%` }} />
                </div>
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-3 px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
                placeholder="Buscar elementos..."
                value={filtroTexto}
                onChange={(event) => setFiltroTexto(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Filter className="h-3.5 w-3.5" /> Estado
              </label>
              <div className="flex flex-wrap gap-2">
                {['todos', 'mapeado', 'pendiente'].map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => setFiltroEstado(estado as EstadoFiltro)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      filtroEstado === estado
                        ? 'border-sky-500 bg-sky-50 text-sky-600'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {estado === 'todos' ? 'Todos' : estado === 'mapeado' ? 'Mapeados' : 'Pendientes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Box className="h-3.5 w-3.5" /> Tipo IFC
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={filtroTipo}
                onChange={(event) => setFiltroTipo(event.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                {tiposDisponibles.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto border-t border-slate-200">
            {Object.entries(elementosAgrupados).length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                Cargá un modelo IFC para ver los elementos detectados.
              </div>
            )}
            {Object.entries(elementosAgrupados).map(([tipo, items]) => (
              <div key={tipo} className="border-b border-slate-100 last:border-none">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                  <span>{tipo}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">{items.length}</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {items.map((elemento) => (
                    <li key={elemento.guid}>
                      <button
                        type="button"
                        onClick={() => handleSeleccion(elemento)}
                        className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                          seleccion === elemento.guid ? 'bg-sky-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{elemento.name}</span>
                          {elemento.estadoMapeo === 'mapeado' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                              <CheckCircle2 className="h-3 w-3" /> Mapeado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                              <AlertTriangle className="h-3 w-3" /> Pendiente
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[12px] text-slate-500">
                          <span className="truncate">Catálogo: {elemento.idCatalogo ?? 'Sin asignar'}</span>
                          <span>GUID: {elemento.guid}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Vista previa 3D</h2>
              <p className="text-xs text-slate-500">Orbita, acerca y seleccioná elementos para verificar el mapeo.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={centrarVista}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Centrar vista
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            <div ref={viewerRef} className="absolute inset-0" />
            {cargando && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 text-sm text-slate-600">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
                <span className="mt-3">Procesando modelo IFC...</span>
              </div>
            )}
            {hoverInfo && (
              <div
                className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-md"
                style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
              >
                <div className="font-medium text-slate-700">{hoverInfo.name}</div>
                <div className="text-[11px] text-slate-500">{hoverInfo.type}</div>
              </div>
            )}
          </div>

          {procesamiento && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="font-medium text-slate-700">{procesamiento.nombreArchivo}</span>
                <span>Total elementos: <strong>{procesamiento.resumen.total}</strong></span>
                <span>Mapeados: <strong className="text-sky-600">{procesamiento.resumen.mapeados}</strong></span>
                <span>Pendientes: <strong className="text-rose-600">{procesamiento.resumen.pendientes}</strong></span>
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          Recordá verificar manualmente los elementos pendientes antes de continuar.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReintentar}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar mapeo
          </button>
          <button
            type="button"
            onClick={() => onCancelar?.()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={!elementos.length}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continuar
          </button>
        </div>
      </footer>
    </div>
  );
}

export default ImportarIFC;
