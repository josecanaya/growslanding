"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

export default function Suscripcion() {
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