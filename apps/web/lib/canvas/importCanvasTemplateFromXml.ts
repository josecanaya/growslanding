import { parseProjectXml } from '@/lib/project/importProjectXml';
import { buildCanvasImportBundle, type ProjectCanvasImportBundle } from '@/lib/project/projectImportToCanvas';
import { getCanvasXmlLibraryEntry } from '@/lib/canvas/canvasXmlLibrary';
import { MSP_STUB_UID } from '@/lib/canvas/buildCanvasTemplateProjectXml';

export function canvasTemplateXmlPath(slug: string): string {
  return getCanvasXmlLibraryEntry(slug)?.xmlPath ?? `/canvas-templates/trabajo_comun/${slug}.xml`;
}

/** Mismo pipeline que «Importar XML» en Archivo: parse MSP → bundle de canvas. */
export function canvasImportBundleFromTemplateXml(xmlText: string): ProjectCanvasImportBundle {
  const preview = parseProjectXml(xmlText);
  const bundle = buildCanvasImportBundle(preview);
  const nodes = bundle.nodes.filter(
    (n) => n.importSourceUid !== MSP_STUB_UID && n.title !== '—',
  );
  const idSet = new Set(nodes.map((n) => n.id));
  const edges = bundle.edges.filter((e) => idSet.has(e.sourceId) && idSet.has(e.targetId));
  return { ...bundle, nodes, edges };
}

export async function fetchCanvasTemplateXml(slug: string): Promise<string> {
  const entry = getCanvasXmlLibraryEntry(slug);
  const path = entry?.xmlPath ?? canvasTemplateXmlPath(slug);
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`No se pudo cargar el XML: ${path}`);
  }
  return res.text();
}

export async function loadCanvasTemplateImportBundle(slug: string): Promise<ProjectCanvasImportBundle> {
  const xml = await fetchCanvasTemplateXml(slug);
  return canvasImportBundleFromTemplateXml(xml);
}
