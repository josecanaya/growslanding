'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import { Check, MessageCircle, Plus, ThumbsUp } from 'lucide-react';
import type { ObraComment, ObraSocial } from '@/lib/obras/social';

const loginHref = (obraId: string) => `/auth/login?redirect=${encodeURIComponent(`/inversores?obra=${obraId}`)}` as Route;
const roleLabels: Record<string, string> = { contratista: 'Contratista', profesional: 'Proyectista', inversor: 'Inversor', admin: 'GROWS' };

async function send(obraId: string, payload: object) {
  const response = await fetch(`/api/obras/${obraId}/social`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'No pudimos guardar. Probá de nuevo.');
  return data as { social: ObraSocial | null; comment: ObraComment | null };
}

function useSocial(obraId: string, initial: ObraSocial) {
  const [social, setSocial] = useState(initial);
  const [error, setError] = useState('');
  async function toggle(kind: 'follow' | 'support') {
    const on = kind === 'follow' ? social.following : social.supported;
    const optimistic = kind === 'follow'
      ? { ...social, following: !on, follows: social.follows + (on ? -1 : 1) }
      : { ...social, supported: !on, supports: social.supports + (on ? -1 : 1) };
    const previous = social;
    setSocial(optimistic);
    setError('');
    try {
      const result = await send(obraId, { action: on ? `un${kind}` : kind });
      if (result.social) setSocial(result.social);
    } catch (reason) {
      setSocial(previous);
      setError(reason instanceof Error ? reason.message : 'No pudimos guardar.');
    }
  }
  return { social, error, toggle };
}

const action = 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm text-[#3c5047] hover:bg-[#f4f5f0]';

/** Apoyar y comentar en un posteo del feed. */
export function PostActions({ obraId, title, initial, signedIn }: { obraId: string; title: string; initial: ObraSocial; signedIn: boolean }) {
  const { social, error, toggle } = useSocial(obraId, initial);
  const commentsHref = `/inversores?obra=${obraId}#comentarios` as Route;
  return (
    <>
      {signedIn ? (
        <button type="button" onClick={() => toggle('support')} aria-pressed={social.supported} className={`${action} ${social.supported ? 'font-semibold text-[#2f5a2a]' : ''}`}>
          <ThumbsUp size={19} aria-hidden="true" fill={social.supported ? 'currentColor' : 'none'} />Apoyar{social.supports ? ` · ${social.supports}` : ''}
        </button>
      ) : (
        <Link href={loginHref(obraId)} prefetch={false} className={action}><ThumbsUp size={19} aria-hidden="true" />Apoyar{social.supports ? ` · ${social.supports}` : ''}</Link>
      )}
      <Link href={commentsHref} className={action} aria-label={`Comentar en ${title}`}><MessageCircle size={19} aria-hidden="true" />Comentar{social.comments ? ` · ${social.comments}` : ''}</Link>
      {error && <p role="alert" className="sr-only">{error}</p>}
    </>
  );
}

/** Botón seguir obra, con cantidad de seguidores. */
export function FollowButton({ obraId, initial, signedIn, compact = false }: { obraId: string; initial: ObraSocial; signedIn: boolean; compact?: boolean }) {
  const { social, error, toggle } = useSocial(obraId, initial);
  const base = `inline-flex items-center gap-1.5 rounded-full font-semibold ${compact ? 'min-h-10 px-3.5 text-[13px]' : 'min-h-11 px-4 text-sm'}`;
  const style = social.following ? 'bg-[#e6eedf] text-[#2f5a2a]' : compact ? 'border border-[#1d3329] bg-white text-[#1d3329] hover:bg-[#f4f5f0]' : 'bg-[#1d3329] text-white hover:bg-[#2a4a3d]';
  const content = <>{social.following ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{social.following ? 'Siguiendo' : 'Seguir'}</>;
  return (
    <span className="inline-flex flex-col items-end">
      {signedIn
        ? <button type="button" onClick={() => toggle('follow')} aria-pressed={social.following} className={`${base} ${style}`}>{content}</button>
        : <Link href={loginHref(obraId)} prefetch={false} className={`${base} ${style}`}>{content}</Link>}
      {!compact && <span className="mt-1 text-xs text-[#5a6b61]">{social.follows} {social.follows === 1 ? 'seguidor' : 'seguidores'}</span>}
      {error && <span role="alert" className="mt-1 text-xs text-[#a32a2a]">{error}</span>}
    </span>
  );
}

function when(iso: string) {
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
    : '';
}

/** Comentarios y preguntas de la ficha de obra. */
export function Comments({ obraId, initial, signedIn }: { obraId: string; initial: ObraComment[]; signedIn: boolean }) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const result = await send(obraId, { action: 'comment', body });
      if (result.comment) setComments((list) => [...list, result.comment!]);
      setBody('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos publicar el comentario.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="comentarios" aria-labelledby="comentarios-titulo" className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#e3e8df] bg-white">
      <h2 id="comentarios-titulo" className="px-5 pt-5 text-xl font-semibold tracking-tight">Comentarios y preguntas</h2>
      {comments.length ? (
        <ul className="mt-3 space-y-3 px-5">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e6eedf] text-[13px] font-semibold" aria-hidden="true">{comment.authorName.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 rounded-2xl bg-[#f4f5f0] px-3 py-2">
                <p className="text-[13px]"><strong>{comment.authorName}</strong>{comment.authorRole && roleLabels[comment.authorRole] && <span className="text-[#5a6b61]"> · {roleLabels[comment.authorRole]}</span>} <span className="text-[#5a6b61]">· {when(comment.createdAt)}</span></p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 px-5 text-sm text-[#5a6b61]">Todavía no hay comentarios. Hacé la primera pregunta.</p>}
      <div className="mt-4 border-t border-[#eef1ea] p-4">
        {signedIn ? (
          <form onSubmit={submit} className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Escribí un comentario</span>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={1} placeholder="Preguntale algo a la obra…"
                className="block max-h-40 min-h-11 w-full resize-y rounded-2xl border border-[#dfe5da] bg-[#f4f5f0] px-4 py-2.5 text-sm outline-none focus:border-[#4f6b3f]" />
            </label>
            <button type="submit" disabled={!body.trim() || sending} className="min-h-11 rounded-full bg-[#1d3329] px-4 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Enviando…' : 'Publicar'}</button>
          </form>
        ) : (
          <Link href={loginHref(obraId)} prefetch={false} className="inline-flex min-h-11 items-center text-sm font-semibold hover:underline">Ingresá para comentar</Link>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-[#a32a2a]">{error}</p>}
      </div>
    </section>
  );
}
