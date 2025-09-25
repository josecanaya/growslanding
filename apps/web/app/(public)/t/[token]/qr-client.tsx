'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { canTransition, visitStatusSchema, type VisitStatus } from '@/lib/fsm';

const CHECKLIST_ITEMS = [
  'Seguridad',
  'Calidad',
  'Orden y limpieza',
];

type Resolucion = {
  tarea: {
    id: string;
    tipo: string;
    descripcion: string;
    estado: VisitStatus;
    socio_ids: string[];
    obra: { nombre: string } | null;
    eventos: Array<{
      id: string;
      nuevo_estado: VisitStatus;
      actor_name: string;
      created_at: string;
      pdf_path: string | null;
    }>;
  };
  requiresPin: boolean;
};

type Photo = {
  name: string;
  dataUrl: string;
};

type Props = {
  token: string;
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function QrClient({ token }: Props) {
  const [pin, setPin] = useState('');
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actorName, setActorName] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<VisitStatus>('en_ejecucion');
  const [notas, setNotas] = useState('');
  const [hasNc, setHasNc] = useState(false);
  const [ncResponsable, setNcResponsable] = useState('');
  const [ncDeadline, setNcDeadline] = useState('');
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const allowedTargets = useMemo(() => {
    if (!resolucion) {
      return [] as VisitStatus[];
    }
    const allStatuses = visitStatusSchema.options;
    return allStatuses.filter(
      (estado) =>
        estado !== resolucion.tarea.estado &&
        canTransition(resolucion.tarea.estado, estado)
    );
  }, [resolucion]);

  const handleResolve = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/qr/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? 'Error al resolver el QR');
      }

      const data = (await response.json()) as Resolucion;
      setResolucion(data);
      const defaultTarget = visitStatusSchema.options.find(
        (status) =>
          status !== data.tarea.estado &&
          canTransition(data.tarea.estado, status)
      );
      setNuevoEstado(defaultTarget ?? data.tarea.estado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [pin, token]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return;
    if (photos.length + files.length > 5) {
      setError('Solo se permiten de 1 a 5 fotos');
      return;
    }

    const newPhotos: Photo[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      newPhotos.push({ name: file.name, dataUrl });
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const context = canvas.getContext('2d');
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    context.strokeStyle = '#111827';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };

  const endDrawing = () => {
    drawing.current = false;
  };

  const guardarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setFirmaDataUrl(canvas.toDataURL('image/png'));
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaDataUrl(null);
  };

  async function handleTransition() {
    if (!resolucion) return;
    setLoading(true);
    setError(null);

    try {
      const checklistPayload = Object.entries(checklist).map(([label, value]) => ({
        label,
        value,
      }));

      const mediaPayload = [
        ...photos.map((photo) => ({ kind: 'foto' as const, dataUrl: photo.dataUrl })),
        ...(firmaDataUrl ? [{ kind: 'firma' as const, dataUrl: firmaDataUrl }] : []),
      ];

      const response = await fetch(
        `/api/tareas/${resolucion.tarea.id}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nuevo_estado: nuevoEstado,
            notas,
            has_nc: hasNc,
            checklist: checklistPayload,
            media: mediaPayload,
            actor: {
              name: actorName || 'Socio QR',
              role: 'Socio',
              method: 'QR',
            },
            nc_responsable: hasNc ? ncResponsable : undefined,
            nc_deadline: hasNc ? ncDeadline : undefined,
            motivo:
              resolucion.tarea.estado === 'finalizado' &&
              nuevoEstado === 'en_ejecucion'
                ? motivo || 'Rollback QR'
                : undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? 'Error al transicionar');
      }

      await handleResolve();
      setNotas('');
      setPhotos([]);
      setFirmaDataUrl(null);
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header className="rounded border border-border p-4">
        <h1 className="text-2xl font-semibold">Acceso QR</h1>
        <p className="text-sm text-muted-foreground">
          Token: <span className="font-mono">{token}</span>
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            name="pin"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN (opcional)"
            className="w-32 rounded border px-3 py-2"
          />
          <button
            type="button"
            data-testid="resolver-qr"
            className="rounded bg-primary px-4 py-2 text-white"
            onClick={handleResolve}
            disabled={loading}
          >
            Resolver QR
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </header>

      {resolucion && (
        <section className="space-y-6 rounded border border-border p-4">
          <div>
            <h2 className="text-xl font-semibold">{resolucion.tarea.tipo}</h2>
            <p className="text-sm text-muted-foreground">
              {resolucion.tarea.descripcion}
            </p>
            <p className="mt-2 text-sm">
              Estado actual: <strong>{resolucion.tarea.estado}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium">Responsable</label>
            <input
              value={actorName}
              onChange={(event) => setActorName(event.target.value)}
              placeholder="Nombre del socio"
              className="w-full rounded border px-3 py-2"
            />

            <label className="block text-sm font-medium">Nuevo estado</label>
            {allowedTargets.length > 0 ? (
              <select
                name="nuevo_estado"
                className="w-full rounded border px-3 py-2"
                value={nuevoEstado}
                onChange={(event) =>
                  setNuevoEstado(visitStatusSchema.parse(event.target.value))
                }
              >
                {allowedTargets.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay transiciones disponibles para este estado.
              </p>
            )}

            {resolucion.tarea.estado === 'finalizado' &&
              nuevoEstado === 'en_ejecucion' && (
                <div>
                  <label className="block text-sm font-medium">Motivo de rollback</label>
                  <textarea
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    className="mt-2 w-full rounded border px-3 py-2"
                  />
                </div>
              )}

            <label className="block text-sm font-medium">Notas</label>
            <textarea
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              className="w-full rounded border px-3 py-2"
              rows={3}
            />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Checklist</legend>
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="w-40 text-sm">{item}</span>
                  <select
                    className="rounded border px-3 py-1"
                    value={checklist[item] ?? 'SI'}
                    onChange={(event) =>
                      setChecklist((prev) => ({
                        ...prev,
                        [item]: event.target.value,
                      }))
                    }
                  >
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">N/A</option>
                  </select>
                </div>
              ))}
            </fieldset>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">¿Hay NC?</label>
              <input
                type="checkbox"
                checked={hasNc}
                onChange={(event) => setHasNc(event.target.checked)}
              />
            </div>

            {hasNc && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Responsable NC</label>
                  <input
                    value={ncResponsable}
                    onChange={(event) => setNcResponsable(event.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deadline NC</label>
                  <input
                    type="date"
                    value={ncDeadline}
                    onChange={(event) => setNcDeadline(event.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Fotos (máx 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-2"
                onChange={(event) => handlePhotoUpload(event.target.files)}
              />
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {photos.map((photo, index) => (
                  <li key={`${photo.name}-${index}`}>{photo.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium">Firma</label>
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="mt-2 w-full rounded border bg-white"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={endDrawing}
                onPointerLeave={endDrawing}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded bg-gray-200 px-3 py-1"
                  onClick={guardarFirma}
                >
                  Guardar firma
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-100 px-3 py-1"
                  onClick={limpiarFirma}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <button
              type="button"
              data-testid="transicionar"
              className="w-full rounded bg-primary px-4 py-2 text-white"
              disabled={loading || allowedTargets.length === 0}
              onClick={handleTransition}
            >
              Registrar evento
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
