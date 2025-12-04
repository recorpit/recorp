// src/app/api/auth/cambio-password/route.ts
// NOTA: Il cambio password ora avviene direttamente via Supabase client
// Questa API è mantenuta per retrocompatibilità ma potrebbe essere rimossa

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { nuovaPassword } = await request.json()

    if (!nuovaPassword) {
      return NextResponse.json({ error: 'Nuova password richiesta' }, { status: 400 })
    }

    // Aggiorna password tramite Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: nuovaPassword
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore cambio password:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
