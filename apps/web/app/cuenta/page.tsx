"use client"

import { useState, useEffect } from "react"
import PerfilUsuario from "./components/PerfilUsuario"
import Personalizacion from "./components/Personalizacion"
import Suscripcion from "./components/Suscripcion"

// Iconos simplificados
function SunIcon() {
  return (
    <svg className="w-5 h-5 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

export default function CuentaPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Cargar tema guardado
    const saved = localStorage.getItem('theme')
    if (saved) {
      setTheme(saved as 'light' | 'dark')
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    // Aplicar tema al documento
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#f7f6fb] dark:bg-[#151323] p-10">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-semibold mb-2 text-[#1d1b29] dark:text-[#f5f3fc]">
              Configuración de Cuenta
            </h1>
            <p className="text-[#5b5570] dark:text-[#c2bddb]">
              Gestioná tu perfil profesional, preferencias y suscripción
            </p>
            <div className="w-20 h-[3px] bg-[#6d4be8] mt-3 rounded-full" />
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-full border border-[#e3dff2] dark:border-[#2a263a] hover:bg-[#ede9fb] dark:hover:bg-[#2d2850] transition"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
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