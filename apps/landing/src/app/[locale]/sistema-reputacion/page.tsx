'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/footer/Footer';
import CpmDiagram from '@/components/cpm/CpmDiagram';
import AutomatedFlow from '@/components/flow/AutomatedFlow';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

function TaskCard({ title, assignee, duration, status, statusColor, delay, borderColor = 'yellow' }: {
  title: string;
  assignee: string;
  duration: string;
  status: string;
  statusColor: 'green' | 'orange' | 'orange-light';
  delay: number;
  borderColor?: 'yellow' | 'gray';
}) {
  const statusDotColor = statusColor === 'green' ? 'bg-green-500' : statusColor === 'orange' ? 'bg-orange-500' : 'bg-orange-400';
  const statusTextColor = statusColor === 'green' ? 'text-green-600' : statusColor === 'orange' ? 'text-orange-600' : 'text-orange-400';
  const border = borderColor === 'yellow' ? 'border-yellow-500' : 'border-gray-300';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className={`bg-white border-2 ${border} rounded-xl p-6 shadow-lg w-64`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-3 h-3 ${statusDotColor} rounded-full mt-1.5`}></div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
            <p className="text-xs text-gray-600 mb-2">{assignee}</p>
            <p className="text-xs text-gray-500">{duration}</p>
          </div>
        </div>
        <div className={`text-xs font-semibold ${statusTextColor} mt-2`}>{status}</div>
      </div>
    </motion.div>
  );
}

export default function SistemaPage() {
  const locale = useLocale();

  const flowNodes = [
    { name: 'Cliente Técnico', position: 'top-left' },
    { name: 'Obra', position: 'top-right' },
    { name: 'Tarea', position: 'left' },
    { name: 'Validación', position: 'right' },
    { name: 'Presupuesto', position: 'bottom-left' },
    { name: 'Notificación', position: 'bottom-right' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-24"
        style={{ 
          backgroundImage: 'url(/images/sistema.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-white/5"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700">
                GROWS
              </span>
              <span className="ml-4 text-gray-800">como Sistema de Automatización Constructiva</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Una red inteligente que sincroniza datos, tareas y decisiones.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              <span className="text-yellow-600">Flujo</span> Automatizado
            </h2>
            <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                En GROWS, cada acción de obra genera datos que recorren un flujo automatizado.
              </p>
              <p>
                Las tareas se validan en tiempo real, los presupuestos se actualizan dinámicamente y los 
                reportes se sincronizan entre todos los actores del proyecto.
              </p>
              <p>
                El sistema conecta al cliente técnico, los socios constructores y los flujos financieros 
                bajo un mismo eje de control digital.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="relative bg-gray-50 rounded-3xl p-16 border border-gray-200">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl z-10"
                >
                  <span className="text-white font-bold text-xl">GROWS·Core</span>
                </motion.div>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  {flowNodes.slice(0, 2).map((node, index) => (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      className="bg-white border-2 border-yellow-400 rounded-xl px-6 py-4 shadow-lg"
                    >
                      <span className="text-gray-900 font-semibold">{node.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  {flowNodes.slice(2, 4).map((node, index) => (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: (index + 2) * 0.2 }}
                      className="bg-white border-2 border-yellow-400 rounded-xl px-6 py-4 shadow-lg"
                    >
                      <span className="text-gray-900 font-semibold">{node.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  {flowNodes.slice(4, 6).map((node, index) => (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: (index + 4) * 0.2 }}
                      className="bg-white border-2 border-yellow-400 rounded-xl px-6 py-4 shadow-lg"
                    >
                      <span className="text-gray-900 font-semibold">{node.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CpmDiagram />

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
            
            <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                El motor de automatización de GROWS procesa cada evento dentro de un flujo n8n interno.
              </p>
              <p>
                Cada vez que una tarea cambia de estado, el sistema evalúa condiciones, ejecuta validaciones 
                y envía actualizaciones automáticas.
              </p>
              <p>
                Este procesamiento se apoya en IA contextual, que aprende patrones de planificación, tiempos 
                de respuesta y desempeño de cuadrillas.
              </p>
              <p>
                GROWS interpreta los eventos de obra y los transforma en acciones dentro del flujo
                (por ejemplo: "validar avance" o "reprogramar tarea").
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      <AutomatedFlow />

      <section className="py-24 relative bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 leading-relaxed">
              GROWS transforma la coordinación de obra en un proceso digital, trazable y autoajustable.
            </h2>
            
            <p className="text-xl text-gray-600 mb-12">
              Cada flujo de datos se convierte en una acción inteligente.
            </p>
            
            <Link href={`/${locale}/coming-soon`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-yellow-500 text-gray-900 px-10 py-5 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg"
              >
                Ver GROWS en acción
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

