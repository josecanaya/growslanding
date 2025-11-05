'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { growsFlow } from '@/data/growsFlow';
import { 
  UserCog, 
  Layers, 
  ListChecks, 
  UsersRound, 
  Camera, 
  ClipboardCheck, 
  CreditCard,
  BarChart3,
  Cpu,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCog,
  Layers,
  ListChecks,
  UsersRound,
  Camera,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Cpu,
  RefreshCw,
};

interface FlowStepperProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  autoplay: boolean;
  setAutoplay: (autoplay: boolean) => void;
}

export default function FlowStepper({ activeStep, setActiveStep, autoplay, setAutoplay }: FlowStepperProps) {
  const IconComponent = growsFlow[activeStep - 1] ? iconMap[growsFlow[activeStep - 1].icon] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Así fluye la información en GROWS</h3>
        <button
          onClick={() => setAutoplay(!autoplay)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="text-sm font-medium">{autoplay ? 'Pausar' : 'Reproducir'}</span>
        </button>
      </div>

      <div className="space-y-3">
        {growsFlow.map((step, index) => {
          const isActive = step.id === activeStep;
          const Icon = iconMap[step.icon];

          return (
            <motion.div
              key={step.id}
              className={`relative rounded-xl p-4 cursor-pointer transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-lg' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveStep(step.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-4">
                {/* Ícono */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-yellow-400' : 'bg-gray-200'
                }`}>
                  {Icon && <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-600'}`} />}
                </div>

                {/* Contenido */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">0{step.id}</span>
                    <h4 className={`font-bold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {step.title}
                    </h4>
                  </div>
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-gray-600 leading-relaxed"
                      >
                        {step.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Indicador de estado */}
                <motion.div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}
                  animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: isActive ? Infinity : 0,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

