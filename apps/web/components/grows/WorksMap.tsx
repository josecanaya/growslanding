'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import type { PublicObra } from '@/lib/obras/publication';
import 'leaflet/dist/leaflet.css';

type LocatedWork = Pick<PublicObra, 'id' | 'title' | 'location' | 'mapPoint'>;

const testWork = '569e1eda-3fcb-453a-b394-d8a1a536648e';
const rosario = { lat: -32.9468, lng: -60.6393 };
const tiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function publicPoint(work: LocatedWork) {
  if (work.mapPoint) return { ...work.mapPoint, approximate: false };
  return work.id === testWork ? { ...rosario, approximate: true } : null;
}

export default function WorksMap({ works, initialWorkId }: { works: LocatedWork[]; initialWorkId?: string }) {
  const [selected, setSelected] = useState(initialWorkId);
  const [status, setStatus] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const selectedWork = works.find((work) => work.id === selected);
  const point = selectedWork && publicPoint(selectedWork);

  useEffect(() => {
    if (!container.current) return;
    const element = container.current;
    let active = true;
    let map: LeafletMap | undefined;
    const currentMarkers = markers.current;

    import('leaflet').then((leaflet) => {
      if (!active) return;
      map = leaflet.map(element, { scrollWheelZoom: false }).setView(rosario, 12);
      mapRef.current = map;
      const layer = leaflet.tileLayer(tiles, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      layer.on('tileerror', () => setStatus('Algunas calles no se pudieron cargar. Las fichas siguen disponibles en la lista.'));
      layer.on('tileload', () => setStatus(''));
      layer.addTo(map);

      const positions: [number, number][] = [];
      for (const work of works) {
        const location = publicPoint(work);
        if (!location) continue;
        const coordinates: [number, number] = [location.lat, location.lng];
        const marker = leaflet.marker(coordinates, {
          title: work.title,
          alt: work.title,
          icon: leaflet.divIcon({
            className: '',
            html: '<span class="block size-6 rounded-full border-[3px] border-white bg-[#193c32] shadow-md"></span>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
        const tooltip = document.createElement('span');
        tooltip.textContent = work.title;
        marker.bindTooltip(tooltip);
        marker.on('click', () => setSelected(work.id));
        currentMarkers.set(work.id, marker);
        positions.push(coordinates);
      }
      const initial = initialWorkId && currentMarkers.get(initialWorkId);
      if (initial) map.setView(initial.getLatLng(), 13);
      else if (positions.length) map.fitBounds(positions, { maxZoom: 13, padding: [32, 32] });
      setStatus('');
    }).catch(() => {
      if (active) setStatus('No pudimos cargar el mapa. Podés abrir las fichas desde la lista.');
    });

    return () => {
      active = false;
      map?.remove();
      mapRef.current = null;
      currentMarkers.clear();
    };
  }, [works, initialWorkId]);

  function focusWork(id: string) {
    setSelected(id);
    const marker = markers.current.get(id);
    if (marker) {
      mapRef.current?.panTo(marker.getLatLng());
      marker.openTooltip();
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 overflow-hidden rounded-3xl border border-[#dee5d9] bg-[#e8eee4]">
        <div ref={container} aria-label="Mapa interactivo de las obras" className="relative z-0 h-[54vh] min-h-80 w-full" />
        {status && <p role="status" className="bg-white px-5 py-3 text-sm">{status}</p>}
      </div>
      <div className="space-y-4">
        {selectedWork && <section className="rounded-3xl border border-[#dee5d9] bg-white px-5 py-4">
          <h2 className="font-semibold">{selectedWork.title}</h2>
          <p className="mt-1 text-sm text-[#53695d]">{selectedWork.location}</p>
          {point?.approximate && <p className="mt-2 text-xs text-[#53695d]">Ubicación de referencia en Rosario. Obra de ensayo.</p>}
          <Link href={`/inversores?obra=${selectedWork.id}` as Route} className="mt-4 inline-flex rounded-full bg-[#193c32] px-4 py-2 text-sm font-semibold text-white">Abrir ficha</Link>
        </section>}
        <section className="rounded-3xl border border-[#dee5d9] bg-white px-5 py-4">
          <h2 className="font-semibold">Obras publicadas</h2>
          {works.length > 0 ? <ul className="mt-2 divide-y divide-[#e2e8df]">{works.map((work) => <li key={work.id} className="py-3">
            <button type="button" aria-pressed={selected === work.id} onClick={() => focusWork(work.id)} className="w-full text-left text-sm font-semibold hover:underline">{work.title}</button>
            <p className="mt-1 text-xs text-[#53695d]">{work.location}{publicPoint(work) ? '' : ' · Sin punto publicado'}</p>
          </li>)}</ul> : <p className="mt-3 text-sm text-[#53695d]">Todavía no hay obras publicadas.</p>}
        </section>
      </div>
    </div>
  );
}
