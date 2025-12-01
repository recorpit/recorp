// src/app/api/impostazioni/scadenze/route.ts
// API Scadenze Pagamento - CRUD

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ============================================
// GET - Lista scadenze pagamento
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const soloAttive = searchParams.get('attive') === 'true';
    
    const where = soloAttive ? { attivo: true } : {};
    
    const scadenze = await prisma.scadenzaPagamento.findMany({
      where,
      orderBy: { ordine: 'asc' },
      include: {
        _count: {
          select: { committenti: true }
        }
      }
    });
    
    return NextResponse.json(scadenze);
    
  } catch (error) {
    console.error('Errore lista scadenze:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle scadenze' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crea nuova scadenza
// ============================================

interface CreateScadenzaBody {
  nome: string;
  codice: string;
  giorni: number;
  fineMese?: boolean;
  descrizione?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateScadenzaBody = await request.json();
    
    // Validazione
    if (!body.nome || !body.codice || body.giorni === undefined) {
      return NextResponse.json(
        { error: 'Nome, codice e giorni sono obbligatori' },
        { status: 400 }
      );
    }
    
    // Verifica unicità codice
    const existing = await prisma.scadenzaPagamento.findUnique({
      where: { codice: body.codice }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Codice già esistente' },
        { status: 400 }
      );
    }
    
    // Trova ordine massimo
    const maxOrdine = await prisma.scadenzaPagamento.aggregate({
      _max: { ordine: true }
    });
    
    const scadenza = await prisma.scadenzaPagamento.create({
      data: {
        nome: body.nome,
        codice: body.codice.toUpperCase(),
        giorni: body.giorni,
        fineMese: body.fineMese || false,
        descrizione: body.descrizione,
        ordine: (maxOrdine._max.ordine || 0) + 1,
      }
    });
    
    return NextResponse.json(scadenza, { status: 201 });
    
  } catch (error) {
    console.error('Errore creazione scadenza:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della scadenza' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Aggiorna scadenza (batch per riordino)
// ============================================

interface UpdateScadenzaBody {
  id: string;
  nome?: string;
  giorni?: number;
  fineMese?: boolean;
  descrizione?: string;
  attivo?: boolean;
  ordine?: number;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateScadenzaBody | UpdateScadenzaBody[] = await request.json();
    
    // Se è un array, aggiorna ordine batch
    if (Array.isArray(body)) {
      const updates = body.map((item, index) => 
        prisma.scadenzaPagamento.update({
          where: { id: item.id },
          data: { ordine: item.ordine ?? index }
        })
      );
      
      await prisma.$transaction(updates);
      
      return NextResponse.json({ success: true });
    }
    
    // Update singolo
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID richiesto' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.giorni !== undefined) updateData.giorni = body.giorni;
    if (body.fineMese !== undefined) updateData.fineMese = body.fineMese;
    if (body.descrizione !== undefined) updateData.descrizione = body.descrizione;
    if (body.attivo !== undefined) updateData.attivo = body.attivo;
    if (body.ordine !== undefined) updateData.ordine = body.ordine;
    
    const scadenza = await prisma.scadenzaPagamento.update({
      where: { id: body.id },
      data: updateData,
    });
    
    return NextResponse.json(scadenza);
    
  } catch (error) {
    console.error('Errore aggiornamento scadenza:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della scadenza' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Elimina scadenza (se non usata)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID richiesto' },
        { status: 400 }
      );
    }
    
    // Verifica se usata
    const scadenza = await prisma.scadenzaPagamento.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            committenti: true,
            fatture: true,
          }
        }
      }
    });
    
    if (!scadenza) {
      return NextResponse.json(
        { error: 'Scadenza non trovata' },
        { status: 404 }
      );
    }
    
    if (scadenza._count.committenti > 0 || scadenza._count.fatture > 0) {
      return NextResponse.json(
        { error: `Scadenza in uso da ${scadenza._count.committenti} committenti e ${scadenza._count.fatture} fatture. Disattivala invece di eliminarla.` },
        { status: 400 }
      );
    }
    
    await prisma.scadenzaPagamento.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Errore eliminazione scadenza:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della scadenza' },
      { status: 500 }
    );
  }
}
