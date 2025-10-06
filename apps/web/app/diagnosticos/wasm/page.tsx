'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { leerArchivoIFC } from '@/lib/services/ifcReader';
import type { IFCElement } from '@/lib/services/ifcReader';

type CheckOutcome = 'ok' | 'error';

interface CheckResult {
  label: string;
  url: string;
  status: CheckOutcome;
  statusCode: number | null;
  durationMs: number | null;
  error?: string;
}

interface ProcessSummary {
  fileName: string;
  elementCount: number;
  types: string[];
  elements: IFCElement[];
}

type ThreeModules = {
  THREE: typeof import('three');
  OrbitControls: typeof import('three/examples/jsm/controls/OrbitControls').OrbitControls;
  IFCLoader: typeof import('web-ifc-three').IFCLoader;
};

const FILES_TO_CHECK = [
  { label: 'web-ifc.wasm', path: '/wasm/web-ifc.wasm' },
  { label: 'web-ifc-worker.js', path: '/wasm/web-ifc-worker.js' },
  { label: 'web-ifc-mt.wasm', path: '/wasm/web-ifc-mt.wasm' },
] as const;

const ICONS = {
  pending: String.fromCodePoint(0x1f553),
  ok: String.fromCodePoint(0x1f7e2),
  error: String.fromCodePoint(0x1f534),
  success: String.fromCodePoint(0x2705),
  failure: String.fromCodePoint(0x274c),
  retry: String.fromCodePoint(0x1f504),
} as const;

const CANVAS_HEIGHT = 600;

function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

