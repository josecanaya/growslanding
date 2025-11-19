"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { catalogoCompletoJson } from "@/lib/catalogos/elementos";
import { cn } from "@/lib/utils";

type ElementoSupabase = {
  id: string;
  nombre: string;
  categoria: string | null;
  subcategoria: string | null;
  cantidad: number | null;
  unidad: string | null;
  descripcion: string | null;
};

type ModalEditarElementoProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  elemento: ElementoSupabase | null;
  obraId: string;
};

export default function ModalEditarElemento({
  open,
  onClose,
  onSuccess,
  elemento,
  obraId,
}: ModalEditarElementoProps) {
  const { toast } = useToast();

  // Obtener el elemento del catálogo para tener las opciones
  const elementoCatalogo = useMemo(() => {
    if (!elemento || !elemento.categoria || !elemento.subcategoria) return null;

    const categoria = catalogoCompletoJson.categorias.find(
      (cat) => cat.categoria === elemento.categoria
    );
    if (!categoria) return null;

    const subcategoria = categoria.subcategorias.find(
      (sub) => sub.nombre === elemento.subcategoria
    );
    if (!subcategoria) return null;

    const elementoEncontrado = subcategoria.elementos.find(
      (el) => el.nombre === elemento.nombre
    );
    return elementoEncontrado || null;
  }, [elemento]);

  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidad, setUnidad] = useState<string>("unidad");
  const [descripcion, setDescripcion] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar valores cuando se abre el modal o cambia el elemento
  useEffect(() => {
    if (open && elemento) {
      setCantidad(elemento.cantidad || 0);
      setUnidad(elemento.unidad || "unidad");
      setDescripcion(elemento.descripcion || "");

      // Parsear descripción para obtener valores de configuración
      const configs: Record<string, string> = {};
      if (elemento.descripcion && elementoCatalogo?.opciones) {
        // La descripción tiene formato: "key1: value1 | key2: value2"
        const partes = elemento.descripcion.split(" | ");
        partes.forEach((parte) => {
          const [key, value] = parte.split(": ");
          if (key && value) {
            const keyNormalizado = key.toLowerCase().replace(/\s+/g, "_");
            configs[keyNormalizado] = value;
          }
        });
      }
      setConfigValues(configs);
    }
  }, [open, elemento, elementoCatalogo]);

  const handleSave = async () => {
    if (!elemento) return;

    try {
      setIsSaving(true);

      // Construir descripción desde las configuraciones
      let nuevaDescripcion = "";
      if (elementoCatalogo?.opciones) {
        const partes: string[] = [];
        Object.entries(configValues).forEach(([key, value]) => {
          if (value) {
            const keyFormateado = key
              .split("_")
              .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
              .join(" ");
            partes.push(`${keyFormateado}: ${value}`);
          }
        });
        nuevaDescripcion = partes.join(" | ");
      }

      // Actualizar elemento
      const response = await fetch(`/api/obras/${obraId}/elementos/${elemento.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cantidad,
          unidad,
          descripcion: nuevaDescripcion || descripcion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar elemento");
      }

      toast({
        title: "Elemento actualizado",
        description: "Las configuraciones se guardaron correctamente",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[ModalEditarElemento] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar elemento",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!elemento) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Editar elemento</DialogTitle>
          <DialogDescription>
            Modificá las configuraciones y cantidad del elemento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del elemento */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Elemento</h4>
            <p className="text-sm text-slate-700">{elemento.nombre}</p>
            <p className="text-xs text-slate-500 mt-1">
              {elemento.categoria} {elemento.subcategoria && `· ${elemento.subcategoria}`}
            </p>
          </div>

          {/* Configuraciones del catálogo */}
          {elementoCatalogo?.opciones && Object.keys(elementoCatalogo.opciones).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800">Configuraciones</h4>
              {Object.entries(elementoCatalogo.opciones).map(([key, opciones]) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
                    {key
                      .split("_")
                      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
                      .join(" ")}
                  </label>
                  <Select
                    value={configValues[key] || ""}
                    onValueChange={(value) =>
                      setConfigValues((prev) => ({ ...prev, [key]: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(opciones || []).map((opcion: string) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Cantidad y Unidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Cantidad</label>
              <Input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                min={0}
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Unidad</label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["m²", "m³", "unidad", "ml", "kg", "metro"].map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción adicional */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Descripción adicional (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Agregá notas adicionales..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#0066FF] hover:bg-[#0052CC]">
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

