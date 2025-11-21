import { NextRequest, NextResponse } from 'next/server';

import { createServiceSupabaseClient } from '@/lib/supabase-server';



export async function POST(request: NextRequest) {

  try {

    const { user_id, role } = await request.json();



    if (!user_id || !role) {

      return NextResponse.json(

        { error: 'user_id y role son requeridos' },

        { status: 400 }

      );

    }



    const supabase = createServiceSupabaseClient();



    const { error } = await supabase.auth.admin.updateUserById(user_id, {

      user_metadata: { role },

    });



    if (error) {

      return NextResponse.json({ error: error.message }, { status: 400 });

    }



    return NextResponse.json({ success: true });

  } catch (error) {

    return NextResponse.json(

      { error: error instanceof Error ? error.message : 'Error interno' },

      { status: 500 }

    );

  }

}

