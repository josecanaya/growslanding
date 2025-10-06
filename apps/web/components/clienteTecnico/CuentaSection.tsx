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
    <div className="transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="bg-[#1a1b1f]/80 border border-[#2b2c32] rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#8b5cf6]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2b2c32] rounded-xl">
            <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Datos personales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input 
            name="nombre" 
            value={form.nombre} 
            onChange={handleChange} 
            placeholder="Nombre" 
            className="bg-[#2b2c32] border-none text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-[#8b5cf6] rounded-lg" 
          />
          <Input 
            name="apellido" 
            value={form.apellido} 
            onChange={handleChange} 
            placeholder="Apellido" 
            className="bg-[#2b2c32] border-none text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-[#8b5cf6] rounded-lg" 
          />
          <Input 
            name="correo" 
            value={form.correo} 
            onChange={handleChange} 
            placeholder="Correo electrónico" 
            className="bg-[#2b2c32] border-none text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-[#8b5cf6] rounded-lg" 
          />
          <Input 
            name="telefono" 
            value={form.telefono} 
            onChange={handleChange} 
            placeholder="Teléfono" 
            className="bg-[#2b2c32] border-none text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-[#8b5cf6] rounded-lg" 
          />
          <Input 
            name="especialidad" 
            value={form.especialidad} 
            onChange={handleChange} 
            placeholder="Especialidad / Rol" 
            className="bg-[#2b2c32] border-none text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-[#8b5cf6] rounded-lg md:col-span-2" 
          />
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
    <div className="transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="bg-[#1a1b1f]/80 border border-[#2b2c32] rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#8b5cf6]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2b2c32] rounded-xl">
            <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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

// Componente Suscripcion
function Suscripcion() {
  const [modalOpen, setModalOpen] = useState(false)

  const handleChangePlan = (plan: string) => {
    alert(`Plan cambiado a ${plan}`)
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="bg-[#1a1b1f]/80 border border-[#2b2c32] rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#8b5cf6]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2b2c32] rounded-xl">
            <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
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

export function CuentaSection() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-[#0b0b0d] via-[#0f1014] to-[#16171c] rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#1a1b1f]/80 px-8 py-6 border-b border-[#2b2c32]">
          <h2 className="text-2xl font-semibold text-white">Configuración de Cuenta</h2>
          <p className="text-sm text-gray-400">Gestioná tu perfil, preferencias y suscripción</p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#8b5cf6] to-[#4f46e5] mt-4 rounded-full" />
        </div>
        <div className="p-8 space-y-8">
          <PerfilUsuario />
          <Personalizacion />
          <Suscripcion />
        </div>
      </div>
    </div>
  );
}
