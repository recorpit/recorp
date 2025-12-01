# Modulo Documenti/Archivio - Istruzioni Installazione

## 1. Aggiorna Schema Prisma

Aggiungi al file `prisma/schema.prisma`:

### A) Nuovo enum (dopo gli altri enum):
```prisma
enum CategoriaDocumento {
  ARTISTA
  COMMITTENTE
  LOCALE
  AGIBILITA
  FATTURA
  CONTRATTO
  RICEVUTA
  AZIENDALE
  ALTRO
}
```

### B) Nuovo model Documento (alla fine del file):
```prisma
model Documento {
  id                String              @id @default(cuid())
  
  // Metadati file
  nome              String              // Nome file originale
  nomeVisualizzato  String?             // Nome personalizzato
  descrizione       String?
  path              String              // Percorso storage
  mimeType          String?
  dimensione        Int?                // Bytes
  estensione        String?             // pdf, jpg, xlsx, etc.
  
  // Categorizzazione
  categoria         CategoriaDocumento  @default(ALTRO)
  tags              String?             // JSON array di tag
  
  // Riferimenti opzionali (uno solo valorizzato)
  artistaId         String?
  artista           Artista?            @relation("DocumentiArchivio", fields: [artistaId], references: [id], onDelete: SetNull)
  committenteId     String?
  committente       Committente?        @relation("DocumentiArchivio", fields: [committenteId], references: [id], onDelete: SetNull)
  localeId          String?
  locale            Locale?             @relation("DocumentiArchivio", fields: [localeId], references: [id], onDelete: SetNull)
  agibilitaId       String?
  agibilita         Agibilita?          @relation("DocumentiArchivio", fields: [agibilitaId], references: [id], onDelete: SetNull)
  
  // Audit
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  createdBy         String?             // Username o ID utente
  
  @@index([categoria])
  @@index([artistaId])
  @@index([committenteId])
  @@index([agibilitaId])
  @@index([createdAt])
}
```

### C) Aggiungi relazione inversa nei model esistenti:

Nel model **Artista** aggiungi:
```prisma
documentiArchivio     Documento[]             @relation("DocumentiArchivio")
```

Nel model **Committente** aggiungi:
```prisma
documentiArchivio     Documento[]             @relation("DocumentiArchivio")
```

Nel model **Locale** aggiungi:
```prisma
documentiArchivio     Documento[]             @relation("DocumentiArchivio")
```

Nel model **Agibilita** aggiungi:
```prisma
documentiArchivio     Documento[]             @relation("DocumentiArchivio")
```

## 2. Esegui Migrazione

```bash
npx prisma migrate dev --name add_documenti_archivio
```

## 3. Copia i File

- `src/app/api/documenti/route.ts` → API lista e upload
- `src/app/api/documenti/[id]/route.ts` → API singolo documento
- `src/app/api/documenti/[id]/download/route.ts` → API download
- `src/app/(dashboard)/documenti/page.tsx` → Pagina principale

## 4. Struttura Storage

I documenti vengono salvati in `public/uploads/archivio/`:

```
public/uploads/archivio/
├── artista/
│   └── 2025/
├── committente/
│   └── 2025/
├── locale/
│   └── 2025/
├── agibilita/
│   └── 2025/
├── fattura/
│   └── 2025/
├── contratto/
│   └── 2025/
├── ricevuta/
│   └── 2025/
├── aziendale/
│   └── 2025/
└── altro/
    └── 2025/
```

Le cartelle vengono create automaticamente al primo upload.

## 5. Riavvia Server

```bash
npm run dev
```

## Funzionalità

- ✅ Upload documenti con drag & drop
- ✅ Categorizzazione automatica
- ✅ Collegamento a Artisti, Committenti, Locali, Agibilità
- ✅ Ricerca full-text
- ✅ Filtro per categoria
- ✅ Vista Griglia e Lista
- ✅ Preview e download
- ✅ Statistiche per categoria
- ✅ Tag personalizzati
