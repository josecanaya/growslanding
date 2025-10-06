"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Icono de usuario simplificado
function UserIcon() {
  return (
    <svg className="w-6 h-6 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export default function PerfilUsuario() {
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

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = () => {
    localStorage.setItem("perfilUsuario", JSON.stringify(form))
    alert("Perfil actualizado correctamente!")
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.01]">
      <Card className="bg-white border border-[#e5e5ea] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#f1f1f3] rounded-xl">
            <UserIcon />
          </div>
          <h2 className="text-xl font-semibold">Datos Profesionales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input 
            name="nombre" 
            value={form.nombre} 
            onChange={handleChange} 
            placeholder="Nombre" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="apellido" 
            value={form.apellido} 
            onChange={handleChange} 
            placeholder="Apellido" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="estudio" 
            value={form.estudio} 
            onChange={handleChange} 
            placeholder="Nombre del Estudio / Empresa" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="cuit" 
            value={form.cuit} 
            onChange={handleChange} 
            placeholder="CUIT" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="matricula" 
            value={form.matricula} 
            onChange={handleChange} 
            placeholder="Matrícula Profesional" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="correo" 
            value={form.correo} 
            onChange={handleChange} 
            placeholder="Correo Electrónico" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="telefono" 
            value={form.telefono} 
            onChange={handleChange} 
            placeholder="Teléfono" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="ciudad" 
            value={form.ciudad} 
            onChange={handleChange} 
            placeholder="Ciudad" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="provincia" 
            value={form.provincia} 
            onChange={handleChange} 
            placeholder="Provincia" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="especialidad" 
            value={form.especialidad} 
            onChange={handleChange} 
            placeholder="Especialidad (Obra, Diseño, Dirección técnica...)" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
          <Input 
            name="sitioWeb" 
            value={form.sitioWeb} 
            onChange={handleChange} 
            placeholder="Sitio Web / Portfolio" 
            className="border border-[#e5e5ea] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] rounded-lg" 
          />
        </div>

        <div className="text-right mt-8">
          <Button 
            onClick={handleSave} 
            className="bg-[#6b4ce6] hover:bg-[#5638d2] text-white font-medium px-6 py-2 rounded-lg transition-all hover:scale-105"
          >
            Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  )
}