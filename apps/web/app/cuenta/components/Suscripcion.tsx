"use client"
import { Card } from "@/components/ui/card"
import ModalSuscripcion from "./ModalSuscripcion"

export default function Suscripcion() {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">💳 Suscripción</h2>
      <p>Plan actual: <strong>Profesional</strong></p>
      <p>Próxima renovación: <strong>15/12/2024</strong></p>
      <div className="flex gap-3">
        <ModalSuscripcion />
        <button className="px-4 py-2 rounded-md border text-sm hover:bg-gray-100">
          Descargar facturas
        </button>
      </div>
    </Card>
  )
}