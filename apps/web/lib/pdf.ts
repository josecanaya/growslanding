import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type PdfChecklistItem = {
  label: string;
  value: string;
};

export type PdfMediaItem = {
  kind: 'foto' | 'firma';
  path?: string;
  dataUrl?: string;
};

type PdfPayload = {
  obra: {
    nombre: string;
    cliente?: string | null;
    localizacion?: string | null;
  };
  tarea: {
    id: string;
    tipo: string;
    descripcion: string;
  };
  evento: {
    nuevo_estado: string;
    actor_name: string;
    actor_role: string;
    actor_method: string;
    notas: string;
    checklist: PdfChecklistItem[];
    media: PdfMediaItem[];
  };
};

type CreatePdfResult = {
  pdfBytes: Uint8Array;
  pdfPath: string;
};

function parseDataUrl(dataUrl: string) {
  const match = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/u.exec(dataUrl ?? '');
  if (!match?.groups) {
    throw new Error('Media inválida para PDF');
  }

  const { mime, data } = match.groups;
  const buffer = Buffer.from(data, 'base64');
  return { mime, buffer };
}

async function embedMedia(
  pdfDoc: PDFDocument,
  media: PdfMediaItem
) {
  if (!media.dataUrl) {
    return null;
  }

  const { mime, buffer } = parseDataUrl(media.dataUrl);

  if (mime.includes('png')) {
    return pdfDoc.embedPng(buffer);
  }

  if (mime.includes('jpeg') || mime.includes('jpg')) {
    return pdfDoc.embedJpg(buffer);
  }

  throw new Error(`Formato de media no soportado: ${mime}`);
}

export async function createActaPdf(payload: PdfPayload): Promise<CreatePdfResult> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  let cursorY = height - 50;

  const drawLine = (text: string, options: { size?: number } = {}) => {
    const size = options.size ?? 12;
    page.drawText(text, {
      x: 50,
      y: cursorY,
      size,
      font,
      color: rgb(0, 0, 0),
      maxWidth: width - 100,
    });
    cursorY -= size + 6;
  };

  drawLine(`Acta de visita - ${payload.obra.nombre}`, { size: 18 });
  drawLine(`Cliente: ${payload.obra.cliente ?? 'N/D'}`);
  drawLine(`Ubicación: ${payload.obra.localizacion ?? 'N/D'}`);
  drawLine(`Tarea: ${payload.tarea.tipo}`);
  drawLine(`Descripción: ${payload.tarea.descripcion}`);
  drawLine('');

  drawLine(`Estado: ${payload.evento.nuevo_estado}`);
  drawLine(`Actor: ${payload.evento.actor_name} (${payload.evento.actor_role}) via ${payload.evento.actor_method}`);
  drawLine(`Notas: ${payload.evento.notas || 'Sin notas'}`);
  drawLine('Checklist:');

  if (payload.evento.checklist.length === 0) {
    drawLine('  - Sin checklist reportado');
  } else {
    payload.evento.checklist.forEach((item) => {
      drawLine(`  - ${item.label}: ${item.value}`);
    });
  }

  drawLine('');

  const photos = payload.evento.media.filter((item) => item.kind === 'foto');
  if (photos.length) {
    drawLine('Evidencia fotográfica:');
    const photoPage = pdfDoc.addPage();
    const { width: photoWidth, height: photoHeight } = photoPage.getSize();
    let x = 40;
    let y = photoHeight - 180;
    for (const media of photos) {
      const embedded = await embedMedia(pdfDoc, media);
      if (!embedded) continue;
      const dimensions = embedded.scale(150 / Math.max(embedded.width, embedded.height));
      if (x + dimensions.width > photoWidth - 40) {
        x = 40;
        y -= 180;
      }
      if (y < 80) {
        y = photoHeight - 180;
      }
      photoPage.drawImage(embedded, {
        x,
        y,
        width: dimensions.width,
        height: dimensions.height,
      });
      x += dimensions.width + 20;
    }
  }

  const firmas = payload.evento.media.filter((item) => item.kind === 'firma');
  if (firmas.length) {
    const signaturePage = pdfDoc.addPage();
    const { width: sigWidth, height: sigHeight } = signaturePage.getSize();
    let y = sigHeight - 200;
    for (const media of firmas) {
      const embedded = await embedMedia(pdfDoc, media);
      if (!embedded) continue;
      const dimensions = embedded.scale(200 / Math.max(embedded.width, embedded.height));
      signaturePage.drawText('Firma:', {
        x: 50,
        y: y + 170,
        size: 14,
        font,
      });
      signaturePage.drawImage(embedded, {
        x: 50,
        y,
        width: dimensions.width,
        height: dimensions.height,
      });
      y -= 250;
      if (y < 100) {
        y = sigHeight - 200;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfPath = `actas/${payload.tarea.id}-${Date.now()}.pdf`;

  return { pdfBytes, pdfPath };
}
