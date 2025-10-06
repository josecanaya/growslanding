"use client"

import PerfilUsuario from "./components/PerfilUsuario"
import Personalizacion from "./components/Personalizacion"
import Suscripcion from "./components/Suscripcion"

export default function CuentaPage() {
  return (
    <div className="min-h-screen bg-[#f9f9fb] text-[#222] p-10">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-left">
          <h1 className="text-4xl font-semibold mb-2">Configuración de Cuenta</h1>
          <p className="text-gray-500">Gestioná tu perfil profesional, preferencias y suscripción</p>
          <div className="w-20 h-[3px] bg-[#6b4ce6] mt-3 rounded-full" />
        </div>

        <div className="flex flex-col gap-10">
          <PerfilUsuario />
          <Personalizacion />
          <Suscripcion />
        </div>
      </div>
    </div>
  )
}