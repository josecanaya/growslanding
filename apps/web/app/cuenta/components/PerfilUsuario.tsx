"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Icono de usuario simplificado
function UserIcon() {
  return (
    <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export default function PerfilUsuario() {
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

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = () => {
    localStorage.setItem("perfilUsuario", JSON.stringify(form))
    alert("Perfil actualizado correctamente!")
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-[1.02]">
      <Card className="bg-[#1a1b1f]/80 border border-[#2b2c32] rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#8b5cf6]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2b2c32] rounded-xl">
            <UserIcon />
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