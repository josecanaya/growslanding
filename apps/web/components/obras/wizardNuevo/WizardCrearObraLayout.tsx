'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PasoDatosBasicos from './PasoDatosBasicos';
import PasoSuperficies from './PasoSuperficies';
import PasoCargaElementos from './PasoCargaElementos';
import { useWizardStore } from './useWizardStore';

const STEPS = [
  { id: 1, title: 'Datos básicos' },
  { id: 2, title: 'Superficies y estructura' },
  { id: 3, title: 'Carga de elementos' },
];

function WizardCrearObraLayout() {
  const [step, setStep] = useState(1);
  const reset = useWizardStore((s) => s.reset);

  const progress = useMemo(() => (step / STEPS.length) * 100, [step]);

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
        return <PasoSuperficies onPrev={goPrev} onNext={goNext} />;
      case 3:
        return <PasoCargaElementos onPrev={goPrev} onFinish={finish} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f7f9' }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Sidebar pasos (izquierda) */}
          <aside className="md:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4" data-onboarding="crear-obra" style={{ scrollMarginTop: '20px' }}>
                <h2 className="text-base font-semibold" style={{ color: '#003C6E' }}>
                  Crear nueva obra
                </h2>
                <p className="text-sm text-gray-600">Completá la información paso a paso</p>
              </div>
              <nav className="space-y-1">
                {STEPS.map((s) => {
                  const active = s.id === step;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStep(s.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                        active
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                          active ? 'text-white' : 'text-blue-700'
                        }`}
                        style={{ backgroundColor: active ? '#0055A4' : 'transparent', border: active ? 'none' : '1px solid #C2D4E6' }}
                      >
                        {s.id}
                      </span>
                      <span className={`text-sm ${active ? 'font-semibold' : ''}`} style={{ color: active ? '#0055A4' : '#0f172a' }}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Progreso */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: '#0055A4' }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido del paso (derecha) */}
          <section className="md:col-span-9">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold" style={{ color: '#003C6E' }}>
                  {STEPS.find((s) => s.id === step)?.title}
                </h1>
                <p className="text-sm text-gray-600">Completá los datos requeridos abajo</p>
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
