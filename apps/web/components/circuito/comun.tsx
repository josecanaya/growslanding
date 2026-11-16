'use client';

import { useCallback, useEffect, useState } from 'react';

export const dinero = (n: number | null | undefined) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 2 }).format(Number(n ?? 0));
export const numero = (n: number | null | undefined) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(Number(n ?? 0));
export const dia = (v: string | null | undefined) => (v ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(v.slice(0, 10) + 'T12:00:00Z')) : '—');
export const panel = 'rounded-2xl border border-[#dfe6df] bg-white p-5 sm:p-6';
export const boton = 'rounded-xl bg-[#19362d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
export const botonSuave = 'rounded-xl border border-[#c9d5c7] bg-white px-4 py-2 text-sm font-semibold text-[#19362d] disabled:opacity-50';
export const campo = 'w-full rounded-lg border border-[#c9d5c7] bg-white px-3 py-2 text-sm';

/** Lectura con recarga. `error.status` permite distinguir "sin sesión" de "sin permiso". */
export function useLectura<T>(url: string | null) {
  const [estado, setEstado] = useState<{ datos: T | null; error: { status: number; mensaje: string } | null; cargando: boolean }>({ datos: null, error: null, cargando: Boolean(url) });
  const cargar = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      const cuerpo = await res.json().catch(() => null);
      if (!res.ok) setEstado({ datos: null, error: { status: res.status, mensaje: cuerpo?.error ?? 'No se pudo cargar.' }, cargando: false });
      else setEstado({ datos: cuerpo as T, error: null, cargando: false });
    } catch { setEstado({ datos: null, error: { status: 0, mensaje: 'Sin conexión. Reintentá.' }, cargando: false }); }
  }, [url]);
  useEffect(() => { void cargar(); }, [cargar]);
  return { ...estado, recargar: cargar };
}

/**
 * Ejecuta una acción del circuito. Cada intento del usuario lleva su Idempotency-Key:
 * si la red falla y se reintenta, el servidor devuelve el mismo resultado sin duplicar.
 */
export function useAccion(obraId: string, alTerminar: () => void | Promise<void>) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const ejecutar = useCallback(async (accion: string, cuerpo: unknown, exito = 'Listo.') => {
    const clave = `ui:${accion}:${crypto.randomUUID()}`;
    setOcupado(accion); setAviso(null);
    try {
      let res: Response | null = null;
      for (let intento = 0; intento < 2 && !res; intento++) {
        res = await fetch(`/api/obras/${obraId}/circuito/${accion}`, { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave }, body: JSON.stringify(cuerpo) }).catch(() => null);
      }
      const datos = await res?.json().catch(() => null);
      if (!res || !res.ok) { setAviso({ tipo: 'error', texto: datos?.error ?? 'No se pudo completar. Reintentá.' }); return null; }
      setAviso({ tipo: 'ok', texto: exito });
      await alTerminar();
      return datos as Record<string, any>;
    } finally { setOcupado(null); }
  }, [obraId, alTerminar]);
  return { ejecutar, ocupado, aviso, setAviso };
}

export async function subirEvidencia(obraId: string, entidad: 'avance' | 'certificado', entidadId: string, archivo: File) {
  const form = new FormData();
  form.set('entidad', entidad); form.set('entidad_id', entidadId); form.set('archivo', archivo);
  const res = await fetch(`/api/obras/${obraId}/circuito/evidencias`, { method: 'POST', credentials: 'include', body: form });
  const datos = await res.json().catch(() => null);
  if (!res.ok) throw new Error(datos?.error ?? 'No se pudo subir la evidencia.');
  return datos;
}

export function Aviso({ aviso }: { aviso: { tipo: 'ok' | 'error'; texto: string } | null }) {
  if (!aviso) return null;
  return <p role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${aviso.tipo === 'error' ? 'bg-red-50 text-red-800' : 'bg-[#e9f0e6] text-[#19362d]'}`}>{aviso.texto}</p>;
}
export function Estado({ valor }: { valor: string }) {
  const tono = /aprob|exitos|acept|vigente|adjudicada|publicada|pagad|cumplida|normal|asignada|integrada|ejecutada/.test(valor) ? 'bg-[#e1efe0] text-[#1f5137]'
    : /rechaz|fallid|observ|cierre|cerrada$|cancel|desactual|rescind|devuelta/.test(valor) ? 'bg-red-50 text-red-800' : 'bg-[#fff4d6] text-[#6b5200]';
  return <span data-estado={valor} className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tono}`}>{valor.replace(/_/g, ' ')}</span>;
}
export function Barra({ etiqueta, pct, nota }: { etiqueta: string; pct: number; nota?: string }) {
  return <div><div className="flex justify-between text-sm"><span>{etiqueta}</span><strong>{numero(pct)}%</strong></div>
    <progress value={pct} max={100} aria-label={etiqueta} className="h-2 w-full accent-[#38826b]" />{nota && <p className="text-xs text-[#718274]">{nota}</p>}</div>;
}
export function SinAcceso({ error, volver }: { error: { status: number; mensaje: string }; volver: string }) {
  return <section role="alert" className={panel}>
    <h2 className="text-lg font-semibold">{error.status === 401 ? 'Iniciá sesión para continuar' : error.status === 403 ? 'No tenés acceso a esta información' : 'No pudimos cargar la información'}</h2>
    <p className="mt-2 text-sm text-[#53695d]">{error.mensaje}</p>
    {error.status === 401 && <a className={`${boton} mt-4 inline-block`} href={`/auth/login?redirect=${encodeURIComponent(volver)}`}>Ingresar</a>}
  </section>;
}
