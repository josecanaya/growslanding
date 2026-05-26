'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, X, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export interface SocioPerfilCompleto {
  id?: string;
  nombre: string | null;
  apellido: string | null;
  nombre_comercial: string | null;
  email: string | null;
  telefono: string | null;
  especialidad: string | null;
  especialidades_secundarias: string[];
  descripcion: string | null;
  localidad: string | null;
  experiencia: string | null;
  avatar_url: string | null;
}

interface EditarPerfilModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (perfil: SocioPerfilCompleto) => void;
}

const EMPTY: SocioPerfilCompleto = {
  nombre: '',
  apellido: '',
  nombre_comercial: '',
  email: '',
  telefono: '',
  especialidad: '',
  especialidades_secundarias: [],
  descripcion: '',
  localidad: '',
  experiencia: '',
  avatar_url: null,
};

export function EditarPerfilModal({ open, onClose, onSaved }: EditarPerfilModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<SocioPerfilCompleto>(EMPTY);
  const [secondaryDraft, setSecondaryDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch('/api/socio/perfil', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          throw new Error(json.message || 'No pudimos cargar tu perfil.');
        }
        const s = json.socio || {};
        setForm({
          nombre: s.nombre ?? '',
          apellido: s.apellido ?? '',
          nombre_comercial: s.nombre_comercial ?? '',
          email: s.email ?? '',
          telefono: s.telefono ?? '',
          especialidad: s.especialidad ?? '',
          especialidades_secundarias: Array.isArray(s.especialidades_secundarias)
            ? s.especialidades_secundarias
            : [],
          descripcion: s.descripcion ?? '',
          localidad: s.localidad ?? '',
          experiencia: s.experiencia ?? '',
          avatar_url: s.avatar_url ?? null,
        });
      } catch (e: any) {
        setError(e?.message || 'No pudimos cargar tu perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const updateField = <K extends keyof SocioPerfilCompleto>(key: K, value: SocioPerfilCompleto[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const agregarEspecialidadSecundaria = () => {
    const val = secondaryDraft.trim();
    if (!val) return;
    if (form.especialidades_secundarias.includes(val)) {
      setSecondaryDraft('');
      return;
    }
    if (form.especialidades_secundarias.length >= 8) {
      toast({
        title: 'Demasiadas especialidades',
        description: 'Podés cargar hasta 8 especialidades secundarias.',
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      especialidades_secundarias: [...prev.especialidades_secundarias, val].slice(0, 8),
    }));
    setSecondaryDraft('');
  };

  const quitarEspecialidad = (val: string) => {
    setForm((prev) => ({
      ...prev,
      especialidades_secundarias: prev.especialidades_secundarias.filter((s) => s !== val),
    }));
  };

  const onPickAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Archivo inválido', description: 'Elegí una imagen.', variant: 'destructive' });
      input.value = '';
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.readAsDataURL(file);
      });
      // Comprimir a 600px máximo
      const compressed = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSide = 600;
          let { width, height } = img;
          if (width > height && width > maxSide) {
            height = (height * maxSide) / width;
            width = maxSide;
          } else if (height > maxSide) {
            width = (width * maxSide) / height;
            height = maxSide;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas no disponible'));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('No pudimos procesar la imagen'));
        img.src = dataUrl;
      });

      const res = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dataUrl: compressed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || 'No se pudo subir la foto.');
      }
      const url =
        (json as any).publicUrl ||
        (json as any).evidencia_url ||
        (json as any).path ||
        null;
      if (!url) throw new Error('La subida no devolvió una URL.');
      updateField('avatar_url', String(url));
      toast({ title: 'Foto cargada', description: 'Recordá guardar los cambios.' });
    } catch (e: any) {
      toast({
        title: 'No se pudo subir la foto',
        description: e?.message || 'Probá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
      input.value = '';
    }
  };

  const handleGuardar = async () => {
    if (!(form.nombre || '').trim()) {
      toast({ title: 'Falta el nombre', description: 'Ingresá tu nombre.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/socio/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          nombre_comercial: form.nombre_comercial,
          email: form.email,
          telefono: form.telefono,
          especialidad: form.especialidad,
          especialidades_secundarias: form.especialidades_secundarias,
          descripcion: form.descripcion,
          localidad: form.localidad,
          experiencia: form.experiencia,
          avatar_url: form.avatar_url,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No pudimos guardar los cambios.');
      }
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos quedaron guardados.',
      });
      onSaved?.(json.socio);
      onClose();
    } catch (e: any) {
      toast({
        title: 'Error al guardar',
        description: e?.message || 'Probá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Actualizá tus datos profesionales. Los cambios se guardan al instante.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-stitch-primary" />
            <span className="ml-2 text-sm text-stitch-on-surface/70">Cargando perfil…</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : (
          <div className="grid gap-4 py-2">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-2xl font-bold text-stitch-primary">
                {form.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  (form.nombre?.charAt(0) || 'S').toUpperCase()
                )}
              </div>
              <label className="cursor-pointer text-sm">
                <span className="rounded-lg border border-stitch-primary/30 bg-white px-3 py-2 text-stitch-primary hover:bg-blue-50">
                  {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="perfil-nombre-comercial">Nombre comercial</Label>
                <Input
                  id="perfil-nombre-comercial"
                  value={form.nombre_comercial ?? ''}
                  onChange={(e) => updateField('nombre_comercial', e.target.value)}
                  placeholder="Ej: Pérez Construcciones"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-nombre">Nombre</Label>
                <Input
                  id="perfil-nombre"
                  value={form.nombre ?? ''}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Ej: Juan"
                  maxLength={120}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-apellido">Apellido</Label>
                <Input
                  id="perfil-apellido"
                  value={form.apellido ?? ''}
                  onChange={(e) => updateField('apellido', e.target.value)}
                  placeholder="Ej: Pérez"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-email">Email</Label>
                <Input
                  id="perfil-email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="ej@correo.com"
                  maxLength={200}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-telefono">Teléfono</Label>
                <Input
                  id="perfil-telefono"
                  type="tel"
                  value={form.telefono ?? ''}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder="+54 9 11 0000-0000"
                  maxLength={40}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="perfil-especialidad">Especialidad principal</Label>
              <Input
                id="perfil-especialidad"
                value={form.especialidad ?? ''}
                onChange={(e) => updateField('especialidad', e.target.value)}
                placeholder="Ej: Albañilería"
                maxLength={120}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="perfil-especialidades-2">Especialidades secundarias</Label>
              <div className="flex gap-2">
                <Input
                  id="perfil-especialidades-2"
                  value={secondaryDraft}
                  onChange={(e) => setSecondaryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarEspecialidadSecundaria();
                    }
                  }}
                  placeholder="Ej: Plomería"
                  maxLength={80}
                />
                <Button type="button" variant="outline" size="sm" onClick={agregarEspecialidadSecundaria}>
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">Agregar</span>
                </Button>
              </div>
              {form.especialidades_secundarias.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {form.especialidades_secundarias.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-stitch-primary"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => quitarEspecialidad(s)}
                        className="rounded-full p-0.5 hover:bg-blue-100"
                        aria-label={`Quitar ${s}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="perfil-localidad">Localidad</Label>
              <Input
                id="perfil-localidad"
                value={form.localidad ?? ''}
                onChange={(e) => updateField('localidad', e.target.value)}
                placeholder="Ej: Buenos Aires"
                maxLength={200}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="perfil-experiencia">Experiencia</Label>
              <textarea
                id="perfil-experiencia"
                value={form.experiencia ?? ''}
                onChange={(e) => updateField('experiencia', e.target.value)}
                placeholder="Años trabajados, obras destacadas, certificaciones…"
                rows={3}
                maxLength={500}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="perfil-descripcion">Descripción profesional</Label>
              <textarea
                id="perfil-descripcion"
                value={form.descripcion ?? ''}
                onChange={(e) => updateField('descripcion', e.target.value)}
                placeholder="Contale al cliente cómo trabajás, materiales con los que te manejás, etc."
                rows={4}
                maxLength={500}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={saving || loading} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
