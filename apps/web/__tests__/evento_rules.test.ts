import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/pdf', () => ({
  createActaPdf: vi.fn(async () => ({
    pdfPath: 'actas/evento-demo.pdf',
    pdfBytes: new Uint8Array([1, 2, 3]),
  })),
}));

import { createActaPdf } from '@/lib/pdf';
import {
  prepareEventoInsert,
  validateMediaRules,
} from '@/lib/evento-rules';

describe('reglas de eventos', () => {
  it('exige al menos una foto cuando hay NC o checklist con NO', () => {
    const base = {
      checklist: [],
      has_nc: true,
      media: [],
    };

    expect(() => validateMediaRules(base)).toThrowError(/foto/);

    expect(() =>
      validateMediaRules({
        ...base,
        has_nc: false,
        checklist: [{ label: 'Item', value: 'NO' }],
      })
    ).toThrowError(/foto/);

    expect(() =>
      validateMediaRules({
        ...base,
        media: [{ kind: 'foto', path: 'photos/1.jpg' }],
      })
    ).not.toThrow();
  });

  it('genera snapshot_json y pdf_path al validar', async () => {
    const result = await prepareEventoInsert(
      {
        tareaId: 'task-1',
        nuevo_estado: 'validado',
        checklist: [{ label: 'Item', value: 'SI' }],
        media: [{ kind: 'foto', path: 'photos/1.jpg' }],
        notas: 'Todo ok',
        has_nc: false,
        actor: { name: 'Ana', role: 'Cliente', method: 'QR' },
      },
      {
        tarea: {
          id: 'task-1',
          tipo: 'Terminaciones',
          descripcion: 'Pintura interior',
          estado: 'finalizado',
        },
        obra: { nombre: 'Obra Demo', cliente: 'Cliente X', localizacion: 'Av. 123' },
      }
    );

    expect(result.snapshot_json).toMatchObject({
      tarea: { id: 'task-1' },
      evento: { nuevo_estado: 'validado' },
    });
    expect(result.pdf_path).toBe('actas/evento-demo.pdf');
    expect(createActaPdf).toHaveBeenCalledOnce();
  });
});
