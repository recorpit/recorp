// src/app/api/auth/update-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: { lastLoginAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore aggiornamento login:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
