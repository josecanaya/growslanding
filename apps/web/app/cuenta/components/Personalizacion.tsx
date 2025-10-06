"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function Personalizacion() {
  const [darkMode, setDarkMode] = useState(false)
  const [color, setColor] = useState("azul")
  const [idioma, setIdioma] = useState("es")
  const [notificaciones, setNotificaciones] = useState(true)

  const { toast } = useToast()

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
    
    toast({
      title: "Preferencias guardadas",
      description: "Tus cambios se aplicaron correctamente.",
    })
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">🎨 Personalización</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex justify-between items-center">
          <span>Modo oscuro</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </div>

        <div className="flex justify-between items-center">
          <span>Color principal</span>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Elegir color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="azul">Azul</SelectItem>
              <SelectItem value="verde">Verde</SelectItem>
              <SelectItem value="gris">Gris</SelectItem>
              <SelectItem value="naranja">Naranja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <span>Idioma</span>
          <Select value={idioma} onValueChange={setIdioma}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Seleccionar idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">Inglés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <span>Notificaciones</span>
          <Switch checked={notificaciones} onCheckedChange={setNotificaciones} />
        </div>
      </div>
      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
        Guardar cambios
      </Button>
    </Card>
  )
}