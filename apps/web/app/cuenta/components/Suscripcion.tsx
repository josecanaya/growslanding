"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Icono de tarjeta de crédito simplificado
function CreditCardIcon() {
  return (
    <svg className="w-6 h-6 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

// Icono de edificio simplificado
function BuildingIcon() {
  return (
    <svg className="w-4 h-4 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

export default function Suscripcion() {
  const handleChangePlan = (plan: string) => {
    alert(`Plan cambiado a ${plan}`)
  }

  const planes = [
    {
      nombre: "Básico",
      precio: "$9.000 / mes",
      desc: "Para profesionales independientes.",
      features: ["1 usuario", "Hasta 5 proyectos", "Soporte por email"],
    },
    {
      nombre: "Profesional",
      precio: "$15.000 / mes",
      desc: "Para estudios pequeños o equipos de obra.",
      features: ["5 usuarios", "Proyectos ilimitados", "Reportes + Dashboard", "Soporte prioritario"],
    },
    {
      nombre: "Premium",
      precio: "$25.000 / mes",
      desc: "Para empresas o constructoras medianas.",
      features: ["Usuarios ilimitados", "Gestión financiera", "API avanzada", "Asesoramiento personalizado"],
    },
  ]

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.01]">
      <Card className="bg-white border border-[#e5e5ea] rounded-2xl p-10 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-[#f1f1f3] rounded-xl">
            <CreditCardIcon />
          </div>
          <h2 className="text-xl font-semibold">Suscripción</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {planes.map((plan) => (
            <div 
              key={plan.nombre} 
              className="border border-[#e5e5ea] rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-105"
            >
              <h3 className="text-lg font-semibold mb-1">{plan.nombre}</h3>
              <p className="text-[#6b4ce6] font-bold text-xl mb-2">{plan.precio}</p>
              <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <BuildingIcon /> {f}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleChangePlan(plan.nombre)} 
                className="w-full bg-[#6b4ce6] hover:bg-[#5638d2] text-white transition-all hover:scale-105"
              >
                Elegir plan
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}