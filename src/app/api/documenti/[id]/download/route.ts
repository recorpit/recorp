// src/app/api/documenti/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile, getSignedUrl } from '@/lib/supabase/storage'

// GET - Download documento da Supabase Storage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Trova documento nel database
    const documento = await prisma.documento.findUnique({
      where: { id }
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    // Check se si vuole redirect o download diretto
    const { searchParams } = new URL(request.url)
    const redirect = searchParams.get('redirect') === 'true'

    if (redirect) {
      // Genera URL firmato e redirect
      const signedUrl = await getSignedUrl(documento.path, 3600) // 1 ora
      
      if (!signedUrl) {
        return NextResponse.json({ error: 'Errore generazione URL' }, { status: 500 })
      }

      return NextResponse.redirect(signedUrl)
    }

    // Download diretto - scarica da Supabase e ritorna
    const fileBuffer = await downloadFile(documento.path)

    if (!fileBuffer) {
      return NextResponse.json({ error: 'File non trovato nello storage' }, { status: 404 })
    }

    // Ritorna file per download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': documento.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(documento.nome)}"`,
        'Content-Length': fileBuffer.length.toString(),
      }
    })
  } catch (error) {
    console.error('Errore download documento:', error)
    return NextResponse.json({ error: 'Errore nel download del documento' }, { status: 500 })
  }
}
