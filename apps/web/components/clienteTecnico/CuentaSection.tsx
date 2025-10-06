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
    estudio: "",
    cuit: "",
    matricula: "",
    correo: "",
    telefono: "",
    ciudad: "",
    provincia: "",
    especialidad: "",
    sitioWeb: "",
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
    <div className="transform transition-all duration-300 hover:scale-[1.01]">
      <Card className="bg-[#ffffff] dark:bg-[#1c1a2b] border border-[#e3dff2] dark:border-[#2a263a] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#ede9fb] dark:bg-[#2d2850] rounded-xl">
            <svg className="w-6 h-6 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">Datos Profesionales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input 
            name="nombre" 
            value={form.nombre} 
            onChange={handleChange} 
            placeholder="Nombre" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="apellido" 
            value={form.apellido} 
            onChange={handleChange} 
            placeholder="Apellido" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="estudio" 
            value={form.estudio} 
            onChange={handleChange} 
            placeholder="Nombre del Estudio / Empresa" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="cuit" 
            value={form.cuit} 
            onChange={handleChange} 
            placeholder="CUIT" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="matricula" 
            value={form.matricula} 
            onChange={handleChange} 
            placeholder="Matrícula Profesional" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="correo" 
            value={form.correo} 
            onChange={handleChange} 
            placeholder="Correo Electrónico" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="telefono" 
            value={form.telefono} 
            onChange={handleChange} 
            placeholder="Teléfono" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="ciudad" 
            value={form.ciudad} 
            onChange={handleChange} 
            placeholder="Ciudad" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="provincia" 
            value={form.provincia} 
            onChange={handleChange} 
            placeholder="Provincia" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="especialidad" 
            value={form.especialidad} 
            onChange={handleChange} 
            placeholder="Especialidad (Obra, Diseño, Dirección técnica...)" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
          <Input 
            name="sitioWeb" 
            value={form.sitioWeb} 
            onChange={handleChange} 
            placeholder="Sitio Web / Portfolio" 
            className="bg-[#f7f6fb] dark:bg-[#2a263a] border border-[#e3dff2] dark:border-[#2a263a] text-[#1d1b29] dark:text-[#f5f3fc] placeholder:text-[#8a83a7] dark:placeholder:text-[#847aaf] focus:ring-2 focus:ring-[#6d4be8] focus:border-[#6d4be8] rounded-lg" 
          />
        </div>

        <div className="text-right mt-8">
          <Button 
            onClick={handleSave} 
            className="bg-[#6d4be8] hover:bg-[#5a3fd2] text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-all hover:scale-105"
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
  const [idioma, setIdioma] = useState("es")
  const [notificaciones, setNotificaciones] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("preferencias")
    if (stored) {
      const prefs = JSON.parse(stored)
      setIdioma(prefs.idioma || "es")
      setNotificaciones(prefs.notificaciones !== false)
    }
  }, [])

  const handleSave = () => {
    const prefs = { idioma, notificaciones }
    localStorage.setItem("preferencias", JSON.stringify(prefs))
    alert("Preferencias guardadas correctamente!")
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.01]">
      <Card className="bg-[#ffffff] dark:bg-[#1c1a2b] border border-[#e3dff2] dark:border-[#2a263a] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#ede9fb] dark:bg-[#2d2850] rounded-xl">
            <svg className="w-6 h-6 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">Personalización</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex justify-between items-center">
            <span className="text-[#5b5570] dark:text-[#c2bddb]">Idioma</span>
            <SimpleSelect value={idioma} onValueChange={setIdioma}>
              <SimpleSelectItem value="es" onSelect={setIdioma}>Español</SimpleSelectItem>
              <SimpleSelectItem value="en" onSelect={setIdioma}>Inglés</SimpleSelectItem>
            </SimpleSelect>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#5b5570] dark:text-[#c2bddb]">Notificaciones</span>
            <SimpleSwitch checked={notificaciones} onCheckedChange={setNotificaciones} />
          </div>
        </div>

        <div className="text-right mt-8">
          <Button 
            onClick={handleSave} 
            className="bg-[#6d4be8] hover:bg-[#5a3fd2] text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-all hover:scale-105"
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
      <Card className="bg-[#ffffff] dark:bg-[#1c1a2b] border border-[#e3dff2] dark:border-[#2a263a] rounded-2xl p-10 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-[#ede9fb] dark:bg-[#2d2850] rounded-xl">
            <svg className="w-6 h-6 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">Suscripción</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {planes.map((plan) => (
            <div 
              key={plan.nombre} 
              className="border border-[#e3dff2] dark:border-[#2a263a] rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-105 bg-[#f7f6fb] dark:bg-[#2a263a]"
            >
              <h3 className="text-lg font-semibold mb-1 text-[#1d1b29] dark:text-[#f5f3fc]">{plan.nombre}</h3>
              <p className="text-[#6d4be8] font-bold text-xl mb-2">{plan.precio}</p>
              <p className="text-[#5b5570] dark:text-[#c2bddb] text-sm mb-4">{plan.desc}</p>
              <ul className="text-sm text-[#5b5570] dark:text-[#c2bddb] space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleChangePlan(plan.nombre)} 
                className="w-full bg-[#6d4be8] hover:bg-[#5a3fd2] text-white transition-all hover:scale-105"
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

export function CuentaSection() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-[#f7f6fb] dark:bg-[#151323] rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#ffffff] dark:bg-[#1c1a2b] px-8 py-6 border-b border-[#e3dff2] dark:border-[#2a263a]">
          <h2 className="text-2xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">Configuración de Cuenta</h2>
          <p className="text-sm text-[#5b5570] dark:text-[#c2bddb]">Gestioná tu perfil profesional, preferencias y suscripción</p>
          <div className="w-20 h-[3px] bg-[#6d4be8] mt-3 rounded-full" />
        </div>
        <div className="p-8 space-y-10">
          <PerfilUsuario />
          <Personalizacion />
          <Suscripcion />
        </div>
      </div>
    </div>
  );
}
