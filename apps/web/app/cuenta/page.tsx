"use client"

import PerfilUsuario from "./components/PerfilUsuario"
import Personalizacion from "./components/Personalizacion"
import Suscripcion from "./components/Suscripcion"

export default function CuentaPage() {
  return (
    <div className="dark bg-gradient-to-br from-[#0b0b0d] via-[#0f1014] to-[#16171c] min-h-screen p-8 text-gray-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white mb-2 tracking-tight">Configuración de Cuenta</h1>
          <p className="text-gray-400">Gestioná tu perfil, preferencias y suscripción</p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#8b5cf6] to-[#4f46e5] mx-auto mt-4 rounded-full" />
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