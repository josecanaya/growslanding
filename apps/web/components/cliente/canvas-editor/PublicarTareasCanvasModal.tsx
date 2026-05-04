'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, ModalBase } from '@/components/ui/grows';

type Preview = {
  taskNodesDetected: number;
  alreadyPublished: number;
  newEstimated: number;
  precedenceEdgesDetected: number;
};

type PublishResult = {
  createdTasks: number;
  updatedTasks: number;
  skippedNodes: number;
  createdPrecedences: number;
  skippedEdges: number;
  warnings: string[];
};

type Props = {
  open: boolean;
  obraId: string;
  onClose: () => void;
  onAfterPublish?: () => void;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryablePublicarTareasResponse(res: Response, pub: Record<string, unknown>): boolean {
  const errStr = typeof pub.error === 'string' ? pub.error.toLowerCase() : '';
  return (
    pub.retryable === true ||
    res.status === 503 ||
    res.status === 502 ||
    res.status === 504 ||
    (res.status >= 500 &&
      (errStr.includes('fetch failed') ||
        errStr.includes('failed to fetch') ||
        errStr.includes('econnreset') ||
        errStr.includes('network')))
  );
}

/** En el navegador `Response` no admite status 0; usamos 503 como marcador de “sin respuesta HTTP válida”. */
const PLACEHOLDER_RESPONSE = () => new Response(null, { status: 503 });

async function fetchPublicarTareasGetWithRetry(
  obraId: string,
  maxAttempts = 4,
): Promise<{ res: Response; json: Record<string, unknown> }> {
  let lastRes = PLACEHOLDER_RESPONSE();
  let lastJson: Record<string, unknown> = {};
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas/publicar-tareas`, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      lastRes = res;
      lastJson = json;
      if (res.ok && json.ok === true) {
        return { res, json };
      }
      if (!isRetryablePublicarTareasResponse(res, json) || attempt === maxAttempts - 1) {
        return { res, json };
      }
    } catch {
      if (attempt === maxAttempts - 1) {
        return {
          res: lastRes,
          json: {
            ok: false,
            error:
              'No pudimos conectar con el servidor. Revisá tu conexión, esperá unos segundos y volvé a abrir el modal.',
          },
        };
      }
    }
    await sleep(450 * Math.pow(2, attempt));
  }
  return { res: lastRes, json: lastJson };
}

async function fetchPublicarTareasPostWithRetry(
  obraId: string,
  maxAttempts = 4,
): Promise<{ res: Response; json: Record<string, unknown> }> {
  let lastRes = PLACEHOLDER_RESPONSE();
  let lastJson: Record<string, unknown> = {};
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas/publicar-tareas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      lastRes = res;
      lastJson = json;
      if (res.ok && json.ok === true) {
        return { res, json };
      }
      if (!isRetryablePublicarTareasResponse(res, json) || attempt === maxAttempts - 1) {
        return { res, json };
      }
    } catch {
      if (attempt === maxAttempts - 1) {
        return {
          res: lastRes,
          json: {
            ok: false,
            error:
              'Fallo de red al publicar. Revisá tu conexión y probá de nuevo; si el canvas ya guardó, podés reintentar solo la publicación desde aquí.',
          },
        };
      }
    }
    await sleep(450 * Math.pow(2, attempt));
  }
  return { res: lastRes, json: lastJson };
}

export function PublicarTareasCanvasModal({ open, obraId, onClose, onAfterPublish }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setPreviewError(null);
    setLoadingPreview(false);
    setPublishing(false);
    setDone(false);
    setResult(null);
    setPublishError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    let cancelled = false;
    setPreview(null);
    setPreviewError(null);
    setDone(false);
    setResult(null);
    setPublishError(null);
    setLoadingPreview(true);


    void (async () => {
      try {
        const { res, json } = await fetchPublicarTareasGetWithRetry(obraId);
        if (cancelled) {
          return;
        }
        if (!res.ok || !json.ok) {
          setPreviewError(typeof json.error === 'string' ? json.error : 'No se pudo cargar la vista previa.');
          return;
        }
        setPreview(json.preview as Preview);
      } catch {
        if (!cancelled) {
          setPreviewError('Error de red al cargar la vista previa.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, obraId]);

  const onConfirmPublish = async () => {
    setPublishError(null);
    setPublishing(true);
    try {
      const { res, json } = await fetchPublicarTareasPostWithRetry(obraId);
      if (!res.ok || json.ok !== true) {
        setPublishError(typeof json.error === 'string' ? json.error : 'No se pudo publicar.');
        return;
      }
      setResult({
        createdTasks: Number(json.createdTasks) || 0,
        updatedTasks: Number(json.updatedTasks) || 0,
        skippedNodes: Number(json.skippedNodes) || 0,
        createdPrecedences: Number(json.createdPrecedences) || 0,
        skippedEdges: Number(json.skippedEdges) || 0,
        warnings: Array.isArray(json.warnings) ? json.warnings : [],
      });
      setDone(true);
      onAfterPublish?.();
    } catch {
      setPublishError('Error de red al publicar.');
    } finally {
      setPublishing(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <ModalBase
      title={done ? 'Publicación completada' : 'Publicar tareas operativas'}
      onClose={onClose}
      size="lg"
      className="!max-w-lg"
      footer={
        done ? (
          <Button type="button" variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={publishing}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={publishing || loadingPreview || Boolean(previewError) || !preview}
              onClick={() => void onConfirmPublish()}
            >
              {publishing ? 'Publicando…' : 'Publicar tareas'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4 text-sm text-grows-text-primary">
        {!done ? (
          <>
            <p className="leading-relaxed text-grows-text-secondary">
              Se van a crear tareas reales a partir de los nodos tipo tarea del canvas. Las fases, pisos,
              sectores y ambientes no se publican como tareas.
            </p>

            {previewError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900">
                {previewError}
              </div>
            ) : null}

            {loadingPreview ? (
              <p className="text-grows-text-secondary">Cargando vista previa…</p>
            ) : preview ? (
              <ul className="grid gap-2 rounded-xl border border-grows-border bg-white/80 p-3 text-[13px] leading-relaxed">
                <li>
                  <strong>Tareas detectadas:</strong> {preview.taskNodesDetected}
                </li>
                <li>
                  <strong>Tareas ya publicadas:</strong> {preview.alreadyPublished}
                </li>
                <li>
                  <strong>Tareas nuevas estimadas:</strong> {preview.newEstimated}
                </li>
                <li>
                  <strong>Precedencias detectadas:</strong> {preview.precedenceEdgesDetected}
                </li>
              </ul>
            ) : null}

            {publishError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900">
                {publishError}
              </div>
            ) : null}
          </>
        ) : result ? (
          <>
            <ul className="grid gap-2 rounded-xl border border-grows-border bg-white/80 p-3 text-[13px] leading-relaxed">
              <li>
                <strong>Tareas creadas:</strong> {result.createdTasks}
              </li>
              <li>
                <strong>Tareas actualizadas:</strong> {result.updatedTasks}
              </li>
              <li>
                <strong>Precedencias creadas:</strong> {result.createdPrecedences}
              </li>
              <li>
                <strong>Precedencias / nodos omitidos (detalle):</strong> nodos {result.skippedNodes},
                aristas {result.skippedEdges}
              </li>
            </ul>
            {result.warnings.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider">Advertencias</p>
                <ul className="list-inside list-disc space-y-1 text-[13px]">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </ModalBase>
  );
}