export default function WasmDiagnosticsPage(): JSX.Element {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [origin, setOrigin] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSummary, setProcessSummary] = useState<ProcessSummary | null>(null);
  const [threeModules, setThreeModules] = useState<ThreeModules | null>(null);

  const isMountedRef = useRef(true);
  const modulesPromiseRef = useRef<Promise<ThreeModules> | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<{
    renderer: import('three').WebGLRenderer;
    controls: import('three/examples/jsm/controls/OrbitControls').OrbitControls;
    scene: import('three').Scene;
    camera: import('three').PerspectiveCamera;
    animationFrame: number;
    resizeHandler: () => void;
    loader: import('web-ifc-three').IFCLoader;
  } | null>(null);

  const cleanupViewer = useCallback(() => {
    const current = viewerRef.current;
    if (!current) return;

    window.cancelAnimationFrame(current.animationFrame);
    current.controls.dispose();
    current.renderer.dispose();
    current.loader.ifcManager?.dispose?.();
    window.removeEventListener('resize', current.resizeHandler);
    if (current.renderer.domElement.parentElement) {
      current.renderer.domElement.parentElement.removeChild(current.renderer.domElement);
    }
    viewerRef.current = null;
    console.log('⚠️ [IFC] Vista 3D anterior liberada.');
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadModules = async () => {
      try {
        const [threeModule, controlsModule, ifcModule] = await Promise.all([
          import('three'),
          import('three/examples/jsm/controls/OrbitControls'),
          import('web-ifc-three'),
        ]);
        const modules: ThreeModules = {
          THREE: threeModule,
          OrbitControls: controlsModule.OrbitControls,
          IFCLoader: ifcModule.IFCLoader,
        };
        if (!cancelled) {
          setThreeModules(modules);
          console.log('✅ [IFC] Dependencias three.js cargadas.');
        }
        return modules;
      } catch (error) {
        if (!cancelled) {
          console.error('⚠️ [IFC] Error cargando dependencias three.js', error);
        }
        throw error;
      }
    };

    const promise = loadModules();
    modulesPromiseRef.current = promise;

    return () => {
      cancelled = true;
      modulesPromiseRef.current = null;
      cleanupViewer();
    };
  }, [cleanupViewer]);

  const performChecks = useCallback(async (): Promise<CheckResult[]> => {
    if (typeof window === 'undefined') {
      return FILES_TO_CHECK.map((file) => ({
        label: file.label,
        url: file.path,
        status: 'error',
        statusCode: null,
        durationMs: null,
        error: 'Contexto de ventana no disponible',
      }));
    }

    return Promise.all(
      FILES_TO_CHECK.map(async (file) => {
        const url = new URL(file.path, window.location.origin).href;
        const startedAt = performance.now();
        try {
          const response = await fetch(url, { method: 'HEAD' });
          const elapsed = Math.round(performance.now() - startedAt);
          const ok = response.status === 200 || response.status === 304;
          return {
            label: file.label,
            url,
            status: ok ? 'ok' : 'error',
            statusCode: response.status,
            durationMs: elapsed,
            error: ok ? undefined : `Respuesta ${response.status}`,
          } satisfies CheckResult;
        } catch (error) {
          const elapsed = Math.round(performance.now() - startedAt);
          return {
            label: file.label,
            url,
            status: 'error',
            statusCode: null,
            durationMs: elapsed,
            error: error instanceof Error ? error.message : String(error),
          } satisfies CheckResult;
        }
      })
    );
  }, []);

  const runChecks = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsChecking(true);
    setResults([]);
    try {
      const checks = await performChecks();
      if (!isMountedRef.current) return;
      setResults(checks);
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [performChecks]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const renderPreview = useCallback(
    async (buffer: ArrayBuffer) => {
      const modules =
        threeModules ?? (modulesPromiseRef.current ? await modulesPromiseRef.current : null);
      if (!modules) {
        throw new Error('Dependencias three.js no disponibles.');
      }
      if (!canvasContainerRef.current) {
        throw new Error('Contenedor del visor 3D no disponible.');
      }

      cleanupViewer();

      const container = canvasContainerRef.current;
      container.innerHTML = '';
      container.style.height = `${CANVAS_HEIGHT}px`;
      container.style.width = '100%';

      const { THREE, OrbitControls, IFCLoader } = modules;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      const initialWidth = container.clientWidth || container.offsetWidth || 800;
      renderer.setSize(initialWidth, CANVAS_HEIGHT);
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      const camera = new THREE.PerspectiveCamera(
        45,
        (container.clientWidth || 1) / CANVAS_HEIGHT,
        0.1,
        5000
      );
      camera.position.set(20, 20, 20);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 0, 0);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
      directionalLight.position.set(50, 50, 25);
      scene.add(ambientLight);
      scene.add(directionalLight);

      const loader = new IFCLoader();
      const wasmBase = ensureTrailingSlash(process.env.NEXT_PUBLIC_WASM_PATH ?? '/wasm/');
      loader.ifcManager.setWasmPath(wasmBase, true);

      console.log('✅ [IFC] Iniciando renderizado 3D desde:', wasmBase);
      const model = await loader.parse(buffer);
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 10;
      const fitDistance = maxDim * 1.8;

      camera.position.set(center.x + fitDistance, center.y + fitDistance, center.z + fitDistance);
      camera.near = Math.max(fitDistance / 100, 0.1);
      camera.far = Math.max(fitDistance * 10, 1000);
      camera.updateProjectionMatrix();

      controls.target.copy(center);
      controls.update();

      const resizeHandler = () => {
        if (!canvasContainerRef.current) return;
        const width = canvasContainerRef.current.clientWidth || renderer.domElement.width;
        camera.aspect = width / CANVAS_HEIGHT;
        camera.updateProjectionMatrix();
        renderer.setSize(width, CANVAS_HEIGHT);
      };

      window.addEventListener('resize', resizeHandler);

      const resources = {
        renderer,
        controls,
        scene,
        camera,
        animationFrame: 0,
        resizeHandler,
        loader,
      };

      viewerRef.current = resources;

      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        resources.animationFrame = window.requestAnimationFrame(animate);
      };

      resizeHandler();
      animate();

      console.log('✅ [IFC] Vista 3D renderizada correctamente.');
    },
    [cleanupViewer, threeModules]
  );

  const allChecked = results.length === FILES_TO_CHECK.length;
  const allOk = allChecked && results.every((result) => result.status === 'ok');
  const failed = results.filter((result) => result.status === 'error');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setProcessError(null);
    setProcessSummary(null);
    if (!file) {
      cleanupViewer();
    }
  };

  const handleProcess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setProcessError('Selecciona un archivo IFC para procesar.');
      return;
    }

    setIsProcessing(true);
    setProcessError(null);

    try {
      console.log(`✅ [IFC] Archivo seleccionado para procesar: ${selectedFile.name}`);
      const elements = await leerArchivoIFC(selectedFile);
      console.log(`✅ [IFC] Elementos detectados: ${elements.length}`);

      const types = Array.from(new Set(elements.map((item) => item.ifcType))).sort();

      setProcessSummary({
        fileName: selectedFile.name,
        elementCount: elements.length,
        types,
        elements,
      });

      const buffer = await selectedFile.arrayBuffer();
      await renderPreview(buffer);
    } catch (error) {
      console.error('⚠️ [IFC] Error procesando el archivo IFC', error);
      setProcessError(
        error instanceof Error ? error.message : 'Error desconocido al procesar el IFC.'
      );
      cleanupViewer();
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-gray-900">Diagnostico IFC</h1>
          <p className="text-sm text-gray-600">
            Verifica el acceso a los binarios de Web-IFC y comprueba la lectura/renderizado de archivos reales.
          </p>
        </header>

        <section className="space-y-4">
          {FILES_TO_CHECK.map((file) => {
            const result = results.find((entry) => entry.label === file.label);
            const statusIcon = !result
              ? ICONS.pending
              : result.status === 'ok'
              ? ICONS.ok
              : ICONS.error;
            const statusLabel = !result
              ? 'Pendiente'
              : result.status === 'ok'
              ? 'OK'
              : 'ERROR';
            const durationText = result?.durationMs != null ? `${result.durationMs} ms` : 'N/A';
            const codeText = result?.statusCode != null ? String(result.statusCode) : 'N/A';
            const displayUrl = result?.url ?? (origin ? new URL(file.path, origin).href : file.path);
            const statusClass = !result
              ? 'text-gray-500'
              : result.status === 'ok'
              ? 'text-green-600'
              : 'text-red-600';
            return (
              <article
                key={file.label}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`text-base font-medium ${statusClass}`}>
                    {statusIcon} {file.label} - {statusLabel} ({durationText})
                  </p>
                  <p className="break-all text-xs text-gray-500">{displayUrl}</p>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Codigo de respuesta: <span className="font-medium text-gray-900">{codeText}</span>
                </p>
                {result?.status === 'error' && result.error && (
                  <p className="mt-2 text-sm text-red-600">Detalle: {result.error}</p>
                )}
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
          {isChecking && results.length === 0 ? (
            <p className="text-sm text-gray-600">Comprobando acceso a los binarios IFC...</p>
          ) : allOk ? (
            <div className="space-y-3">
              <div className="text-4xl">{ICONS.success}</div>
              <p className="text-lg font-semibold text-green-600">
                Todos los binarios IFC estan accesibles correctamente.
              </p>
            </div>
          ) : allChecked ? (
            <div className="space-y-4">
              <div className="text-4xl">{ICONS.failure}</div>
              <p className="text-base font-semibold text-red-600">
                Se encontraron problemas al acceder a algunos binarios IFC.
              </p>
              <ul className="space-y-2 text-left text-sm text-gray-700">
                {failed.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span>{ICONS.error}</span>
                    <span>
                      <span className="font-medium text-gray-900">{item.label}</span>
                      {item.statusCode ? ` - codigo ${item.statusCode}` : ''}
                      {item.error ? ` - ${item.error}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Inicia el diagnostico para comprobar el acceso a los binarios IFC.
            </p>
          )}
        </section>

        <section className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">Analizador de archivos IFC</h2>
            <p className="text-sm text-gray-600">
              Carga un IFC para validar la lectura con Web-IFC y visualizarlo rapidamente en 3D.
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleProcess}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="file"
                accept=".ifc"
                onChange={handleFileChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!selectedFile || isProcessing}
                className="inline-flex min-w-[140px] justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? 'Procesando...' : 'Procesar'}
              </button>
            </div>
            {selectedFile && (
              <p className="text-xs text-gray-500">Archivo seleccionado: {selectedFile.name}</p>
            )}
          </form>

          {processError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠️ {processError}
            </p>
          )}

          {processSummary && (
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <p>✅ Archivo procesado: <span className="font-semibold">{processSummary.fileName}</span></p>
                <p>✅ Elementos procesados: <span className="font-semibold">{processSummary.elementCount}</span></p>
                <p>
                  ✅ Tipos detectados:
                  <span className="ml-1 text-gray-900">
                    {processSummary.types.length > 0 ? processSummary.types.join(', ') : 'Sin tipos detectados'}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Elementos detectados</h3>
                <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {processSummary.elements.length === 0 ? (
                    <p>No se detectaron elementos IFC.</p>
                  ) : (
                    <ul className="space-y-2">
                      {processSummary.elements.map((element) => (
                        <li key={`${element.ifcType}-${element.expressID}`} className="flex flex-col">
                          <span className="font-medium text-gray-900">{element.name}</span>
                          <span className="text-xs text-gray-500">
                            Tipo: {element.ifcType} ? GUID: {element.guid} ? ID: {element.expressID}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Vista 3D</h3>
                <div
                  ref={canvasContainerRef}
                  className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
                  style={{ minHeight: `${CANVAS_HEIGHT}px` }}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
