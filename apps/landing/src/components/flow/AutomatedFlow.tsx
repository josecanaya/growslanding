'use client';

import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Layers, 
  Network, 
  Users, 
  Camera, 
  ClipboardCheck, 
  CreditCard,
  BarChart3,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';

const steps = [
  { id: 1, title: "Creación de Obra", desc: "El cliente técnico crea una obra con sus datos y alcance.", icon: Briefcase },
  { id: 2, title: "Aplicación de Plantillas", desc: "Se aplican plantillas con tareas estandarizadas por etapa.", icon: Layers },
  { id: 3, title: "Generación de Tareas + CPM", desc: "Se calculan dependencias y se define el camino crítico.", icon: Network },
  { id: 4, title: "Asignación", desc: "Las tareas se asignan a socios constructores o cuadrillas.", icon: Users },
  { id: 5, title: "Registro en Obra", desc: "Los socios cargan avances, fotos y evidencias desde el móvil.", icon: Camera },
  { id: 6, title: "Control Técnico", desc: "El cliente técnico valida avances y aprueba hitos.", icon: ClipboardCheck },
  { id: 7, title: "Liberación de Pago", desc: "Una vez validado, se libera el pago al socio.", icon: CreditCard },
  { id: 8, title: "Analítica", desc: "Los datos de avance alimentan reportes y KPIs automáticos.", icon: BarChart3 },
  { id: 9, title: "Orquestación", desc: "GROWS coordina tareas, pagos y dependencias.", icon: Cpu },
  { id: 10, title: "Reprogramación", desc: "El sistema ajusta prioridades y comunica los cambios.", icon: RefreshCw },
];

export default function AutomatedFlow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (steps.length + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #FACC15 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-yellow-500">Flujo</span> <span className="text-gray-900">Automatizado</span>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
            Cada acción dentro de GROWS genera datos que recorren un flujo automatizado. 
            Las tareas, presupuestos y validaciones se actualizan en tiempo real y sincronizan toda la red del proyecto.
          </p>
        </motion.div>

        {/* Main flow container */}
        <div className="relative flex flex-col items-center">
          {/* Animated glow line - Desktop only */}
          <motion.div 
            className="hidden lg:block absolute top-[120px] h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent w-[80%] shadow-lg"
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            style={{
              filter: 'blur(4px)',
            }}
          />
          
          {/* Animated traveling light */}
          <motion.div
            className="hidden lg:block absolute top-[118px] h-[6px] w-[100px] bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)]"
            animate={{
              x: [0, 'calc(80vw - 400px)', 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          {/* Steps Grid - Mobile */}
          <div className="lg:hidden w-full space-y-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeIndex === i;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-gradient-to-b from-yellow-400/50 to-transparent" />
                  
                  <motion.div 
                    className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl z-10 ${
                      isActive ? 'bg-yellow-400 scale-110' : 'bg-gray-300'
                    }`}
                    animate={isActive ? {
                      scale: [1, 1.1, 1],
                      boxShadow: ['0 0 0 0px rgba(250,204,21,0.4)', '0 0 0 15px rgba(250,204,21,0)']
                    } : {}}
                    transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                  >
                    <Icon size={24} />
                  </motion.div>
                  
                  <div className="flex-1 pt-2">
                    <h4 className="font-semibold text-base text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Steps Grid - Desktop */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-8 w-full max-w-6xl">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeIndex === i;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="relative flex flex-col items-center group"
                >
                  <motion.div 
                    className={`relative flex items-center justify-center w-16 h-16 rounded-full text-white shadow-xl z-10 transition-all ${
                      isActive ? 'bg-yellow-400' : 'bg-gray-400 group-hover:bg-yellow-400'
                    }`}
                    animate={isActive ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0px rgba(250,204,21,0.4)',
                        '0 0 0 20px rgba(250,204,21,0)',
                      ]
                    } : {
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Icon size={28} />
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 rounded-full bg-yellow-400 blur-md"
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  
                  <h4 className={`font-semibold mt-4 text-sm text-center transition-colors ${
                    isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600 text-center mt-2 leading-relaxed line-clamp-2">{step.desc}</p>
                  
                  {/* Connection arrow (except last in row) */}
                  {i < 4 && (
                    <div className="absolute top-8 left-[110%] w-[calc(100%-176px)] flex items-center pointer-events-none">
                      <div className="h-[2px] bg-gradient-to-r from-yellow-400/50 to-transparent flex-1" />
                      <motion.div
                        className="w-3 h-3 border-r-[2px] border-b-[2px] border-yellow-400/50"
                        style={{ transform: 'rotate(-45deg)', marginLeft: '-4px' }}
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* GROWS Core - Energy center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 2.2 }}
            className="relative flex flex-col items-center mt-20 lg:mt-16"
          >
            <motion.div
              className="relative w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white text-xl font-bold shadow-2xl z-10"
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(250,204,21,0.4)',
                  '0 0 0 30px rgba(250,204,21,0)',
                  '0 0 0 0px rgba(250,204,21,0.4)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              GROWS Core
              <motion.div
                className="absolute inset-0 rounded-full bg-yellow-400 blur-2xl opacity-30"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
            
            <p className="text-gray-600 text-center mt-6 max-w-md text-sm leading-relaxed">
              El núcleo automatizado que analiza los datos, recalcula el camino crítico y sincroniza tareas, pagos y reportes.
            </p>

            {/* Radial glow effect */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-64 h-64 rounded-full border border-yellow-300/20"></div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
