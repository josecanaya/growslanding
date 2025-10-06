"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Switch simplificado sin Radix UI
function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 ${
        checked ? 'bg-[#8b5cf6]' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// Select simplificado sin Radix UI
function SimpleSelect({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-[150px] items-center justify-between rounded-md border border-[#2b2c32] bg-[#2b2c32] px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
      >
        <span>{value}</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-[#2b2c32] bg-[#1f2024] shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

function SimpleSelectItem({ value, children, onSelect }: { value: string; children: React.ReactNode; onSelect: (value: string) => void }) {
  return (
    <button
      onClick={() => onSelect(value)}
      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#2b2c32] focus:bg-[#2b2c32] focus:outline-none"
    >
      {children}
    </button>
  )
}

// Icono de configuración simplificado
function SettingsIcon() {
  return (
    <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export default function Personalizacion() {
  const [darkMode, setDarkMode] = useState(false)
  const [color, setColor] = useState("azul")
  const [idioma, setIdioma] = useState("es")
  const [notificaciones, setNotificaciones] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("preferencias")
    if (stored) {
      const prefs = JSON.parse(stored)
      setDarkMode(prefs.darkMode || false)
      setColor(prefs.color || "azul")
      setIdioma(prefs.idioma || "es")
      setNotificaciones(prefs.notificaciones !== false)
    }
  }, [])

  const handleSave = () => {
    const prefs = { darkMode, color, idioma, notificaciones }
    localStorage.setItem("preferencias", JSON.stringify(prefs))
    
    // Aplicar cambios inmediatamente
    document.documentElement.classList.toggle("dark", darkMode)
    
    // Aplicar color al body
    const body = document.body
    const colorClasses = ['theme-blue', 'theme-green', 'theme-gray', 'theme-orange']
    colorClasses.forEach(cls => body.classList.remove(cls))
    
    const colorMap: { [key: string]: string } = {
      'azul': 'theme-blue',
      'verde': 'theme-green', 
      'gris': 'theme-gray',
      'naranja': 'theme-orange'
    }
    
    if (colorMap[color]) {
      body.classList.add(colorMap[color])
    }
    
    alert("Preferencias guardadas correctamente!")
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="bg-[#1a1b1f]/80 border border-[#2b2c32] rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#8b5cf6]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2b2c32] rounded-xl">
            <SettingsIcon />
          </div>
          <h2 className="text-xl font-semibold text-white">Personalización</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Modo oscuro</span>
            <SimpleSwitch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Color principal</span>
            <SimpleSelect value={color} onValueChange={setColor}>
              <SimpleSelectItem value="azul" onSelect={setColor}>Azul</SimpleSelectItem>
              <SimpleSelectItem value="verde" onSelect={setColor}>Verde</SimpleSelectItem>
              <SimpleSelectItem value="gris" onSelect={setColor}>Gris</SimpleSelectItem>
              <SimpleSelectItem value="naranja" onSelect={setColor}>Naranja</SimpleSelectItem>
            </SimpleSelect>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Idioma</span>
            <SimpleSelect value={idioma} onValueChange={setIdioma}>
              <SimpleSelectItem value="es" onSelect={setIdioma}>Español</SimpleSelectItem>
              <SimpleSelectItem value="en" onSelect={setIdioma}>Inglés</SimpleSelectItem>
            </SimpleSelect>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Notificaciones</span>
            <SimpleSwitch checked={notificaciones} onCheckedChange={setNotificaciones} />
          </div>
        </div>

        <div className="text-right mt-6">
          <Button 
            onClick={handleSave} 
            className="bg-gradient-to-r from-[#8b5cf6] to-[#4f46e5] hover:opacity-90 text-white font-medium px-6 py-2 rounded-lg transition-all hover:scale-105"
          >
            Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  )
}