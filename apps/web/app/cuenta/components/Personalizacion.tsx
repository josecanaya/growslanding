"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Switch simplificado sin Radix UI
function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
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
        className="flex h-10 w-[150px] items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{value}</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
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
      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
    >
      {children}
    </button>
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
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">🎨 Personalización</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex justify-between items-center">
          <span>Modo oscuro</span>
          <SimpleSwitch checked={darkMode} onCheckedChange={setDarkMode} />
        </div>

        <div className="flex justify-between items-center">
          <span>Color principal</span>
          <SimpleSelect value={color} onValueChange={setColor}>
            <SimpleSelectItem value="azul" onSelect={setColor}>Azul</SimpleSelectItem>
            <SimpleSelectItem value="verde" onSelect={setColor}>Verde</SimpleSelectItem>
            <SimpleSelectItem value="gris" onSelect={setColor}>Gris</SimpleSelectItem>
            <SimpleSelectItem value="naranja" onSelect={setColor}>Naranja</SimpleSelectItem>
          </SimpleSelect>
        </div>

        <div className="flex justify-between items-center">
          <span>Idioma</span>
          <SimpleSelect value={idioma} onValueChange={setIdioma}>
            <SimpleSelectItem value="es" onSelect={setIdioma}>Español</SimpleSelectItem>
            <SimpleSelectItem value="en" onSelect={setIdioma}>Inglés</SimpleSelectItem>
          </SimpleSelect>
        </div>

        <div className="flex justify-between items-center">
          <span>Notificaciones</span>
          <SimpleSwitch checked={notificaciones} onCheckedChange={setNotificaciones} />
        </div>
      </div>
      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
        Guardar cambios
      </Button>
    </Card>
  )
}