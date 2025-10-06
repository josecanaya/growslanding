"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Modal simplificado sin Radix UI
function SimpleModal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-70" onClick={onClose}></div>
      <div className="relative bg-[#141518] border border-[#2b2c32] rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

// Icono de tarjeta de crédito simplificado
function CreditCardIcon() {
  return (
    <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

export default function Suscripcion() {
  const [modalOpen, setModalOpen] = useState(false)

  const handleChangePlan = (plan: string) => {
    alert(`Plan cambiado a ${plan}`)
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="bg-[#1a1b1f]/80 border border-[#2b2c32] rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#8b5cf6]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2b2c32] rounded-xl">
            <CreditCardIcon />
          </div>
          <h2 className="text-xl font-semibold text-white">Suscripción</h2>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Plan actual: <strong className="text-[#8b5cf6]">Profesional</strong>
          </p>
          <p className="text-gray-400">
            Próxima renovación: <strong className="text-gray-200">15/12/2024</strong>
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => setModalOpen(true)} 
            className="bg-gradient-to-r from-[#8b5cf6] to-[#4f46e5] hover:opacity-90 text-white font-medium px-6 py-2 rounded-lg transition-all hover:scale-105"
          >
            Editar suscripción
          </Button>
          <button className="px-4 py-2 rounded-md border border-[#2b2c32] text-gray-300 hover:bg-[#2b2c32]/70 transition">
            Descargar facturas
          </button>
        </div>
        
        <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-white">Elige tu plan</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-400">Seleccioná el plan que mejor se adapte a vos.</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  nombre: "Básico", 
                  precio: "$9.000", 
                  desc: "Ideal para profesionales individuales.", 
                  grad: "from-[#3b82f6] to-[#60a5fa]",
                  features: ["Hasta 3 obras", "Soporte básico", "Reportes básicos"]
                },
                { 
                  nombre: "Profesional", 
                  precio: "$15.000", 
                  desc: "Para equipos y pequeñas empresas.", 
                  grad: "from-[#8b5cf6] to-[#7c3aed]",
                  features: ["Hasta 10 obras", "Soporte prioritario", "Reportes avanzados", "Integraciones"]
                },
                { 
                  nombre: "Premium", 
                  precio: "$25.000", 
                  desc: "Para constructoras grandes o desarrolladoras.", 
                  grad: "from-[#ec4899] to-[#a855f7]",
                  features: ["Obras ilimitadas", "Soporte 24/7", "Reportes personalizados", "API completa"]
                },
              ].map((plan) => (
                <div
                  key={plan.nombre}
                  className="p-6 rounded-xl border border-[#2b2c32] bg-[#1c1d22]/70 hover:border-[#8b5cf6] transition-all shadow-lg hover:scale-105"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{plan.nombre}</h3>
                  <p className={`bg-gradient-to-r ${plan.grad} text-transparent bg-clip-text font-bold text-2xl mb-1`}>
                    {plan.precio}/mes
                  </p>
                  <p className="text-gray-400 text-sm mb-4">{plan.desc}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-gray-300 text-sm flex items-center">
                        <span className="w-2 h-2 bg-[#8b5cf6] rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleChangePlan(plan.nombre)} 
                    className={`w-full bg-gradient-to-r ${plan.grad} text-white font-medium hover:opacity-90 transition-all`}
                  >
                    Elegir
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </SimpleModal>
      </Card>
    </div>
  )
}