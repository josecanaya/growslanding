'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { GrowsCommandBar } from '@/components/cliente/canvas-editor/workspace/GrowsCommandBar';
import PublicationEditor from './PublicationEditor';
import type { Procurement, comparableQuotes } from '@/lib/obras/procurement';

type Workspace = Procurement & {
  obra: { id: string; name: string; objetivo_texto: string | null; estado: string | null };
  comparisons: ReturnType<typeof comparableQuotes>;
};
const tabs = ['Resumen', 'Presupuestos', 'Publicación'] as const;

export default function ObraWorkspace({ obraId }: { obraId: string }) {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [tab, setTab] = useState<typeof tabs[number]>('Resumen');
  const [agent, setAgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/obras/' + obraId + '/espacio', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) {
        setUnauthorized(response.status === 401);
        throw new Error(result.error);
      }
      setData(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar la obra.'); }
  }, [obraId]);
  useEffect(() => { void load(); }, [load]);

  async function requestAgent(prompt: string) {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/obras/' + obraId + '/bridge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enqueue', prompt, provider: 'local' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setAgent(true);
      setNotice('Pedido registrado. Podés seguir la respuesta en el panel del agente.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'No se pudo enviar el pedido.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f5f7f4] px-5 py-6 pb-28 text-[#19362d]">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/inversores" className="text-2xl font-bold">Grows.</Link>
        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/inversores">Feed público</Link>
          <Link href="/cliente/dashboard">Mis proyectos</Link>
          <Link href={('/acceder?sector=trabajo&obra=' + obraId) as Route}>Espacio de contratista</Link>
        </nav>
      </header>
      {error ? <section role="alert" className="rounded-2xl border bg-white p-6"><p>{error}</p>
        {unauthorized ? <Link href={('/auth/login?redirect=' + encodeURIComponent('/obras/' + obraId)) as Route} className="mt-4 inline-block underline">Ingresar</Link> : <button onClick={load} className="mt-4 underline">Reintentar</button>}
      </section> : !data ? <p role="status">Cargando la obra compartida…</p> : <>
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#718274]">Espacio de obra</p>
          <h1 className="text-3xl font-semibold">{data.obra.name}</h1>
          <p className="text-[#62776b]">{data.obra.objetivo_texto}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={('/cliente/tareas/' + obraId + '/editor') as Route} className="rounded-lg bg-[#19362d] px-4 py-3 text-white">Organizar trabajos y pliegos</Link>
            <button onClick={() => setAgent(true)} className="rounded-lg border border-[#bfd0bd] bg-white px-4 py-3">Conversar con el agente</button>
            <Link href={('/inversores?obra=' + obraId) as Route} className="rounded-lg border border-[#bfd0bd] bg-white px-4 py-3">Ver publicación</Link>
          </div>
        </section>
        <nav aria-label="Secciones de la obra" className="flex gap-2 border-b border-[#dfe6df]">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} aria-current={tab === item ? 'page' : undefined} className={`px-4 py-3 text-sm ${tab === item ? 'border-b-2 border-[#19362d] font-semibold' : ''}`}>{item}</button>)}
        </nav>
        {tab === 'Publicación' ? <section className="rounded-2xl border border-[#dfe6df] bg-white p-6"><PublicationEditor obraId={obraId} /></section> : tab === 'Resumen' ? <>
          <section className="grid gap-4 sm:grid-cols-3">
            {[['Trabajos publicados', data.tasks.length], ['Cotizaciones registradas', data.quotes.length], ['Trabajos validados', data.tasks.filter((task) => task.estado === 'validada').length]].map(([label, value]) =>
              <div key={label} className="rounded-2xl border border-[#dfe6df] bg-white p-5"><p className="text-sm text-[#62776b]">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></div>)}
          </section>
          <section className="space-y-4 rounded-2xl border border-[#dfe6df] bg-white p-6">
            <h2 className="text-xl font-semibold">Trabajar con agentes</h2>
            <p className="text-sm text-[#62776b]">El agente consulta el plan, los trabajos y las cotizaciones de esta obra. Sus propuestas quedan disponibles para revisión en el panel.</p>
            <div className="flex flex-wrap gap-3">
              <button disabled={busy} onClick={() => requestAgent('Revisá el plan de esta obra. Proponé el orden de trabajos y sus dependencias, identificá tareas faltantes y supuestos. Conservá el trabajo existente y prepará cambios para revisión.')} className="rounded-lg border px-4 py-2 disabled:opacity-50">Ordenar los trabajos</button>
              <button disabled={busy} onClick={() => requestAgent('Compará las cotizaciones reales de procurement por tarea, alcance, moneda y plazo. Indicá faltantes y diferencias. No inventes precios ni mezcles monedas. Respondé con el análisis y operations vacío.')} className="rounded-lg border px-4 py-2 disabled:opacity-50">Comparar cotizaciones</button>
              <button disabled={busy} onClick={() => requestAgent('Revisá procurement y el plan. Indicá trabajos pendientes de cotización, tareas que bloquean otras y próximos pasos. Usá únicamente el estado registrado. Respondé con el análisis y operations vacío.')} className="rounded-lg border px-4 py-2 disabled:opacity-50">Revisar seguimiento</button>
            </div>
            {notice && <p role="status" className="text-sm">{notice}</p>}
          </section>
          <section className="overflow-x-auto rounded-2xl border border-[#dfe6df] bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Estado de los trabajos</h2>
            {!data.tasks.length ? <p>Publicá los trabajos desde el plan para iniciar la contratación y el seguimiento.</p> : <table className="w-full text-left text-sm"><thead><tr><th className="py-3">Trabajo</th><th>Etapa</th><th>Estado</th><th>Avance</th></tr></thead><tbody>{data.tasks.map((task) => <tr key={task.id} className="border-t border-[#e1e7df]"><td className="py-3">{task.title}</td><td>{task.etapa || '—'}</td><td>{task.estado}</td><td>{task.avance == null ? 'Sin informar' : task.avance + '%'}</td></tr>)}</tbody></table>}
          </section>
        </> : <section className="space-y-5 rounded-2xl border border-[#dfe6df] bg-white p-6">
          <h2 className="text-xl font-semibold">Cotizaciones por trabajo y alcance</h2>
          <p className="text-sm text-[#62776b]">Las ofertas se agrupan por tarea, moneda, cantidad y unidad. Revisá los plazos y las observaciones antes de adjudicar.</p>
          {data.comparisons.map((group, index) => <div key={index} className="overflow-x-auto rounded-xl border p-4">
            <h3 className="font-semibold">{data.tasks.find((task) => task.id === group.taskId)?.title || 'Trabajo'}</h3>
            <p className="my-2 text-xs">{group.currency} · {group.quantity == null ? 'Cantidad sin informar' : group.quantity} {group.unit || ''}</p>
            <table className="w-full text-left text-sm"><thead><tr><th>Oferta</th><th>Monto</th><th>Plazo</th><th>Estado</th><th>Observaciones</th></tr></thead><tbody>{group.quotes.map((quote) => <tr key={quote.id} className="border-t"><td className="py-3">{quote.id.slice(0, 8)}</td><td>{Number(quote.monto).toLocaleString('es-AR')} {group.currency}</td><td>{quote.dias_reales == null ? 'Sin informar' : quote.dias_reales + ' días'}</td><td>{quote.estado}</td><td className="max-w-xs break-words">{quote.notas || '—'}</td></tr>)}</tbody></table>
          </div>)}
          {!data.comparisons.length && <p>Todavía no hay ofertas enviadas con moneda y monto para comparar.</p>}
          <p className="text-sm text-[#62776b]">{data.quotes.length} registros de cotización en la obra, incluidas solicitudes y borradores.</p>
          <Link href={("/cliente/presupuesto?obra=" + obraId) as Route} className="inline-block rounded-lg bg-[#19362d] px-4 py-3 text-white">Revisar y adjudicar presupuestos</Link>
        </section>}
      </>}
    </div>
    {data && agent && <GrowsCommandBar obraId={obraId} breadcrumbItems={[{ id: null, title: data.obra.name }]} selectedIds={[]} onClearSelection={() => {}} onCanvasMaybeChanged={load} defaultOpen />}
  </main>;
}
