'use client';

import { Cloud, CloudUpload, FileInput, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  obraNombre: string;
  cloudSaveState: string;
  cloudSaveMessage: string | null;
  canvasHydrated: boolean;
  onImportXml: () => void;
  onSaveCloud: () => void;
  importBusy?: boolean;
};

function cloudStatusLabel(state: string): { label: string; tone: 'ok' | 'saving' | 'warn' } {
  if (state === 'saving') return { label: 'Guardando…', tone: 'saving' };
  if (state === 'err') return { label: 'Sin guardar · revisar', tone: 'warn' };
  if (state === 'dirty') return { label: 'Cambios sin guardar', tone: 'warn' };
  return { label: 'Guardado en la nube', tone: 'ok' };
}

export function CanvasArchivoTab({
  obraNombre,
  cloudSaveState,
  cloudSaveMessage,
  canvasHydrated,
  onImportXml,
  onSaveCloud,
  importBusy,
}: Props) {
  const status = cloudStatusLabel(cloudSaveState);
  const saving = cloudSaveState === 'saving' || importBusy;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6 md:p-10">
      <header className="mb-8 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Obra</p>
        <h1 className="mt-1 text-2xl font-black text-[#0f172a]">Archivo de obra</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Importá o exportá la planificación de <strong className="text-[#334155]">{obraNombre}</strong>.
        </p>
      </header>

      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <FileInput className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#0f172a]">Importar Project XML</h2>
              <p className="mt-1 text-xs text-[#64748b]">
                Cargá un archivo XML de Microsoft Project para reemplazar o iniciar la planificación del canvas.
              </p>
              <button
                type="button"
                onClick={onImportXml}
                disabled={importBusy}
                className="mt-4 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {importBusy ? 'Procesando…' : 'Cargar archivo XML'}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8fafc]">
              <CloudUpload className="h-5 w-5 text-[#94a3b8]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">Exportar XML</h2>
              <p className="mt-1 text-xs text-[#64748b]">Descargá la planificación actual como archivo.</p>
              <button
                type="button"
                disabled
                className="mt-4 cursor-not-allowed rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#94a3b8]"
                title="Próximamente"
              >
                Exportar planificación · Próximamente
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4]">
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
              ) : (
                <Cloud className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">Guardado en nube</h2>
              <p
                className={cn(
                  'mt-1 text-xs font-semibold',
                  status.tone === 'ok' && 'text-emerald-700',
                  status.tone === 'saving' && 'text-[#2563eb]',
                  status.tone === 'warn' && 'text-amber-700',
                )}
              >
                {status.label}
              </p>
              {cloudSaveMessage ? (
                <p className="mt-1 text-[11px] text-[#64748b]">{cloudSaveMessage}</p>
              ) : null}
              <button
                type="button"
                onClick={onSaveCloud}
                disabled={!canvasHydrated || saving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Guardar en la nube
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
