'use client';

import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Upload, 
  Cpu, 
  Users, 
  BarChart3,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Database,
  Network,
  TrendingUp
} from 'lucide-react';

export function HowItWorksSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  const steps = [
    {
      id: 1,
      title: "Entrada de Datos",
      description: "Los equipos reportan desde el terreno en tiempo real",
      icon: Upload,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      animation: "data-flow-up"
    },
    {
      id: 2,
      title: "Procesamiento",
      description: "IA analiza y conecta toda la información",
      icon: Cpu,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      animation: "central-processing"
    },
    {
      id: 3,
      title: "Coordinación",
      description: "Tareas se organizan automáticamente",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      animation: "task-organization"
    },
    {
      id: 4,
      title: "Visualización",
      description: "Dashboard con métricas en tiempo real",
      icon: BarChart3,
      color: "text-[#F9D65C]",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      animation: "dashboard-metrics"
    }
  ];

  // Auto-advance through steps
  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isInView, steps.length]);

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Cómo trabaja
            <br />
            <span className="text-[#052D3D]">GROWS</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Flujo de datos inteligente que conecta terreno, procesamiento y visualización en tiempo real.
          </p>
        </motion.div>

        {/* Flujo Principal */}
        <div className="relative">
          {/* Líneas de conexión animadas */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-0" />
          
          {/* Línea dorada que se dibuja */}
          <motion.div
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F9D65C] to-transparent z-10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isInView ? 1 : 0 }}
            transition={{ duration: 2, delay: 0.5 }}
          />

          {/* Grid de pasos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-20">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Tarjeta del paso */}
                <motion.div
                  className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}
                  animate={{
                    scale: currentStep === index ? 1.05 : 1,
                    y: currentStep === index ? -5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Efecto glow dorado cuando está activo */}
                  {currentStep === index && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#F9D65C]/10 via-[#F9D65C]/20 to-[#F9D65C]/10 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  {/* Contenido */}
                  <div className="relative z-10">
                    {/* Ícono animado */}
                    <motion.div
                      className={`w-16 h-16 ${step.color} mb-6 flex items-center justify-center`}
                      animate={{
                        rotate: currentStep === index ? 360 : 0,
                        scale: currentStep === index ? 1.1 : 1
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <step.icon className="w-8 h-8" />
                    </motion.div>

                    {/* Título */}
                    <h3 className={`text-xl font-bold ${step.color} mb-4`}>
                      {step.title}
                    </h3>

                    {/* Descripción */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {step.description}
                    </p>

                    {/* Indicador de paso activo */}
                    <motion.div
                      className={`w-full h-1 ${currentStep === index ? 'bg-[#F9D65C]' : 'bg-gray-200'} rounded-full`}
                      animate={{
                        scaleX: currentStep === index ? 1 : 0.3
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Animaciones específicas por paso */}
                  {currentStep === index && (
                    <>
                      {/* Flujo de datos hacia arriba */}
                      {step.id === 1 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-blue-400 rounded-full"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: -20, opacity: 1 }}
                              transition={{
                                duration: 1,
                                delay: i * 0.2,
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                              style={{
                                left: `${30 + i * 20}%`,
                                bottom: 10
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Procesamiento central */}
                      {step.id === 2 && (
                        <div className="absolute inset-0 pointer-events-none">
                          <motion.div
                            className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-purple-400 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            style={{ transform: 'translate(-50%, -50%)' }}
                          />
                        </div>
                      )}

                      {/* Organización de tareas */}
                      {step.id === 3 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-3 h-3 bg-green-400 rounded"
                              initial={{ x: Math.random() * 100, y: Math.random() * 100 }}
                              animate={{ x: 20 + i * 15, y: 20 + i * 10 }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              style={{
                                top: `${20 + i * 15}%`,
                                left: `${20 + i * 15}%`
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Métricas del dashboard */}
                      {step.id === 4 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 bg-[#F9D65C] rounded-full"
                              initial={{ height: 0 }}
                              animate={{ height: 20 + i * 10 }}
                              transition={{ duration: 0.8, delay: i * 0.2 }}
                              style={{
                                bottom: 10,
                                left: `${30 + i * 20}%`
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Flecha de conexión */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-1/2 -right-4 z-30"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  >
                    <ArrowRight className="w-6 h-6 text-[#F9D65C]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Indicador de progreso */}
        <motion.div 
          className="flex justify-center mt-16 space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {steps.map((_, index) => (
            <motion.button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                currentStep === index ? 'bg-[#F9D65C]' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentStep(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <div className="bg-[#052D3D] rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para ver GROWS en acción?
            </h3>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Descubre cómo la tecnología puede transformar tu gestión de obras
            </p>
            <motion.a
              href="#pricing"
              className="group inline-flex items-center gap-3 bg-[#F9D65C] text-[#052D3D] px-10 py-4 rounded-xl text-lg font-bold hover:bg-[#F4C430] hover:shadow-2xl transition-all duration-300 shadow-lg hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Demo
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
