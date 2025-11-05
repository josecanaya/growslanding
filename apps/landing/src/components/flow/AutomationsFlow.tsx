'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowDiagram from './FlowDiagram';
import FlowStepper from './FlowStepper';
import { growsFlow } from '@/data/growsFlow';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function AutomationsFlow() {
  const locale = useLocale();
  const [activeStep, setActiveStep] = useState(1);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % growsFlow.length) + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay]);

  return (
    <section className="py-24 relative bg-white">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-yellow-600">Automatización</span> Inteligente
          </h2>
        </motion.div>

        {/* Grid: Stepper + Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Stepper */}
          <div className="lg:col-span-4">
            <FlowStepper 
              activeStep={activeStep} 
              setActiveStep={setActiveStep}
              autoplay={autoplay}
              setAutoplay={setAutoplay}
            />
          </div>

          {/* Diagram */}
          <div className="lg:col-span-8">
            <FlowDiagram 
              activeStep={activeStep} 
              onStepClick={setActiveStep}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={`/${locale}/roles/arquitecto-tecnico`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
            >
              Ver roles
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>

          <Link href={`/${locale}/coming-soon`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-yellow-500 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg"
            >
              Ver precios
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

