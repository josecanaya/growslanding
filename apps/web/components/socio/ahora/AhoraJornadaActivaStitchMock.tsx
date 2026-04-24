'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle,
  Circle,
  ListTodo,
  Pause,
  Radio,
  Camera,
  Check,
  Home,
  ArrowLeft,
  Scissors,
  Ruler,
  Trash2,
  Sprout,
  ImageIcon,
  Send,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SlideToConfirm } from '@/components/socio/SlideToConfirm';
import { useToast } from '@/components/ui/use-toast';
import { useAhoraWorkNav } from '@/components/socio/ahora/AhoraWorkNavContext';
import { MOCK_AHORA_STITCH } from '@/lib/mocks/socioMockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/grows/Button';

const NAVY = '#00174a';

const MICRO_ICONS = [Scissors, Sprout, Ruler, Trash2] as const;

type Phase = 'running' | 'micro' | 'evidence' | 'cierre' | 'paused';

function formatHMS(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const MAX_EVIDENCE = 5;

type EvidenceSlot = { id: string; preview: string };

/**
 * Flujo mock alineado a:
 * - `ahora_responsive_jornada_activa` (en obra)
 * - `shared_responsive_confirmacion_paso_micro` (una tarea por pantalla, YA LO HICE)
 * - `evidencias_responsive_carga_foto` (galería + viewfinder)
 * - `cierre_bloque_responsive_resumen` (checklist + evidencias + ENVIAR A VALIDACIÓN)
 */
export function AhoraJornadaActivaStitchMock() {
  const { toast } = useToast();
  const router = useRouter();
  const { setHideBottomTabBar } = useAhoraWorkNav();
  const [phase, setPhase] = useState<Phase>('running');
  const [sec, setSec] = useState(MOCK_AHORA_STITCH.segundosInicio);
  const [microIndex, setMicroIndex] = useState(0);
  const [evidence, setEvidence] = useState<EvidenceSlot[]>([]);
  const [desc, setDesc] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const microTareas = MOCK_AHORA_STITCH.checklist.map((c) => c.title);
  const totalMicro = microTareas.length;
  const currentTitle = microTareas[microIndex] ?? '';
  const CurrentIcon = MICRO_ICONS[Math.min(microIndex, MICRO_ICONS.length - 1)];

  const pct = Math.min(
    100,
    Math.round(
      (MOCK_AHORA_STITCH.progresoHecho / Math.max(1, MOCK_AHORA_STITCH.progresoTotal)) * 100,
    ),
  );
  const microBarPct = totalMicro > 0 ? ((microIndex + 1) / totalMicro) * 100 : 0;

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const block = phase === 'running' || phase === 'micro' || phase === 'evidence';
    setHideBottomTabBar(block);
  }, [phase, setHideBottomTabBar]);

  useEffect(() => {
    return () => setHideBottomTabBar(false);
  }, [setHideBottomTabBar]);

  const onFinalizarSlide = useCallback(() => {
    setMicroIndex(0);
    setPhase('micro');
    toast({
      title: 'Confirmá cada tarea',
      description: 'Paso a paso. Tocá “Ya lo hice” para avanzar.',
    });
  }, [toast]);

  const onPausa = useCallback(() => {
    setPhase('paused');
    setHideBottomTabBar(false);
    toast({
      title: 'Jornada en pausa',
      description: 'Podés navegar con la barra inferior.',
    });
  }, [setHideBottomTabBar, toast]);

  const onReanudar = useCallback(() => {
    setPhase('running');
    setHideBottomTabBar(true);
  }, [setHideBottomTabBar]);

  const onMicroBack = useCallback(() => {
    if (microIndex <= 0) {
      setPhase('running');
      return;
    }
    setMicroIndex((i) => i - 1);
  }, [microIndex]);

  const onYaLoHice = useCallback(() => {
    if (microIndex < totalMicro - 1) {
      setMicroIndex((i) => i + 1);
      return;
    }
    setPhase('evidence');
    toast({ title: 'Carga de evidencias', description: 'Hasta 5 fotos (demo local).' });
  }, [microIndex, totalMicro, toast]);

  const addPhoto = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f || evidence.length >= MAX_EVIDENCE) {
        e.target.value = '';
        return;
      }
      const id = `ev-${Date.now()}`;
      setEvidence((prev) => [...prev, { id, preview: URL.createObjectURL(f) }]);
      e.target.value = '';
    },
    [evidence.length],
  );

  const removePhoto = useCallback((id: string) => {
    setEvidence((prev) => {
      const x = prev.find((p) => p.id === id);
      if (x) URL.revokeObjectURL(x.preview);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const onFinalizarEvidencia = useCallback(() => {
    if (evidence.length === 0) {
      toast({
        title: 'Agregá al menos una foto',
        description: 'Usá el botón de cámara o “Sacar foto”.',
        variant: 'destructive',
      });
      return;
    }
    setPhase('cierre');
    setHideBottomTabBar(false);
  }, [evidence.length, setHideBottomTabBar, toast]);

  const onEnviarValidacion = useCallback(() => {
    evidence.forEach((e) => URL.revokeObjectURL(e.preview));
    setEvidence([]);
    setDesc('');
    toast({ title: 'Enviado (demo)', description: 'No hay backend en modo mock.' });
    router.push('/socio');
  }, [evidence, router, toast]);

  /* ——— Pausa ——— */
  if (phase === 'paused') {
    return (
      <div
        className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-white"
        style={{ backgroundColor: NAVY }}
      >
        <Pause className="mb-4 h-14 w-14 text-blue-200" />
        <h2 className="font-stitch-headline text-2xl font-extrabold">Jornada en pausa</h2>
        <p className="mt-2 max-w-sm text-sm text-blue-200/90">La barra inferior está visible.</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Button
            type="button"
            variant="primary"
            className="w-full bg-white text-[#00174a] hover:bg-blue-100"
            onClick={onReanudar}
          >
            Reanudar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full border-white/30 bg-white/10 text-white"
            onClick={() => router.push('/socio')}
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Button>
        </div>
      </div>
    );
  }

  /* ——— Micro pasos: ref. shared_responsive_confirmacion_paso_micro ——— */
  if (phase === 'micro') {
    return (
      <div className="flex min-h-screen flex-col bg-stitch-surface font-stitch-body text-stitch-on-surface">
        <header className="fixed top-0 z-50 w-full bg-stitch-surface/90 backdrop-blur-md">
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              type="button"
              onClick={onMicroBack}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-black/5 active:scale-95"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-stitch-primary" />
            </button>
            <h1 className="font-stitch-headline text-lg font-bold tracking-tight text-stitch-primary">
              {MOCK_AHORA_STITCH.titulo}
            </h1>
          </div>
          <div className="h-1 w-full bg-stitch-surface-container">
            <div
              className="h-full bg-stitch-primary transition-all duration-500"
              style={{ width: `${microBarPct}%` }}
            />
          </div>
          <div className="px-6 py-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-stitch-secondary">
              Paso {microIndex + 1} de {totalMicro}
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-40 pt-24">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <div className="relative mb-6 aspect-square w-full max-w-[240px]">
              <div className="absolute inset-0 translate-y-4 rounded-[2.5rem] bg-stitch-primary/5 blur-xl" />
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] border border-white bg-stitch-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(22,50,116,0.12)]">
                <CurrentIcon className="h-[80px] w-[80px] text-stitch-primary" strokeWidth={1.25} />
                <div className="mt-6 flex gap-1.5">
                  {microTareas.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-2 w-2 rounded-full',
                        i < microIndex
                          ? 'bg-emerald-500'
                          : i === microIndex
                            ? 'bg-stitch-primary'
                            : 'bg-stitch-primary/20',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <h2 className="font-stitch-headline text-3xl font-extrabold tracking-tight text-stitch-on-surface">
              {currentTitle}
            </h2>
            <p className="text-sm font-medium text-stitch-on-surface/80">Confirmá para continuar</p>
          </div>
        </main>

        <section className="fixed bottom-0 left-0 w-full border-t border-stitch-outline-variant/20 bg-stitch-surface/80 p-6 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-md flex-col gap-3">
            <button
              type="button"
              onClick={onYaLoHice}
              className="h-16 w-full rounded-xl bg-gradient-to-br from-[#163274] to-[#314a8d] font-stitch-headline text-lg font-bold uppercase tracking-wide text-stitch-on-primary shadow-[0_12px_24px_-8px_rgba(22,50,116,0.5)] transition-all duration-200 active:translate-y-px active:scale-[0.98]"
            >
              Ya lo hice
            </button>
            <button
              type="button"
              onClick={onMicroBack}
              className="rounded-lg py-3 font-medium text-stitch-secondary transition-colors hover:bg-stitch-surface-container-low"
            >
              Volver
            </button>
          </div>
        </section>
        <div
          className="fixed left-0 top-1/2 h-24 w-1 -translate-y-1/2 rounded-r-full bg-stitch-primary/40"
          aria-hidden
        />
      </div>
    );
  }

  /* ——— Evidencias: ref. evidencias_responsive_carga_foto ——— */
  if (phase === 'evidence') {
    return (
      <div className="min-h-screen bg-stitch-surface pb-32 font-stitch-body text-stitch-on-surface">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} />
        <header className="sticky top-0 z-40 w-full border-b border-stitch-surface-container bg-slate-50/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-stitch-primary" />
              <h1 className="font-stitch-headline text-lg font-black tracking-tight text-stitch-primary">
                Azul operativo
              </h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 pt-8">
          <section className="mb-8">
            <div className="rounded-xl border border-stitch-surface-container border-l-4 border-l-stitch-tertiary bg-white/85 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="mb-1 block text-[0.75rem] font-semibold uppercase tracking-wider text-stitch-primary">
                    Tarea finalizada
                  </span>
                  <h2 className="font-stitch-headline text-2xl font-bold text-stitch-on-surface">
                    {MOCK_AHORA_STITCH.titulo}
                  </h2>
                  <p className="mt-1 text-sm text-stitch-on-surface/70">Sector: perímetro — lote mock</p>
                </div>
                <span className="shrink-0 rounded-full bg-stitch-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-tighter text-white">
                  En proceso de carga
                </span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-stitch-on-surface shadow-2xl lg:aspect-[4/3]">
                {evidence[0] ? (
                  <img
                    src={evidence[0].preview}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-stitch-surface-container-high text-stitch-on-surface/40">
                    <Camera className="h-16 w-16" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-white backdrop-blur-md">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">Live view</span>
                    </div>
                  </div>
                  <div className="pointer-events-auto flex justify-center pb-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-stitch-primary to-stitch-primary-container shadow-lg transition-transform active:scale-95"
                      aria-label="Capturar"
                    >
                      <Camera className="h-9 w-9 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <label className="mb-2 block text-[0.75rem] font-bold uppercase tracking-widest text-stitch-on-surface/70">
                    Descripción opcional
                  </label>
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-xl border-none bg-stitch-surface-container-high px-4 py-3 text-stitch-on-surface outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-stitch-primary"
                    placeholder="Ej.: detalle de terminación en canteros…"
                    type="text"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-stitch-primary to-stitch-primary-container px-8 font-bold text-white shadow-lg"
                >
                  Sacar foto
                  <Camera className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-4">
              <div className="flex flex-1 flex-col rounded-3xl bg-stitch-surface-container-low p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-stitch-headline text-lg font-bold">Galería actual</h3>
                  <span className="rounded bg-stitch-primary-container px-2 py-0.5 text-xs font-black text-stitch-on-primary-container">
                    {evidence.length} / {MAX_EVIDENCE}
                  </span>
                </div>
                <div className="grid grid-cols-2 content-start gap-3">
                  {evidence.map((p) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl">
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Quitar"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    </div>
                  ))}
                  {evidence.length < MAX_EVIDENCE && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-stitch-outline-variant bg-stitch-surface-container-highest text-stitch-outline transition-colors hover:border-stitch-primary hover:text-stitch-primary"
                    >
                      <ImageIcon className="h-8 w-8" />
                    </button>
                  )}
                </div>
                <div className="mt-8 border-t border-stitch-outline-variant/30 pt-6">
                  <Button
                    type="button"
                    onClick={onFinalizarEvidencia}
                    className="w-full border-0 bg-stitch-tertiary-container py-4 font-bold text-white hover:bg-stitch-tertiary"
                  >
                    Finalizar y subir
                  </Button>
                  <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-tighter text-stitch-on-surface/60">
                    Sincronización automática (demo)
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ——— Cierre: ref. cierre_bloque_responsive_resumen ——— */
  if (phase === 'cierre') {
    return (
      <div className="min-h-screen bg-stitch-surface pb-32 font-stitch-body text-stitch-on-surface antialiased">
        <main className="mx-auto max-w-lg space-y-6 px-6 pb-8 pt-6">
          <header>
            <h2 className="font-stitch-headline text-2xl font-extrabold tracking-tight text-stitch-primary">
              Resumen de finalización
            </h2>
          </header>
          <div className="rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest p-5 shadow-sm">
            <div className="space-y-4">
              {microTareas.map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
                  <span className="text-sm font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest p-4 shadow-sm">
            <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-stitch-secondary">
              Evidencias
            </span>
            <div className="flex flex-wrap gap-2">
              {evidence.map((e) => (
                <div key={e.id} className="h-12 w-12 overflow-hidden rounded-lg">
                  <img src={e.preview} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <Button
            type="button"
            onClick={onEnviarValidacion}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-0 bg-stitch-primary py-4 font-stitch-headline text-sm font-bold uppercase tracking-widest text-white shadow-lg"
          >
            <span>Enviar a validación</span>
            <Send className="h-5 w-5" />
          </Button>
        </main>
      </div>
    );
  }

  /* ——— En obra (running) ——— */
  return (
    <div
      className="min-h-screen w-full pb-44 text-white antialiased"
      style={{ backgroundColor: NAVY }}
    >
      <header
        className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 px-5 backdrop-blur-md"
        style={{ backgroundColor: `${NAVY}cc` }}
      >
        <h1 className="font-stitch-headline text-lg font-extrabold uppercase italic tracking-tight text-white">
          {MOCK_AHORA_STITCH.marca} operativo
        </h1>
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-red-600 px-3 py-1 text-[10px] font-black tracking-widest text-white">
          <Radio className="h-2.5 w-2.5 shrink-0 fill-white" />
          LIVE
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-10 px-6 pb-6 pt-8">
        <section className="flex flex-col items-center justify-center py-4 text-center">
          <h2 className="mb-2 font-stitch-headline text-3xl font-extrabold tracking-tight sm:text-4xl">
            {MOCK_AHORA_STITCH.titulo}
          </h2>
          <span className="font-stitch-headline text-2xl font-bold tabular-nums tracking-widest text-blue-200">
            {formatHMS(sec)}
          </span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80">
            Tiempo transcurrido
          </span>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-100">Progreso</span>
            <span className="font-stitch-headline text-xl font-black">
              {MOCK_AHORA_STITCH.progresoHecho} / {MOCK_AHORA_STITCH.progresoTotal}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full border border-white/10 bg-white/10 p-1">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Checklist</h3>
          {MOCK_AHORA_STITCH.checklist.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-4 rounded-xl p-4',
                item.state === 'done' && 'border border-white/20 bg-white/10 opacity-50',
                item.state === 'active' &&
                  'high-contrast-card shadow-[0_0_30px_rgba(255,255,255,0.12)] ring-4 ring-white/20',
                item.state === 'pending' && 'bg-white',
              )}
            >
              {item.state === 'done' && <CheckCircle className="h-8 w-8 shrink-0 text-blue-400" strokeWidth={1.5} />}
              {item.state === 'active' && (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-4 p-0"
                  style={{ borderColor: NAVY }}
                >
                  <ListTodo className="h-5 w-5" style={{ color: NAVY }} />
                </div>
              )}
              {item.state === 'pending' && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-slate-300">
                  <Circle className="h-5 w-5 text-slate-300" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-left">
                <h4
                  className={cn(
                    'text-lg font-bold',
                    item.state === 'done' && 'line-through text-white',
                    item.state === 'active' && 'text-xl text-[#00174a]',
                    item.state === 'pending' && 'text-[#00174a]',
                  )}
                >
                  {item.title}
                </h4>
                {item.state === 'active' && (
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#163274' }}>
                    En curso
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ backgroundColor: NAVY }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPausa}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-transform active:scale-95"
            aria-label="Pausa"
          >
            <Pause className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <SlideToConfirm
              onConfirm={onFinalizarSlide}
              confirmLabel="Desliza para finalizar"
              variant="finish"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
