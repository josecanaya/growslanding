'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PasoDatosBasicos from './PasoDatosBasicos';
import PasoSuperficies from './PasoSuperficies';
import PasoCargaElementos from './PasoCargaElementos';
import { NuevaObraHubAside } from './NuevaObraHubAside';
import { useWizardStore } from './useWizardStore';

const STEPHUB_META = [
  { id: 1, headline: 'Datos', subtitle: 'Datos básicos del proyecto y ubicación' },
  {
    id: 2,
    headline: 'Superficie',
    subtitle: 'Superficies por planta, terreno e indicadores',
  },
  { id: 3, headline: 'Activación', subtitle: 'Revisión final y alta de obra' },
] as const;

function WizardCrearObraLayout() {
  const [step, setStep] = useState(1);
  const reset = useWizardStore((s) => s.reset);

  const STEPS = useMemo(() => [...STEPHUB_META], []);

  useEffect(() => {
    if (step > STEPS.length) {
      setStep(STEPS.length);
    }
  }, [STEPS.length, step]);

  function goNext() {
    setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function goPrev() {
    setStep((s) => Math.max(1, s - 1));
  }
  function finish() {
    reset();
    setStep(1);
  }

  const currentMeta = STEPS.find((s) => s.id === step);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PasoDatosBasicos onNext={goNext} />;
      case 2:
        return <PasoSuperficies onPrev={goPrev} onNext={goNext} />;
      case 3:
        return <PasoCargaElementos onPrev={goPrev} onFinish={finish} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6fafe] pb-28 text-[#171c1f]">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:pt-8">
        {/* Hero */}
        <header className="mb-10 text-center lg:mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#001629] sm:text-4xl">
            Nueva obra
          </h1>
          <p className="mt-2 text-base text-[#42474d] sm:text-lg">Configurá tu obra en minutos.</p>
        </header>

        {/* Stepper (hub horizontal) */}
        <div className="mb-10 flex justify-center lg:mb-14">
          <nav aria-label="Progreso del asistente" className="w-full max-w-lg sm:max-w-xl">
            <ol className="grid grid-cols-3 gap-3 px-2 sm:gap-6">
              {STEPS.map((meta) => {
                const active = step === meta.id;
                const done = step > meta.id;

                const circleClass = active
                  ? 'bg-[#002b49] text-white shadow-md shadow-black/25'
                  : done
                    ? 'bg-[#02446f] text-white'
                    : 'bg-[#e4e9ed] text-[#596574]';

                return (
                  <li key={meta.id} className="flex justify-center">
                    <button
                      type="button"
                      data-onboarding={meta.id === 1 ? 'crear-obra' : undefined}
                      onClick={() => setStep(meta.id)}
                      className="flex w-full max-w-[7.5rem] flex-col items-center gap-2 rounded-xl p-2 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#24a375] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6fafe]"
                      aria-current={active ? 'step' : undefined}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold sm:h-[2.5rem] sm:w-[2.5rem] ${circleClass}`}
                      >
                        {meta.id}
                      </span>
                      <span
                        className={`text-center text-[11px] font-semibold uppercase tracking-wide leading-tight sm:text-xs ${active ? 'text-[#001629]' : 'text-[#596574]'}`}
                      >
                        {meta.headline}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-14">
          <div className="min-w-0 space-y-4 lg:col-span-7">
            {currentMeta ? (
              <div className="mb-2 sm:mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#42474d]">
                  Paso {step} de {STEPS.length}
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[#001629] sm:text-2xl">
                  {currentMeta.subtitle}
                </h2>
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <p className="mb-4 hidden font-bold uppercase tracking-[0.2em] text-[#42474d] lg:block">
              Resumen
            </p>
            <NuevaObraHubAside />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WizardCrearObraLayout;
export { WizardCrearObraLayout };
