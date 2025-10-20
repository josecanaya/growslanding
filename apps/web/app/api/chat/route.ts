import { NextResponse } from 'next/server';
import enviarMensajeAGrowsN8n from '@/src/api/grows_webhook';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await enviarMensajeAGrowsN8n(body ?? {});
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message });
  }
}
