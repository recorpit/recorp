// src/app/api/note-credito/[id]/route.ts
// API singola Nota di Credito

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ============================================
// GET - Dettaglio nota di credito
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const notaDiCredito = await prisma.notaDiCredito.findUnique({
      where: { id },
      include: {
        fatturaRiferimento: {
          select: {
            id: true,
            numero: true,
            dataEmissione: true,
            totale: true,
            imponibile: true,
            iva: true,
            stato: true,
            committente: {
              select: {
                id: true,
                ragioneSociale: true,
                partitaIva: true,
                codiceFiscale: true,
                codiceSDI: true,
                pec: true,
                indirizzoFatturazione: true,
                capFatturazione: true,
                cittaFatturazione: true,
                provinciaFatturazione: true,
              }
            }
          }
        },
        committente: {
          select: {
            id: true,
            ragioneSociale: true,
            partitaIva: true,
            codiceFiscale: true,
          }
        }
      }
    });
    
    if (!notaDiCredito) {
      return NextResponse.json(
        { error: 'Nota di credito non trovata' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(notaDiCredito);
    
  } catch (error) {
    console.error('Errore caricamento nota di credito:', error);
    return NextResponse.json(
      { error: 'Errore nel caricamento della nota di credito' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Aggiorna stato nota di credito
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const notaDiCredito = await prisma.notaDiCredito.findUnique({
      where: { id },
    });
    
    if (!notaDiCredito) {
      return NextResponse.json(
        { error: 'Nota di credito non trovata' },
        { status: 404 }
      );
    }
    
    // Campi aggiornabili
    const updateData: any = {};
    
    if (body.stato) {
      const statiValidi = ['EMESSA', 'INVIATA', 'ANNULLATA'];
      if (!statiValidi.includes(body.stato)) {
        return NextResponse.json(
          { error: 'Stato non valido' },
          { status: 400 }
        );
      }
      updateData.stato = body.stato;
    }
    
    if (body.note !== undefined) {
      updateData.note = body.note;
    }
    
    const updated = await prisma.notaDiCredito.update({
      where: { id },
      data: updateData,
      include: {
        fatturaRiferimento: {
          select: {
            numero: true,
          }
        },
        committente: {
          select: {
            ragioneSociale: true,
          }
        }
      }
    });
    
    return NextResponse.json(updated);
    
  } catch (error) {
    console.error('Errore aggiornamento nota di credito:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della nota di credito' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Elimina nota di credito
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const notaDiCredito = await prisma.notaDiCredito.findUnique({
      where: { id },
    });
    
    if (!notaDiCredito) {
      return NextResponse.json(
        { error: 'Nota di credito non trovata' },
        { status: 404 }
      );
    }
    
    // Permetti eliminazione solo se non è stata inviata
    if (notaDiCredito.stato === 'INVIATA') {
      return NextResponse.json(
        { error: 'Non è possibile eliminare una nota di credito già inviata' },
        { status: 400 }
      );
    }
    
    await prisma.notaDiCredito.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Errore eliminazione nota di credito:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della nota di credito' },
      { status: 500 }
    );
  }
}