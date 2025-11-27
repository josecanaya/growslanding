import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import crypto from 'crypto';

// Verificar firma del webhook de Supabase
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  
  // Supabase envía la firma como "sha256=<hash>"
  const expectedSignature = signature.startsWith('sha256=') 
    ? signature.slice(7) 
    : signature;
  
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-supabase-signature') || '';
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET || '';

    // Verificar firma si está configurada
    if (webhookSecret && !verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('[WEBHOOK_AUTH] Firma inválida');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    console.log('[WEBHOOK_AUTH] Evento recibido:', event.type, event.record?.id);

    const serviceSupabase = createServiceSupabaseClient();

    // Manejar eventos de usuario
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const user = event.record;
      
      if (!user) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const userId = user.id;
      const email = user.email;
      const userMetadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};
      
      const role = appMetadata.role || userMetadata.role;
      const orgId = userMetadata.org_id;
      const emailConfirmedAt = user.email_confirmed_at;

      console.log('[WEBHOOK_AUTH] Usuario:', {
        userId,
        email,
        role,
        orgId,
        emailConfirmedAt,
        eventType: event.type,
      });

      // Solo procesar CLIENTE_TECNICO
      if (role !== 'CLIENTE_TECNICO') {
        console.log('[WEBHOOK_AUTH] Usuario no es CLIENTE_TECNICO, ignorando');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Si ya tiene org_id, no hacer nada
      if (orgId) {
        console.log('[WEBHOOK_AUTH] Usuario ya tiene org_id:', orgId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // SOLO crear organización cuando el email está confirmado
      // Si el email no está confirmado, esperar confirmación
      if (!emailConfirmedAt) {
        console.log('[WEBHOOK_AUTH] Email no confirmado, esperando confirmación');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Si el email está confirmado, crear organización y asignar org_id
      if (emailConfirmedAt) {
        const nombre = userMetadata.full_name || userMetadata.name || email?.split('@')[0] || 'Usuario';
        const ciudad = userMetadata.ciudad || '';

        console.log('[WEBHOOK_AUTH] Creando organización para CLIENTE_TECNICO:', { nombre, ciudad });

        // Buscar organización existente por nombre
        let organizationId = orgId;
        
        if (!organizationId) {
          const { data: existingOrg } = await serviceSupabase
            .from('organizations')
            .select('id')
            .eq('name', nombre)
            .maybeSingle();

          if (existingOrg) {
            organizationId = existingOrg.id;
            console.log('[WEBHOOK_AUTH] Organización existente encontrada:', organizationId);
          } else {
            // Crear nueva organización
            const { data: orgData, error: orgError } = await serviceSupabase
              .from('organizations')
              .insert([
                {
                  name: nombre,
                  address: ciudad || '',
                },
              ])
              .select('id')
              .single();

            if (orgError) {
              console.error('[WEBHOOK_AUTH] Error al crear organización:', orgError);
              // Continuar aunque falle, puede crearse más tarde
              return NextResponse.json({ received: true }, { status: 200 });
            }

            organizationId = orgData.id;
            console.log('[WEBHOOK_AUTH] Organización creada:', organizationId);
          }
        }

        // Actualizar user_metadata con org_id
        if (organizationId) {
          const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                ...userMetadata,
                role: 'CLIENTE_TECNICO',
                org_id: organizationId,
              },
            }
          );

          if (updateError) {
            console.error('[WEBHOOK_AUTH] Error al actualizar metadata:', updateError);
          } else {
            console.log('[WEBHOOK_AUTH] Metadata actualizada con org_id:', organizationId);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[WEBHOOK_AUTH] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

// Handler para verificación de webhook (GET)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

