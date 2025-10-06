'use client';

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

// Modal simplificado sin Radix UI
function SimpleModal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg p-6 max-w-xl w-full mx-4">
        {children}
      </div>
    </div>
  )
}

// Tabs simplificados sin Radix UI
function SimpleTabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <div>
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("planes")}
          className={`px-4 py-2 ${activeTab === "planes" ? "border-b-2 border-blue-500" : ""}`}
        >
          Planes
        </button>
        <button
          onClick={() => setActiveTab("metodo")}
          className={`px-4 py-2 ${activeTab === "metodo" ? "border-b-2 border-blue-500" : ""}`}
        >
          Método de pago
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`px-4 py-2 ${activeTab === "historial" ? "border-b-2 border-blue-500" : ""}`}
        >
          Historial
        </button>
      </div>
      <div className="mt-4">
        {activeTab === "planes" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Plan actual: <strong>Profesional</strong></p>
            <div className="flex gap-3">
              <Button onClick={() => alert("Plan cambiado a Básico")}>Básico</Button>
              <Button onClick={() => alert("Plan cambiado a Profesional")}>Profesional</Button>
              <Button onClick={() => alert("Plan cambiado a Premium")}>Premium</Button>
            </div>
          </div>
        )}
        {activeTab === "metodo" && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Actualizar método de pago</p>
            <input className="border p-2 w-full rounded-md" placeholder="Número de tarjeta (mock)" />
            <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white">Guardar</Button>
          </div>
        )}
        {activeTab === "historial" && (
          <div>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2">Fecha</th>
                  <th className="border border-gray-300 px-4 py-2">Monto</th>
                  <th className="border border-gray-300 px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">15/09/2024</td>
                  <td className="border border-gray-300 px-4 py-2">$15.000</td>
                  <td className="border border-gray-300 px-4 py-2">Pagado</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">15/10/2024</td>
                  <td className="border border-gray-300 px-4 py-2">$15.000</td>
                  <td className="border border-gray-300 px-4 py-2">Pagado</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente PerfilUsuario
function PerfilUsuario() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    especialidad: "",
  })

  useEffect(() => {
    const saved = localStorage.getItem("perfilUsuario")
    if (saved) setForm(JSON.parse(saved))
  }, [])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    localStorage.setItem("perfilUsuario", JSON.stringify(form))
    alert("Perfil actualizado correctamente!")
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">👤 Datos personales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
        <Input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" />
        <Input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo electrónico" />
        <Input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
        <Input name="especialidad" value={form.especialidad} onChange={handleChange} placeholder="Especialidad / Rol" />
      </div>
      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
        Guardar cambios
      </Button>
    </Card>
  )
}

// Componente Personalizacion
function Personalizacion() {
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

// Componente Suscripcion
function Suscripcion() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">💳 Suscripción</h2>
      <p>Plan actual: <strong>Profesional</strong></p>
      <p>Próxima renovación: <strong>15/12/2024</strong></p>
      <div className="flex gap-3">
        <Button onClick={() => setModalOpen(true)}>Editar suscripción</Button>
        <button className="px-4 py-2 rounded-md border text-sm hover:bg-gray-100">
          Descargar facturas
        </button>
      </div>
      
      <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestión de suscripción</h3>
            <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">Configurá tu plan, método de pago o historial.</p>
          <SimpleTabs defaultValue="planes">
            {/* Contenido de tabs */}
          </SimpleTabs>
        </div>
      </SimpleModal>
    </Card>
  )
}

export function CuentaSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <h2 className="text-xl font-semibold text-primario">Cuenta</h2>
          <p className="text-sm text-primario/70">Configuración de perfil y cuenta</p>
        </div>
        <div className="p-8 space-y-6">
          <PerfilUsuario />
          <Personalizacion />
          <Suscripcion />
        </div>
      </div>
    </div>
  );
}
