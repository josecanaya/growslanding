'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Contact, Package } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { canUseContactPicker, pickDeviceContact } from '@/lib/obra-check/share';
import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckContact } from '@/lib/obra-check/types';
import { budgetDisplaySections } from './budget-groups/buildDefaultHierarchy';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';

/** budgetGroupId (subgrupo) → contactId — se asigna el paquete de trabajos entero. */
export type Assignments = Record<string, string>;

type AssignableGroup = {
  groupId: string;
  phaseName: string | null;
  groupName: string;
  blocks: ObraCheckBlock[];
  taskCount: number;
};

export function StepAsignar({
  blocks,
  budgetGroups,
  onContinue,
}: {
  blocks: ObraCheckBlock[];
  budgetGroups?: ObraCheckBudgetGroup[];
  onContinue: (assignments: Assignments, contacts: ObraCheckContact[]) => void;
}) {
  const [contacts, setContacts] = useState<ObraCheckContact[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devicePicker, setDevicePicker] = useState(false);

  const groups = useMemo((): AssignableGroup[] => {
    if (budgetGroups && budgetGroups.length > 0) {
      return budgetDisplaySections(budgetGroups, blocks).map((s) => ({
        groupId: s.groupId,
        phaseName: s.phaseName,
        groupName: s.subgroupName,
        blocks: s.blocks,
        taskCount: s.blocks.reduce((n, b) => n + b.taskIds.length, 0),
      }));
    }
    return blocks.map((b) => ({
      groupId: b.budgetGroupId ?? b.id,
      phaseName: b.fase,
      groupName: b.nombre,
      blocks: [b],
      taskCount: b.taskIds.length,
    }));
  }, [budgetGroups, blocks]);

  useEffect(() => {
    obraCheckApi.listContacts().then(setContacts).catch(() => {});
    setDevicePicker(canUseContactPicker());
  }, []);

  async function fromDevice() {
    const picked = await pickDeviceContact();
    if (!picked) return;
    setForm({ nombre: picked.nombre, telefono: picked.telefono });
  }

  async function assignContactToGroup(group: AssignableGroup, contactId: string) {
    setBusy(true);
    setError(null);
    try {
      // Un contacto para todos los paquetes del grupo de presupuesto.
      for (const block of group.blocks) {
        await obraCheckApi.asignar({ contactId, blockId: block.id });
      }
      setAssignments((a) => ({ ...a, [group.groupId]: contactId }));
      setOpenGroup(null);
      setForm({ nombre: '', telefono: '' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function assignNew(group: AssignableGroup) {
    if (!form.nombre.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const contact = await obraCheckApi.createContact({
        nombre: form.nombre.trim(),
        rubro: group.blocks[0]?.rubro ?? null,
        telefono: form.telefono.trim() || null,
      });
      setContacts((c) => [...c, contact]);
      for (const block of group.blocks) {
        await obraCheckApi.asignar({ contactId: contact.id, blockId: block.id });
      }
      setAssignments((a) => ({ ...a, [group.groupId]: contact.id }));
      setOpenGroup(null);
      setForm({ nombre: '', telefono: '' });
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
        Asigná contratista a cada grupo de presupuesto
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        El botón <strong>Asignar</strong> aplica al <strong>grupo entero</strong> (todos los paquetes
        de ese presupuesto). Así mandás el paquete de trabajos completo a un solo contratista.
      </p>

      <div className="space-y-4">
        {groups.map((group) => {
          const assignedId = assignments[group.groupId];
          const assignedContact = contacts.find((c) => c.id === assignedId);
          return (
            <OCCard key={group.groupId}>
              {group.phaseName && (
                <p
                  className="mb-1 text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: BRAND.blueLight }}
                >
                  {group.phaseName}
                </p>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: BRAND.text }}>
                    <Package size={15} style={{ color: BRAND.blueLight }} />
                    {group.groupName}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: BRAND.muted }}>
                    {group.blocks.length} paquete{group.blocks.length === 1 ? '' : 's'} ·{' '}
                    {group.taskCount} tarea{group.taskCount === 1 ? '' : 's'}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px]" style={{ color: BRAND.muted }}>
                    {group.blocks.map((b) => (
                      <li key={b.id}>
                        · {b.nombre} ({b.taskIds.length} tar.)
                      </li>
                    ))}
                  </ul>
                </div>
                {assignedContact ? (
                  <span
                    className="flex shrink-0 items-center gap-1 text-sm font-medium"
                    style={{ color: BRAND.green }}
                  >
                    <Check size={16} /> {assignedContact.nombre}
                  </span>
                ) : (
                  <OCButton
                    variant="secondary"
                    onClick={() => setOpenGroup(openGroup === group.groupId ? null : group.groupId)}
                  >
                    Asignar
                  </OCButton>
                )}
              </div>

              {openGroup === group.groupId && !assignedContact && (
                <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: BRAND.border }}>
                  <p className="text-[11px]" style={{ color: BRAND.muted }}>
                    Este contacto recibirá el grupo completo ({group.blocks.length} paquete
                    {group.blocks.length === 1 ? '' : 's'}).
                  </p>
                  {contacts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {contacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => void assignContactToGroup(group, c.id)}
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
                    <OCButton
                      onClick={() => void assignNew(group)}
                      loading={busy}
                      disabled={!form.nombre.trim()}
                    >
                      Guardar
                    </OCButton>
                  </div>
                </div>
              )}
            </OCCard>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm" style={{ color: BRAND.error }}>
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs" style={{ color: BRAND.muted }}>
          {assignedCount}/{groups.length} grupos asignados
        </span>
        <OCButton onClick={() => onContinue(assignments, contacts)} disabled={assignedCount === 0}>
          Continuar al envío →
        </OCButton>
      </div>
    </div>
  );
}
