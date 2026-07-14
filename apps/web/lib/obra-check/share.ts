/**
 * Compartir mensajes de Obra Check sin depender de tipear el teléfono a mano.
 *
 * Realidad de plataformas (importante para producto):
 * - `navigator.share({ text })` abre la hoja del sistema: el usuario elige WhatsApp y el contacto.
 *   La API NO nos dice a quién se lo mandó (privacidad del SO).
 * - Contact Picker (`navigator.contacts.select`) sí nos da nombre/teléfono con consentimiento
 *   explícito del usuario, pero solo en Chrome/Android (y con permiso).
 * - Sin ninguna de las dos: fallback a wa.me (con tel si lo tenemos, o genérico).
 */

export type ShareResult =
  | { method: 'web_share'; ok: true }
  | { method: 'web_share'; ok: false; cancelled: true }
  | { method: 'wa_link'; ok: true }
  | { method: 'unavailable'; ok: false };

export function canUseWebShareText(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function canUseContactPicker(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    typeof (navigator as Navigator & { contacts?: { select?: unknown } }).contacts?.select === 'function'
  );
}

export type PickedContact = { nombre: string; telefono: string };

/** Abre el selector de contactos del dispositivo (Chrome Android). */
export async function pickDeviceContact(): Promise<PickedContact | null> {
  if (!canUseContactPicker()) return null;
  try {
    const contactsApi = (
      navigator as Navigator & {
        contacts: {
          select: (
            props: string[],
            opts: { multiple: boolean },
          ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
        };
      }
    ).contacts;
    const picked = await contactsApi.select(['name', 'tel'], { multiple: false });
    const c = picked[0];
    if (!c) return null;
    const nombre = (c.name?.[0] ?? '').trim();
    const telefono = (c.tel?.[0] ?? '').replace(/[^\d+]/g, '');
    if (!nombre && !telefono) return null;
    return { nombre: nombre || 'Contacto', telefono };
  } catch {
    return null; // canceló o denegó permiso
  }
}

/** Preferí Web Share (elige contacto en la UI del SO). Si no hay, abre wa.me. */
export async function shareOrOpenWhatsApp(opts: {
  texto: string;
  waLink: string;
  titulo?: string;
}): Promise<ShareResult> {
  const { texto, waLink, titulo = 'Mensaje de obra' } = opts;

  if (canUseWebShareText()) {
    try {
      await navigator.share({ title: titulo, text: texto });
      return { method: 'web_share', ok: true };
    } catch (e) {
      // AbortError = usuario canceló; otros errores → fallback wa.me
      if ((e as Error)?.name === 'AbortError') {
        return { method: 'web_share', ok: false, cancelled: true };
      }
    }
  }

  window.open(waLink, '_blank', 'noopener,noreferrer');
  return { method: 'wa_link', ok: true };
}
