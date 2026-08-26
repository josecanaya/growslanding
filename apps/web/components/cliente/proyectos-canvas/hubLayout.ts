'use client';

import type { Edge, Node } from '@xyflow/react';
import type { ClienteObraListaItem } from '@/lib/hooks/useClienteObras';
import type { HubNodeData } from './HubFlowNode';

export type CanvasLevel =
  | { kind: 'root' }
  | { kind: 'proyecto'; obra: ClienteObraListaItem }
  | {
      kind: 'espacio';
      obra: ClienteObraListaItem;
      espacioId: string;
      title: string;
    };

export type HubFlowNode = Node<HubNodeData, 'hubNode'>;

export function layoutProyectos(obras: ClienteObraListaItem[]): {
  nodes: HubFlowNode[];
  edges: Edge[];
} {
  const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(obras.length, 1))));
  const nodes: HubFlowNode[] = obras.map((o, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: `obra-${o.id}`,
      type: 'hubNode',
      position: { x: col * 340, y: row * 200 },
      data: {
        kind: 'proyecto',
        obraId: o.id,
        title: o.name || 'Sin nombre',
        subtitle: o.address || undefined,
        estado: o.estado,
        tareas: o._count?.tareas ?? 0,
        graphMode: o.graphMode,
      },
      draggable: true,
    };
  });
  return { nodes, edges: [] };
}

export function layoutEspaciosProyecto(obra: ClienteObraListaItem): {
  nodes: HubFlowNode[];
  edges: Edge[];
} {
  const espacios: HubNodeData[] = [
    {
      kind: 'espacio',
      espacioId: 'organizar',
      title: 'Organizar',
      subtitle: 'Etapas, tareas, precedencias y CPM — el canvas de obra.',
      href: `/cliente/tareas/${obra.id}/editor`,
      icon: 'organizar',
      enterable: false,
    },
    {
      kind: 'espacio',
      espacioId: 'info',
      title: 'Info del proyecto',
      subtitle: 'Objetivo, contexto y notas. Entrá para ver nodos de contenido.',
      icon: 'info',
      enterable: true,
    },
    {
      kind: 'espacio',
      espacioId: 'planos',
      title: 'Planos',
      subtitle: 'Documentación gráfica y referencias de obra.',
      icon: 'planos',
      enterable: true,
    },
    {
      kind: 'espacio',
      espacioId: 'trabajo',
      title: 'Trabajo',
      subtitle: 'Validar, asignar y seguimiento operativo.',
      href: `/cliente/validar`,
      icon: 'trabajo',
      enterable: false,
    },
    {
      kind: 'espacio',
      espacioId: 'presupuesto',
      title: 'Presupuesto',
      subtitle: 'Grupos y montos del proyecto.',
      href: `/cliente/presupuesto`,
      icon: 'presupuesto',
      enterable: false,
    },
  ];

  const nodes: HubFlowNode[] = espacios.map((data, i) => ({
    id: `esp-${obra.id}-${(data as Extract<HubNodeData, { kind: 'espacio' }>).espacioId}`,
    type: 'hubNode',
    position: { x: (i % 3) * 280, y: Math.floor(i / 3) * 180 },
    data,
    draggable: true,
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      style: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.5 },
      animated: false,
    });
  }
  return { nodes, edges };
}

export function layoutContenidoEspacio(
  obra: ClienteObraListaItem,
  espacioId: string,
): { nodes: HubFlowNode[]; edges: Edge[] } {
  const packs: Record<string, HubNodeData[]> = {
    info: [
      {
        kind: 'contenido',
        title: 'Nombre',
        body: obra.name || 'Sin nombre',
      },
      {
        kind: 'contenido',
        title: 'Dirección / lote',
        body: obra.address || 'Todavía sin dirección cargada. Podés anotarla hablando o en Organizar.',
      },
      {
        kind: 'contenido',
        title: 'Estado',
        body: `${obra.estado || 'sin estado'} · ${obra._count?.tareas ?? 0} tareas · modo ${obra.graphMode || 'obra'}`,
      },
    ],
    planos: [
      {
        kind: 'contenido',
        title: 'Plano arquitectónico',
        body: 'Nodo listo para adjuntar planos. Por ahora es un contenedor: subí archivos desde Organizar o el inspector.',
      },
      {
        kind: 'contenido',
        title: 'Estructura / instalaciones',
        body: 'Espacio para capas de estructura, sanitarias, electricidad — como frames en Figma, pero nodos de obra.',
      },
      {
        kind: 'contenido',
        title: 'Referencias',
        body: 'Croquis, fotos de lote, restricciones municipales.',
      },
    ],
  };

  const items = packs[espacioId] ?? [
    {
      kind: 'contenido' as const,
      title: 'Vacío',
      body: 'Este espacio todavía no tiene nodos. Pedí en el chat o en Organizar lo que quieras meter acá.',
    },
  ];

  const nodes: HubFlowNode[] = items.map((data, i) => ({
    id: `cnt-${obra.id}-${espacioId}-${i}`,
    type: 'hubNode',
    position: { x: i * 300, y: 40 + (i % 2) * 40 },
    data,
    draggable: true,
  }));

  return { nodes, edges: [] };
}

export const CANVAS_BLUE_PRESETS = [
  { id: 'navy', label: 'Navy Grows', value: '#0C1D36' },
  { id: 'stitch', label: 'Stitch', value: '#163274' },
  { id: 'ink', label: 'Ink', value: '#001629' },
  { id: 'steel', label: 'Steel', value: '#1e3a5f' },
  { id: 'ocean', label: 'Ocean', value: '#0B3A5B' },
] as const;

export const CANVAS_BLUE_KEY = 'grows.canvas.corporateBlue';
