import { IFCLoader } from 'web-ifc-three';

export interface IFCElement {
  guid: string;
  ifcType: string;
  name: string;
  expressID: number;
}

const DEFAULT_WASM_PATH = '/wasm/';

function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

function toIfcTypeName(typeName: string): string {
  const base = typeName.replace(/^IFC/, '').toLowerCase();
  if (!base) {
    return 'IfcElement';
  }
  return base
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function resolveWasmPath(): string {
  const base = process.env.NEXT_PUBLIC_WASM_PATH ?? DEFAULT_WASM_PATH;
  return ensureTrailingSlash(base);
}

async function verificarWasmDisponible(wasmPath: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const url = `${window.location.origin}${wasmPath}web-ifc.wasm`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) {
      console.log('[IFC] WASM disponible en:', url);
    } else {
      console.error('[IFC] El archivo no respondio correctamente', res.status, 'en:', url);
    }
  } catch (error) {
    console.error('[IFC] No se pudo acceder al archivo wasm en', url, error);
  }
}

export async function leerArchivoIFC(file: File): Promise<IFCElement[]> {
  console.log(`[IFC] Archivo seleccionado: ${file.name}`);
  const wasmPath = resolveWasmPath();
  console.log('[IFC] Ruta WASM resuelta:', wasmPath);
  await verificarWasmDisponible(wasmPath);
  const buffer = await file.arrayBuffer();
  const ifcLoader = new IFCLoader();
  ifcLoader.ifcManager.setWasmPath(wasmPath, true);
  try {
    console.log('[IFC] Cargando modelo IFC desde:', wasmPath);
    const model = await ifcLoader.parse(buffer);
    console.log('[IFC] Archivo IFC cargado correctamente desde:', wasmPath);
    const modelID = model.modelID ?? 0;
    const { ifcManager } = ifcLoader;
    const targetTypes = [
      'IFCWALL',
      'IFCSLAB',
      'IFCWINDOW',
      'IFCDOOR',
      'IFCBEAM',
      'IFCFOOTING',
      'IFCPLATE',
      'IFCSPACE',
      'IFCCOLUMN',
      'IFCROOF',
    ];

    const elements: IFCElement[] = [];
    const seen = new Set<number>();

    for (const typeName of targetTypes) {
      const ifcTypeId = ifcManager.types[typeName];
      if (typeof ifcTypeId === 'undefined') continue;
      let itemIds: number[] = [];
      try {
        const ids = ifcManager.getAllItemsOfType(modelID, ifcTypeId, true);
        if (Array.isArray(ids)) {
          itemIds = ids.filter((value): value is number => typeof value === 'number');
        }
      } catch (error) {
        console.warn('[IFC] No se pudieron obtener elementos para', typeName, error);
        continue;
      }
      for (const expressID of itemIds) {
        if (seen.has(expressID)) continue;
        seen.add(expressID);
        try {
          const props = await ifcManager.getItemProperties(modelID, expressID, true);
          const guid = props.GlobalId?.value ?? `${typeName}-${expressID}`;
          const name =
            props.Name?.value?.trim() ??
            props.ObjectType?.value?.trim() ??
            toIfcTypeName(typeName);
          const ifcType = toIfcTypeName(typeName);
          elements.push({ guid, ifcType, name, expressID });
        } catch (error) {
          console.warn('[IFC] No se pudieron obtener propiedades para', typeName, `(${expressID})`, error);
        }
      }
    }
    console.log('[IFC] Elementos procesados correctamente:', elements.length);
    return elements;
  } catch (error) {
    console.error('[IFC] Error al procesar el archivo IFC', error);
    throw new Error('No se pudo leer el archivo IFC (verifique ruta wasm)');
  } finally {
    ifcLoader.ifcManager?.dispose?.();
  }
}
