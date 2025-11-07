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

type CategoriaCatalogo = {
  id: string;
  categoria: string;
  subcategorias: Array<{
    id: string;
    nombre: string;
  }>;
};

type ModalNuevoElementoProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categorias: CategoriaCatalogo[];
  obraId: string;
};

export default function ModalNuevoElemento({
  open,
  onClose,
  onSuccess,
  categorias,
  obraId,
}: ModalNuevoElementoProps) {
  const { toast } = useToast();

  const [categoriaId, setCategoriaId] = useState<string>("");
  const [subcategoriaId, setSubcategoriaId] = useState<string>("");
  const [nombre, setNombre] = useState<string>("");
  const [unidad, setUnidad] = useState<string>("unidad");
  const [precioBase, setPrecioBase] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const categoriaSeleccionada = useMemo(
    () => categorias.find((categoria) => categoria.id === categoriaId),
    [categoriaId, categorias]
  );

  useEffect(() => {
    if (!open) {
      setCategoriaId("");
      setSubcategoriaId("");
      setNombre("");
      setUnidad("unidad");
      setPrecioBase("");
      setIsSaving(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoriaSeleccionada || !subcategoriaId || !nombre.trim()) {
      toast({
        title: "Completá los campos requeridos",
        description: "Seleccioná categoría, subcategoría y nombre",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        categoria: categoriaSeleccionada.categoria,
        subcategoria:
          categoriaSeleccionada.subcategorias.find(
            (sub) => sub.id === subcategoriaId
          )?.nombre ?? "",
        unidad,
        cantidad: 0,
      } as Record<string, unknown>;

      if (precioBase) {
        payload.costo_unitario = Number(precioBase);
      }

      const response = await fetch(`/api/obras/${obraId}/elementos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo guardar el elemento");
      }

      toast({
        title: "Elemento creado",
        description: "El nuevo elemento quedó registrado en la obra",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[ModalNuevoElemento] Error guardando elemento", error);
      toast({
        title: "No se pudo guardar",
        description:
          error instanceof Error ? error.message : "Intentá nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar nuevo elemento</DialogTitle>
          <DialogDescription>
            Creá un elemento personalizado para esta obra. Podés editarlo más
            adelante desde la lista de elementos cargados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="nombre">
              Nombre del elemento
            </label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Muro ecológico modular"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">
                Categoría
              </label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">
                Subcategoría
              </label>
              <Select
                value={subcategoriaId}
                onValueChange={setSubcategoriaId}
                disabled={!categoriaSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriaSeleccionada?.subcategorias ?? []).map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">
                Unidad de medida
              </label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["unidad", "m²", "m³", "ml", "kg"].map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">
                Precio base (opcional)
              </label>
              <Input
                type="number"
                min={0}
                value={precioBase}
                onChange={(event) => setPrecioBase(event.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar elemento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


