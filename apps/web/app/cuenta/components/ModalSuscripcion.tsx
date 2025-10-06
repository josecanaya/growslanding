"use client"
import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

export default function ModalSuscripcion() {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState("Profesional")

  const { toast } = useToast()

  const handleChangePlan = (nuevo: string) => {
    setPlan(nuevo)
    toast({
      title: "Plan actualizado",
      description: `Cambiaste tu plan a ${nuevo}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Editar suscripción</Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gestión de suscripción</DialogTitle>
          <DialogDescription>Configurá tu plan, método de pago o historial.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="planes" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="planes">Planes</TabsTrigger>
            <TabsTrigger value="metodo">Método de pago</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="planes" className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">Plan actual: <strong>{plan}</strong></p>
            <div className="flex gap-3">
              <Button onClick={() => handleChangePlan("Básico")}>Básico</Button>
              <Button onClick={() => handleChangePlan("Profesional")}>Profesional</Button>
              <Button onClick={() => handleChangePlan("Premium")}>Premium</Button>
            </div>
          </TabsContent>

          <TabsContent value="metodo" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Actualizar método de pago</p>
            <input className="border p-2 w-full rounded-md" placeholder="Número de tarjeta (mock)" />
            <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white">Guardar</Button>
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>15/09/2024</TableCell>
                  <TableCell>$15.000</TableCell>
                  <TableCell>Pagado</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>15/10/2024</TableCell>
                  <TableCell>$15.000</TableCell>
                  <TableCell>Pagado</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
