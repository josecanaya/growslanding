'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PasoDatosBasicos from './PasoDatosBasicos';
import PasoSuperficies from './PasoSuperficies';
import PasoCargaElementos from './PasoCargaElementos';
import { useWizardStore } from './useWizardStore';

const STEPS_BASE = [
  { id: 1, title: 'Datos básicos' },
  { id: 2, title: 'Superficies y estructura' },
];

const STEP_ELEMENTOS = { id: 3, title: 'Carga de elementos' };

function WizardCrearObraLayout() {
  const [step, setStep] = useState(1);
  const reset = useWizardStore((s) => s.reset);
  const modoObra = useWizardStore((s) => s.modoObra);
  
  // Construir la lista de pasos dinámicamente según el modo
  const STEPS = useMemo(() => {
    if (modoObra === 'ESTRUCTURADA') {
      return [...STEPS_BASE, STEP_ELEMENTOS];
    }
    return STEPS_BASE;
  }, [modoObra]);

  const progress = useMemo(() => (step / STEPS.length) * 100, [step, STEPS.length]);

  // Ajustar el paso actual si se cambia el modo y estamos en un paso que ya no existe
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
    // TODO: conectar con Supabase y endpoint createObra
    reset();
    setStep(1);
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PasoDatosBasicos onNext={goNext} />;
      case 2:
        return <PasoSuperficies onPrev={goPrev} onNext={modoObra === 'ESTRUCTURADA' ? goNext : finish} />;
      case 3:
        if (modoObra === 'ESTRUCTURADA') {
          return <PasoCargaElementos onPrev={goPrev} onFinish={finish} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f7f9' }}>
      <div className="mx-auto max-w-6xl px-3 md:px-4 py-4 md:py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
          {/* Sidebar pasos (izquierda) */}
          <aside className="lg:col-span-3">
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-3 md:p-4 shadow-sm">
              <div className="mb-3 md:mb-4" data-onboarding="crear-obra" style={{ scrollMarginTop: '20px' }}>
                <h2 className="text-sm md:text-base font-semibold" style={{ color: '#003C6E' }}>
                  Crear nueva obra
                </h2>
                <p className="text-xs md:text-sm text-gray-600">Completá la información paso a paso</p>
              </div>
              <nav className="space-y-1">
                {STEPS.map((s) => {
                  const active = s.id === step;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStep(s.id)}
                      className={`flex w-full items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-left transition min-h-[44px] ${
                        active
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-md text-[10px] md:text-xs font-semibold flex-shrink-0 ${
                          active ? 'text-white' : 'text-blue-700'
                        }`}
                        style={{ backgroundColor: active ? '#0055A4' : 'transparent', border: active ? 'none' : '1px solid #C2D4E6' }}
                      >
                        {s.id}
                      </span>
                      <span className={`text-xs md:text-sm ${active ? 'font-semibold' : ''}`} style={{ color: active ? '#0055A4' : '#0f172a' }}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Progreso */}
              <div className="mt-4 md:mt-6">
                <div className="mb-1.5 md:mb-2 flex items-center justify-between text-[10px] md:text-xs text-gray-600">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 md:h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 md:h-2 rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: '#0055A4' }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido del paso (derecha) */}
          <section className="lg:col-span-9">
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-3 md:p-4 lg:p-6 shadow-md">
              <div className="mb-4 md:mb-6">
                <h1 className="text-lg md:text-xl lg:text-2xl font-semibold" style={{ color: '#003C6E' }}>
                  {STEPS.find((s) => s.id === step)?.title}
                </h1>
                <p className="text-xs md:text-sm text-gray-600">Completá los datos requeridos abajo</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default WizardCrearObraLayout;
export { WizardCrearObraLayout };
