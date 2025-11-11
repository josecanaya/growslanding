'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Loader2, Users } from 'lucide-react';
import { BaseCard, Button, EmptyState } from '@/components/ui/grows';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

type Mensaje = {
  id: string;
  contenido: string;
  remitente_tipo: 'cliente' | 'socio';
  remitente_id: string;
  destinatario_tipo: 'cliente' | 'socio';
  destinatario_id: string;
  obra_id: string | null;
  tarea_id: string | null;
  created_at: string;
  leido: boolean;
};

interface MensajeriaDirectaProps {
  obraId?: string | null;
  socioId?: string | null;
}

export function MensajeriaDirecta({ obraId = null, socioId = null }: MensajeriaDirectaProps) {
  const currentUser = useCurrentUser();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [socios, setSocios] = useState<Array<{ id: string; nombre: string }>>([]);
  const [selectedSocioId, setSelectedSocioId] = useState<string | null>(socioId ?? null);
  const [loadingSocios, setLoadingSocios] = useState(false);

  const orgId = currentUser?.orgId ?? null;
  const usuarioId = currentUser?.id ?? null;

  const headers = useMemo(() => {
    const baseHeaders: Record<string, string> = {};
    if (orgId) baseHeaders['x-organizacion-id'] = orgId;
    if (usuarioId) baseHeaders['x-usuario-id'] = usuarioId;
    if (selectedSocioId) baseHeaders['x-socio-id'] = selectedSocioId;
    return baseHeaders;
  }, [orgId, usuarioId, selectedSocioId]);

  useEffect(() => {
    if (socioId && socioId !== selectedSocioId) {
      setSelectedSocioId(socioId);
    }
  }, [socioId, selectedSocioId]);

  const fetchMensajes = useCallback(async () => {
    if (!orgId || !usuarioId || !selectedSocioId || typeof window === 'undefined') {
      setMensajes([]);
      return;
    }
    setLoading(true);
    try {
      const url = new URL('/api/mensajes', window.location.origin);
      if (obraId) url.searchParams.set('obra_id', obraId);

      const res = await fetch(url.toString(), { headers, cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        const data: Mensaje[] = (json.data || []) as Mensaje[];
        const filtradas = data.filter((mensaje) => {
          const emisor = mensaje.remitente_id;
          const receptor = mensaje.destinatario_id;
          return (
            (emisor === usuarioId && receptor === selectedSocioId) ||
            (emisor === selectedSocioId && receptor === usuarioId)
          );
        });
        setMensajes(filtradas);
      }
    } catch (error) {
      console.error('[MensajeriaDirecta] Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  }, [headers, obraId, orgId, selectedSocioId, usuarioId]);

  useEffect(() => {
    fetchMensajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMensajes]);

  useEffect(() => {
    const cargarSocios = async () => {
      if (!orgId) {
        setSocios([]);
        return;
      }

      setLoadingSocios(true);
      try {
        const supabase = createClientComponentClient<Database>();
        const supabaseAny = supabase as any;
        const { data, error } = await supabaseAny
          .from('socios')
          .select('id, nombre')
          .eq('org_id', orgId)
          .order('nombre', { ascending: true });

        if (!error && Array.isArray(data)) {
          setSocios(data);
          if (!selectedSocioId && data.length > 0) {
            setSelectedSocioId(data[0].id);
          }
        }
      } catch (error) {
        console.error('[MensajeriaDirecta] Error al cargar socios:', error);
      } finally {
        setLoadingSocios(false);
      }
    };

    cargarSocios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const handleEnviar = async () => {
    if (!orgId || !usuarioId || !selectedSocioId || !nuevoMensaje.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          org_id: orgId,
          obra_id: obraId,
          remitente_id: usuarioId,
          remitente_tipo: 'cliente',
          destinatario_id: selectedSocioId,
          destinatario_tipo: 'socio',
          contenido: nuevoMensaje.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNuevoMensaje('');
        await fetchMensajes();
      }
    } catch (error) {
      console.error('[MensajeriaDirecta] Error al enviar mensaje:', error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <BaseCard className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-growsText">Mensajería directa</h3>
        <p className="text-sm text-growsTextMuted">
          Conversá con tus socios para coordinar tareas. Los mensajes quedan guardados en el módulo.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-growsText">Socio destinatario</p>
        {loadingSocios ? (
          <div className="flex items-center gap-2 rounded-grows-md border border-growsBorder/60 bg-growsSurface/60 px-3 py-2 text-sm text-growsTextMuted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando socios…
          </div>
        ) : socios.length === 0 ? (
          <EmptyState
            title="Sin socios disponibles"
            description="Invitá socios desde el módulo de Cuadrillas para habilitar la mensajería."
            icon={<Users className="h-10 w-10 text-growsBlue" />}
          />
        ) : (
          <Select value={selectedSocioId ?? undefined} onValueChange={setSelectedSocioId}>
            <SelectTrigger>
              <SelectValue placeholder="Elegí un socio" />
            </SelectTrigger>
            <SelectContent>
              {socios.map((socio) => (
                <SelectItem key={socio.id} value={socio.id}>
                  {socio.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {socios.length === 0 || !selectedSocioId ? (
        <div className="rounded-grows-lg border border-dashed border-growsBorder/70 bg-growsSurface/60 p-8 text-center">
          <EmptyState
            title="Elegí un socio para comenzar"
            description="Seleccioná un socio del listado superior para ver la conversación y enviar mensajes."
            icon={<MessageSquare className="h-12 w-12 text-growsBlue" />}
          />
        </div>
      ) : (
        <div className="flex h-80 flex-col gap-3 overflow-hidden rounded-grows-lg border border-growsBorder bg-growsSurface/80">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-growsTextMuted">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando mensajes…
              </div>
            ) : mensajes.length === 0 ? (
              <EmptyState
                title="Todavía no hay mensajes"
                description="Escribí tu primer mensaje para coordinar con tus cuadrillas."
                icon={<MessageSquare className="h-12 w-12 text-growsBlue" />}
              />
            ) : (
              mensajes.map((mensaje) => {
                const esPropio = mensaje.remitente_id === usuarioId;
                return (
                  <div
                    key={mensaje.id}
                    className={cn(
                      'max-w-xs rounded-grows-md px-3 py-2 text-sm',
                      esPropio
                        ? 'ml-auto bg-growsBlue text-white'
                        : 'bg-growsBlueLight/15 text-growsText',
                    )}
                  >
                    <p>{mensaje.contenido}</p>
                    <span className="mt-1 block text-xs opacity-70">
                      {new Date(mensaje.created_at).toLocaleString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-growsBorder bg-growsSurface/90 p-3">
            <div className="flex items-center gap-3">
              <Input
                value={nuevoMensaje}
                onChange={(event) => setNuevoMensaje(event.target.value)}
                placeholder="Escribí un mensaje…"
                disabled={enviando || !selectedSocioId}
              />
              <Button
                onClick={handleEnviar}
                disabled={!nuevoMensaje.trim() || enviando || !selectedSocioId}
                icon={enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </BaseCard>
  );
}


