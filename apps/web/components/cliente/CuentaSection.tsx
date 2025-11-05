'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Calendar, Save } from 'lucide-react';
import { Card, Button, SectionLayout } from '@/components/ui/grows';

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
    <Card
      title="Datos Profesionales"
      icon={<User className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Apellido</label>
          <input
            type="text"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Nombre del Estudio / Empresa</label>
          <input
            type="text"
            name="estudio"
            value={form.estudio}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">CUIT</label>
          <input
            type="text"
            name="cuit"
            value={form.cuit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Matrícula Profesional</label>
          <input
            type="text"
            name="matricula"
            value={form.matricula}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Correo Electrónico</label>
          <input
            type="email"
            name="correo"
            value={form.correo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Teléfono</label>
          <input
            type="tel"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Ciudad</label>
          <input
            type="text"
            name="ciudad"
            value={form.ciudad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Provincia</label>
          <input
            type="text"
            name="provincia"
            value={form.provincia}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Especialidad (Obra, Diseño, Dirección técnica...)</label>
          <input
            type="text"
            name="especialidad"
            value={form.especialidad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Sitio Web / Portfolio</label>
          <input
            type="url"
            name="sitioWeb"
            value={form.sitioWeb}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          variant="primary"
          icon={<Save className="h-4 w-4" />}
        >
          Guardar cambios
        </Button>
      </div>
    </Card>
  )
}

// Componente Personalizacion
function Personalizacion() {
  const [idioma, setIdioma] = useState("es")
  const [notificaciones, setNotificaciones] = useState(true)

  return (
    <Card
      title="Personalización"
      icon={<Settings className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Idioma</label>
          <select
            value={idioma}
            onChange={(e) => setIdioma(e.target.value)}
            className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-grows-primary mb-1">Notificaciones</label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setNotificaciones(!notificaciones)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificaciones ? 'bg-grows-secondary' : 'bg-grows-neutral'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-grows-surface transition-transform ${
                  notificaciones ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-grows-text-secondary">
              {notificaciones ? 'Activadas' : 'Desactivadas'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          icon={<Save className="h-4 w-4" />}
        >
          Guardar cambios
        </Button>
      </div>
    </Card>
  )
}

// Componente Suscripcion
function Suscripcion() {
  const planes = [
    {
      nombre: "Básico",
      precio: "$0",
      descripcion: "Perfecto para empezar",
      caracteristicas: ["Hasta 3 obras", "Soporte básico", "Reportes básicos"]
    },
    {
      nombre: "Profesional",
      precio: "$29/mes",
      descripcion: "Para profesionales serios",
      caracteristicas: ["Obras ilimitadas", "Soporte prioritario", "Reportes avanzados", "Integración API"]
    },
    {
      nombre: "Premium",
      precio: "$59/mes",
      descripcion: "Para equipos grandes",
      caracteristicas: ["Todo lo anterior", "Gestión de equipos", "Analytics avanzados", "Soporte 24/7"]
    }
  ]

  return (
    <Card
      title="Suscripción"
      icon={<Calendar className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planes.map((plan) => (
          <div
            key={plan.nombre}
            className={`p-6 border rounded-grows-lg ${
              plan.nombre === "Profesional" 
                ? 'border-grows-secondary bg-grows-secondary/5' 
                : 'border-grows-border bg-grows-surface'
            }`}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-grows-primary mb-2">{plan.nombre}</h3>
              <div className="text-2xl font-bold text-grows-primary mb-1">{plan.precio}</div>
              <p className="text-sm text-grows-text-secondary mb-4">{plan.descripcion}</p>
              
              <ul className="space-y-2 mb-6">
                {plan.caracteristicas.map((caracteristica, index) => (
                  <li key={index} className="text-sm text-grows-text-secondary flex items-center">
                    <span className="w-2 h-2 bg-grows-secondary rounded-full mr-2"></span>
                    {caracteristica}
                  </li>
                ))}
              </ul>
              
              <Button
                variant={plan.nombre === "Profesional" ? "primary" : "secondary"}
                className="w-full"
              >
                {plan.nombre === "Básico" ? "Plan Actual" : "Seleccionar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function CuentaSection() {
  return (
    <SectionLayout
      title="Configuración de Cuenta"
      subtitle="Gestioná tu perfil profesional, preferencias y suscripción"
    >
      <div className="space-y-8">
        <PerfilUsuario />
        <Personalizacion />
        <Suscripcion />
      </div>
    </SectionLayout>
  );
}