"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Icono de usuario simplificado
function UserIcon() {
  return (
    <svg className="w-6 h-6 text-[#6d4be8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <Card className="bg-[#ffffff] dark:bg-[#1c1a2b] border border-[#e3dff2] dark:border-[#2a263a] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#ede9fb] dark:bg-[#2d2850] rounded-xl">
            <UserIcon />
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