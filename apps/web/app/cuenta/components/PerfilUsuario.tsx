"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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