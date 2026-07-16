'use client';

import { useEffect, useState } from 'react';
import { Check, Contact } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { canUseContactPicker, pickDeviceContact } from '@/lib/obra-check/share';
import type { ObraCheckBlock, ObraCheckContact } from '@/lib/obra-check/types';
import { rubroLabel } from '@/lib/obra-check/rubros';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';

/** blockClientId -> contactId */
export type Assignments = Record<string, string>;

export function StepAsignar({
  blocks,
  onContinue,
}: {
  blocks: ObraCheckBlock[];
  onContinue: (assignments: Assignments, contacts: ObraCheckContact[]) => void;
}) {
  const [contacts, setContacts] = useState<ObraCheckContact[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devicePicker, setDevicePicker] = useState(false);

  useEffect(() => {
    obraCheckApi.listContacts().then(setContacts).catch(() => {});
    setDevicePicker(canUseContactPicker());
  }, []);

  async function fromDevice() {
    const picked = await pickDeviceContact();
    if (!picked) return;
    setForm({ nombre: picked.nombre, telefono: picked.telefono });
  }

  async function assignNew(block: ObraCheckBlock) {
    if (!form.nombre.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const contact = await obraCheckApi.createContact({
        nombre: form.nombre.trim(),
        rubro: block.rubro,
        telefono: form.telefono.trim() || null,
      });
      setContacts((c) => [...c, contact]);
      await obraCheckApi.asignar({ contactId: contact.id, blockId: block.id });
      setAssignments((a) => ({ ...a, [block.id]: contact.id }));
      setOpenBlock(null);
      setForm({ nombre: '', telefono: '' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function assignExisting(block: ObraCheckBlock, contactId: string) {
    setBusy(true);
    try {
      await obraCheckApi.asignar({ contactId, blockId: block.id });
      setAssignments((a) => ({ ...a, [block.id]: contactId }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const assignedCount = Object.keys(assignments).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Asigná un contratista a cada bloque
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Poné un nombre orientativo (ej. “Electricista Juan”). El WhatsApp real lo deja el contratista
        en el formulario que le mandás — así no dependés de adivinar el número al compartir.
      </p>

      <div className="space-y-3">
        {blocks.map((block) => {
          const assignedId = assignments[block.id];
          const assignedContact = contacts.find((c) => c.id === assignedId);
          return (
            <OCCard key={block.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                    {block.nombre}
                  </p>
                  <p className="text-xs" style={{ color: BRAND.muted }}>
                    {block.taskIds.length} tarea(s) · {rubroLabel(block.rubro)}
                  </p>
                </div>
                {assignedContact ? (
                  <span className="flex items-center gap-1 text-sm font-medium" style={{ color: BRAND.green }}>
                    <Check size={16} /> {assignedContact.nombre}
                  </span>
                ) : (
                  <OCButton variant="secondary" onClick={() => setOpenBlock(openBlock === block.id ? null : block.id)}>
                    Asignar
                  </OCButton>
                )}
              </div>

              {openBlock === block.id && !assignedContact && (
                <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: BRAND.border }}>
                  {contacts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {contacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => assignExisting(block, c.id)}
                          className="rounded-full px-3 py-1 text-xs"
                          style={{ border: `1px solid ${BRAND.border}`, color: BRAND.text }}
                        >
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                  {devicePicker && (
                    <OCButton variant="secondary" onClick={() => void fromDevice()}>
                      <Contact size={15} /> Elegir de mis contactos
                    </OCButton>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      style={inputStyle}
                      placeholder="Nombre del contratista"
                      value={form.nombre}
                      onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    />
                    <input
                      style={inputStyle}
                      placeholder="WhatsApp (opcional)"
                      value={form.telefono}
                      onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    />
                    <OCButton onClick={() => assignNew(block)} loading={busy} disabled={!form.nombre.trim()}>
                      Guardar
                    </OCButton>
                  </div>
                </div>
              )}
            </OCCard>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: BRAND.error }}>{error}</p>}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs" style={{ color: BRAND.muted }}>
          {assignedCount}/{blocks.length} bloques asignados
        </span>
        <OCButton onClick={() => onContinue(assignments, contacts)} disabled={assignedCount === 0}>
          Continuar al envío →
        </OCButton>
      </div>
    </div>
  );
}
