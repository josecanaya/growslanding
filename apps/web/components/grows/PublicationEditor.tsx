'use client';
import { useEffect, useState } from 'react';
import type { Publication } from '@/lib/obras/publication';

export default function PublicationEditor({ obraId }: { obraId: string }) {
  const [publication, setPublication] = useState<Publication | null>(null);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setStatus('');
    try {
      const response = await fetch('/api/obras/' + obraId + '/publicacion', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPublication(data.publication);
      setRevision(data.revision);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No se pudo cargar.'); }
  }
  useEffect(() => { void load(); }, [obraId]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/obras/' + obraId + '/publicacion', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publication, revision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPublication(data.publication);
      setRevision(data.revision);
      setStatus(data.publication.visible ? 'La obra está publicada en el feed.' : 'La obra quedó fuera del feed público.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }

  if (!publication) return <div className="space-y-3"><p role="status">{status || 'Cargando publicación…'}</p><button onClick={load}>Reintentar</button></div>;
  const fields = [
    ['title', 'Nombre público', 160], ['summary', 'Resumen de la obra', 2400],
    ['location', 'Localidad o zona pública', 160], ['stage', 'Etapa actual', 120],
    ['coverUrl', 'URL HTTPS de la imagen de portada', 2000],
    ['contractorNotes', 'Alcance y oportunidades para contratistas', 2400],
    ['investorNotes', 'Información e hitos para inversores', 2400],
  ] as const;
  return <form onSubmit={save} className="space-y-5">
    <div><h2 className="text-xl font-semibold">Publicación de la obra</h2><p className="mt-2 text-sm text-[#62776b]">Revisá la información que podrán ver las personas que visitan Grows. Cada actualización publica los campos de este formulario.</p></div>
    {fields.map(([key, label, maxLength]) => <label key={key} className="block space-y-2 text-sm font-medium"><span>{label}</span><textarea rows={maxLength > 2000 ? 3 : 1} required={key === 'title'} maxLength={maxLength} value={publication[key]} onChange={(event) => setPublication({ ...publication, [key]: event.target.value })} className="block w-full rounded-lg border border-[#cdd9ce] bg-white p-3" /></label>)}
    <label className="block space-y-2 text-sm"><span>Avance que confirmás publicar (%)</span><input type="number" min="0" max="100" required value={publication.progress} onChange={(event) => setPublication({ ...publication, progress: Number(event.target.value) })} className="block rounded-lg border p-3" /></label>
    <fieldset className="space-y-3">
      <legend className="font-medium">Hitos publicados</legend>
      {publication.milestones.map((milestone, index) => <div key={index} className="flex flex-wrap gap-2">
        <input aria-label={'Hito ' + (index + 1)} required maxLength={160} value={milestone.title} onChange={(event) => setPublication({ ...publication, milestones: publication.milestones.map((item, i) => i === index ? { ...item, title: event.target.value } : item) })} className="min-w-0 flex-1 rounded-lg border p-2" />
        <select aria-label={'Estado del hito ' + (index + 1)} value={milestone.status} onChange={(event) => setPublication({ ...publication, milestones: publication.milestones.map((item, i) => i === index ? { ...item, status: event.target.value as typeof item.status } : item) })} className="rounded-lg border p-2">
          <option value="pendiente">Pendiente</option><option value="en_curso">En curso</option><option value="validado">Validado</option>
        </select>
        <button type="button" aria-label={'Quitar hito ' + (index + 1)} onClick={() => setPublication({ ...publication, milestones: publication.milestones.filter((_, i) => i !== index) })}>Quitar</button>
      </div>)}
      <button type="button" disabled={publication.milestones.length >= 20} onClick={() => setPublication({ ...publication, milestones: [...publication.milestones, { title: '', status: 'pendiente' }] })} className="text-sm underline">Agregar hito</button>
    </fieldset>
    <label className="flex items-center gap-3"><input type="checkbox" checked={publication.visible} onChange={(event) => setPublication({ ...publication, visible: event.target.checked })} />Publicar esta información en el feed</label>
    <div className="flex flex-wrap gap-3">
      <button disabled={busy} className="rounded-lg bg-[#19362d] px-5 py-3 text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar publicación'}</button>
      <button type="button" disabled={busy} onClick={load} className="rounded-lg border px-5 py-3">Recargar versión guardada</button>
    </div>
    {status && <p role="status" className="text-sm">{status}</p>}
  </form>;
}
