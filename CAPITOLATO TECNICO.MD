# RECORP - CAPITOLATO TECNICO
## Sistema Gestionale per Azienda Eventi

**Versione:** 1.0  
**Data:** Novembre 2024  
**Autore:** Oscar - OKL SRL  

---

## 1. PANORAMICA PROGETTO

### 1.1 Obiettivo
RECORP è il gestionale operativo centrale per l'azienda eventi. Sostituisce strumenti frammentati (Excel, WhatsApp, note sparse) con un sistema unificato che gestisce l'intero flusso operativo: dalla richiesta all'agibilità, dalla produzione alla fatturazione.

### 1.2 Filosofia
- **Sistema guida, umano decide**: il sistema propone, l'operatore conferma
- **Sviluppo incrementale**: prima il core (agibilità), poi espansione
- **Database completo da subito**: struttura pronta per tutte le fasi
- **Offline-first development**: sviluppo locale, deploy quando rodato

### 1.3 Fasi di Sviluppo

| Fase | Contenuto | Priorità |
|------|-----------|----------|
| **1** | Anagrafiche + Agibilità + Eventi base | 🔴 IMMEDIATA |
| **2** | Preventivi + Produzione/Dossier | 🟡 SUCCESSIVA |
| **3** | Staff + Magazzino | 🟡 SUCCESSIVA |
| **4** | App Mobile + Portale Clienti | 🟢 FUTURA |
| **5** | KPI + Automazioni + Integrazioni | 🟢 FUTURA |

---

## 2. STACK TECNOLOGICO

### 2.1 Ambiente di Sviluppo

| Componente | Tecnologia | Note |
|------------|------------|------|
| **IDE** | Visual Studio Code | - |
| **OS** | Windows | - |
| **Percorso progetto** | `C:\Users\utente\OneDrive - OKL SRL\PROGETTI\RECORP` | Sincronizzato OneDrive |

### 2.2 Stack Applicativo

| Componente | Locale | Produzione |
|------------|--------|------------|
| **Framework** | Next.js 14+ (App Router) | Next.js (Vercel o VPS) |
| **Linguaggio** | TypeScript | TypeScript |
| **Database** | PostgreSQL (Docker) | Supabase PostgreSQL |
| **ORM** | Prisma | Prisma |
| **Auth** | JWT semplice | Supabase Auth |
| **Storage** | Cartella locale | Supabase Storage |
| **Styling** | Tailwind CSS | Tailwind CSS |
| **Validazione** | Zod | Zod |
| **Date** | date-fns | date-fns |
| **Icone** | Lucide React | Lucide React |
| **PDF** | @react-pdf/renderer | @react-pdf/renderer |
| **XML** | fast-xml-parser | fast-xml-parser |

### 2.3 Dipendenze NPM

```json
{
  "dependencies": {
    "next": "^14.x",
    "@prisma/client": "^5.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x",
    "@react-pdf/renderer": "^3.x",
    "fast-xml-parser": "^4.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x"
  }
}
```

---

## 3. ARCHITETTURA

### 3.1 Struttura Directory

```
RECORP/
├── prisma/
│   └── schema.prisma              # Schema database completo
├── public/                         # Asset statici
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout root
│   │   ├── page.tsx               # Homepage/redirect
│   │   ├── globals.css            # Stili globali
│   │   ├── api/
│   │   │   ├── artisti/route.ts
│   │   │   ├── locali/route.ts
│   │   │   ├── eventi/route.ts
│   │   │   ├── agibilita/
│   │   │   │   ├── route.ts
│   │   │   │   ├── xml/route.ts
│   │   │   │   └── pdf/route.ts
│   │   │   └── upload/route.ts
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── artisti/
│   │       ├── locali/
│   │       ├── eventi/
│   │       └── agibilita/
│   ├── components/
│   │   ├── ui/                    # Componenti base riutilizzabili
│   │   ├── layout/                # Sidebar, Header, Navbar
│   │   ├── artisti/
│   │   ├── locali/
│   │   ├── eventi/
│   │   └── agibilita/
│   ├── lib/
│   │   ├── db.ts                  # Client Prisma
│   │   ├── utils.ts               # Utility generiche
│   │   ├── codice-fiscale.ts      # Validazione/calcolo CF
│   │   ├── inps-xml.ts            # Generatore XML INPS
│   │   └── pdf-generator.ts       # Generatore PDF
│   └── types/
│       └── index.ts               # Tipi TypeScript
├── .env.local                      # Variabili ambiente locale
├── .env.example                    # Template variabili
├── .gitignore
└── CAPITOLATO_TECNICO.md
```

### 3.2 Pattern Architetturali

- **App Router** (Next.js 14): routing file-based con layout annidati
- **Route Groups**: `(auth)` e `(dashboard)` per layout separati
- **API Routes**: endpoint REST in `/api`
- **Server Components**: default, Client Components solo dove necessario
- **Prisma Client**: singleton per connessione DB

---

## 4. SCHEMA DATABASE

### 4.1 Diagramma Entità-Relazioni (Fase 1)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   ARTISTA   │       │   EVENTO    │       │   LOCALE    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │───┐   │ id          │   ┌───│ id          │
│ nome        │   │   │ data        │   │   │ nome        │
│ cognome     │   │   │ compenso    │   │   │ ragioneSoc  │
│ cf          │   └──>│ artistaId   │   │   │ piva        │
│ piva        │       │ localeId    │<──┘   │ indirizzo   │
│ email       │       │ stato       │       │ rischio     │
│ telefono    │       │ note        │       │ ...         │
│ ...         │       │ ...         │       └─────────────┘
└─────────────┘       └──────┬──────┘
                             │
                             │ 1:N
                             ▼
                      ┌─────────────┐
                      │  AGIBILITA  │
                      ├─────────────┤
                      │ id          │
                      │ eventoId    │
                      │ stato       │
                      │ xmlGenerato │
                      │ ricevutaINPS│
                      │ pdfArtista  │
                      │ ...         │
                      └─────────────┘
```

### 4.2 Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum TipoArtista {
  CANTANTE
  DJ
  MUSICISTA
  PERFORMER
  TECNICO_AUDIO
  TECNICO_LUCI
  ALTRO
}

enum TipoEvento {
  CLUB
  APERITIVO
  PIAZZA
  MATRIMONIO
  PRIVATO
  FESTIVAL
  CORPORATE
  ALTRO
}

enum StatoEvento {
  BOZZA
  CONFERMATO
  IN_CORSO
  COMPLETATO
  ANNULLATO
}

enum StatoAgibilita {
  DA_CREARE
  DATI_INCOMPLETI
  PRONTA_INVIO
  INVIATA_INPS
  RICEVUTA_CARICATA
  COMPLETATA
  ERRORE
}

enum StatoPagamentoArtista {
  DA_PAGARE
  IN_ATTESA_INCASSO
  PAGATO
  ANTICIPATO
}

enum TipoPagamentoArtista {
  STANDARD_15GG
  ANTICIPATO
  DOPO_INCASSO
}

enum RischioLocale {
  BASSO
  MEDIO
  ALTO
  BLOCCATO
}

enum TipoCollaboratore {
  INTERNO
  ESTERNO
  OCCASIONALE
  PIVA
}

// ============================================
// MODELLI FASE 1 - CORE
// ============================================

model Artista {
  id                    String    @id @default(cuid())
  
  // Anagrafica
  nome                  String
  cognome               String
  nomeDarte             String?
  codiceFiscale         String    @unique
  partitaIva            String?
  
  // Contatti
  email                 String?
  telefono              String?
  telefonoSecondario    String?
  
  // Indirizzo residenza
  indirizzo             String?
  cap                   String?
  citta                 String?
  provincia             String?
  
  // Dati professionali
  tipoArtista           TipoArtista @default(ALTRO)
  tipiEvento            TipoEvento[]
  cachetBase            Decimal?  @db.Decimal(10, 2)
  capacitaMicrofono     Boolean   @default(false)
  stileMusicale         String?
  
  // Documenti
  documentoIdentita     String?   // Path file
  iban                  String?
  
  // Pagamenti
  tipoPagamento         TipoPagamentoArtista @default(STANDARD_15GG)
  
  // Note
  note                  String?
  noteInterne           String?
  
  // Timestamp
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relazioni
  eventi                Evento[]
  agibilita             Agibilita[]
  
  @@index([codiceFiscale])
  @@index([cognome, nome])
}

model Locale {
  id                    String    @id @default(cuid())
  
  // Anagrafica
  nome                  String
  ragioneSociale        String?
  partitaIva            String?
  codiceFiscale         String?
  
  // Contatti
  email                 String?
  pec                   String?
  telefono              String?
  
  // Indirizzo sede legale
  indirizzoLegale       String?
  capLegale             String?
  cittaLegale           String?
  provinciaLegale       String?
  
  // Indirizzo evento (se diverso)
  indirizzoEvento       String?
  capEvento             String?
  cittaEvento           String?
  provinciaEvento       String?
  
  // Referente
  referenteNome         String?
  referenteTelefono     String?
  referenteEmail        String?
  
  // Classificazione
  tipoEvento            TipoEvento @default(ALTRO)
  rischio               RischioLocale @default(MEDIO)
  creditSafeScore       Int?
  creditSafeData        DateTime?
  
  // Condizioni
  iban                  String?
  giorniPagamento       Int       @default(30)
  
  // Note
  note                  String?
  noteInterne           String?
  
  // Timestamp
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relazioni
  eventi                Evento[]
  
  @@index([partitaIva])
  @@index([nome])
}

model Evento {
  id                    String    @id @default(cuid())
  
  // Riferimenti
  localeId              String
  locale                Locale    @relation(fields: [localeId], references: [id])
  artistaId             String?
  artista               Artista?  @relation(fields: [artistaId], references: [id])
  
  // Dettagli evento
  nome                  String?
  data                  DateTime
  oraInizio             DateTime?
  oraFine               DateTime?
  
  // Economica
  compensoLordo         Decimal?  @db.Decimal(10, 2)
  compensoNetto         Decimal?  @db.Decimal(10, 2)
  speseViaggio          Decimal?  @db.Decimal(10, 2)
  speseAlloggio         Decimal?  @db.Decimal(10, 2)
  
  // Stato
  stato                 StatoEvento @default(BOZZA)
  
  // Note
  note                  String?
  noteInterne           String?
  
  // Timestamp
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relazioni
  agibilita             Agibilita[]
  
  @@index([data])
  @@index([localeId])
  @@index([artistaId])
  @@index([stato])
}

model Agibilita {
  id                    String    @id @default(cuid())
  
  // Riferimenti
  eventoId              String
  evento                Evento    @relation(fields: [eventoId], references: [id])
  artistaId             String
  artista               Artista   @relation(fields: [artistaId], references: [id])
  
  // Dati INPS
  tipoAttivita          String?   // Codice attività INPS
  compensoLordo         Decimal   @db.Decimal(10, 2)
  compensoNetto         Decimal?  @db.Decimal(10, 2)
  contributiINPS        Decimal?  @db.Decimal(10, 2)
  contributiAzienda     Decimal?  @db.Decimal(10, 2)
  
  // Stato workflow
  stato                 StatoAgibilita @default(DA_CREARE)
  
  // File generati
  xmlPath               String?
  xmlGeneratoAt         DateTime?
  ricevutaINPSPath      String?
  ricevutaCaricataAt    DateTime?
  pdfArtistaPath        String?
  pdfGeneratoAt         DateTime?
  
  // Pagamento artista
  statoPagamento        StatoPagamentoArtista @default(DA_PAGARE)
  dataPagamento         DateTime?
  metodoPagamento       String?
  
  // Invio comunicazioni
  inviatoArtista        Boolean   @default(false)
  inviatoArtistaAt      DateTime?
  inviatoLocale         Boolean   @default(false)
  inviatoLocaleAt       DateTime?
  
  // Note
  note                  String?
  errore                String?
  
  // Timestamp
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([eventoId])
  @@index([artistaId])
  @@index([stato])
  @@index([statoPagamento])
}

// ============================================
// MODELLI FASE 2 - PREVENTIVI & PRODUZIONE
// ============================================

model Preventivo {
  id                    String    @id @default(cuid())
  
  // Da implementare in Fase 2
  // ...
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Dossier {
  id                    String    @id @default(cuid())
  
  // Da implementare in Fase 2
  // ...
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// ============================================
// MODELLI FASE 3 - STAFF & MAGAZZINO
// ============================================

model Staff {
  id                    String    @id @default(cuid())
  
  // Anagrafica
  nome                  String
  cognome               String
  codiceFiscale         String    @unique
  email                 String?
  telefono              String?
  
  // Tipo
  tipo                  TipoCollaboratore @default(ESTERNO)
  
  // Da espandere in Fase 3
  // ...
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Materiale {
  id                    String    @id @default(cuid())
  
  // Da implementare in Fase 3
  // ...
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// ============================================
// MODELLI SISTEMA
// ============================================

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String    // Hash bcrypt
  nome                  String
  ruolo                 String    @default("operatore")
  attivo                Boolean   @default(true)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([email])
}
```

---

## 5. MODULI FASE 1

### 5.1 Modulo Artisti

#### Funzionalità
- Lista artisti con ricerca e filtri
- Creazione nuovo artista
- Modifica artista esistente
- Validazione codice fiscale (algoritmo italiano)
- Upload documento identità

#### Campi obbligatori
- Nome
- Cognome
- Codice Fiscale (validato)

#### Campi opzionali ma importanti
- Nome d'arte
- Email
- Telefono
- IBAN (per pagamenti)
- Tipo artista
- Cachet base

#### API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/artisti` | Lista artisti (con filtri) |
| GET | `/api/artisti/[id]` | Dettaglio artista |
| POST | `/api/artisti` | Crea artista |
| PUT | `/api/artisti/[id]` | Modifica artista |
| DELETE | `/api/artisti/[id]` | Elimina artista |

---

### 5.2 Modulo Locali

#### Funzionalità
- Lista locali con ricerca e filtri
- Creazione nuovo locale
- Modifica locale esistente
- Indicatore rischio (manuale o da CreditSafe)
- Gestione referenti

#### Campi obbligatori
- Nome locale

#### Campi opzionali ma importanti
- Ragione sociale
- Partita IVA
- Indirizzo evento
- Referente
- Livello rischio

#### API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/locali` | Lista locali (con filtri) |
| GET | `/api/locali/[id]` | Dettaglio locale |
| POST | `/api/locali` | Crea locale |
| PUT | `/api/locali/[id]` | Modifica locale |
| DELETE | `/api/locali/[id]` | Elimina locale |

---

### 5.3 Modulo Eventi

#### Funzionalità
- Lista eventi con filtri (data, stato, locale, artista)
- Creazione evento (associazione locale + artista)
- Modifica evento
- Cambio stato evento
- Vista calendario (futura)

#### Campi obbligatori
- Data
- Locale

#### Campi opzionali
- Artista (può essere evento senza artista)
- Compenso lordo/netto
- Orari

#### Stati Evento
1. **BOZZA**: evento in definizione
2. **CONFERMATO**: evento confermato dal cliente
3. **IN_CORSO**: evento in svolgimento
4. **COMPLETATO**: evento concluso
5. **ANNULLATO**: evento cancellato

#### API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/eventi` | Lista eventi (con filtri) |
| GET | `/api/eventi/[id]` | Dettaglio evento |
| POST | `/api/eventi` | Crea evento |
| PUT | `/api/eventi/[id]` | Modifica evento |
| DELETE | `/api/eventi/[id]` | Elimina evento |

---

### 5.4 Modulo Agibilità (CORE)

#### Workflow Completo

```
┌─────────────────┐
│  RICHIESTA      │  ← Da locale o artista (WhatsApp)
└────────┬────────┘
         ▼
┌─────────────────┐
│  CREA EVENTO    │  ← Se non esiste
└────────┬────────┘
         ▼
┌─────────────────┐
│ CREA AGIBILITÀ  │  ← Associa artista + evento
└────────┬────────┘
         ▼
┌─────────────────┐
│ RACCOGLI DATI   │  ← Semi-automatico da anagrafiche
└────────┬────────┘
         ▼
┌─────────────────┐
│  GENERA XML     │  ← Formato INPS/ENPALS
└────────┬────────┘
         ▼
┌─────────────────┐
│ COMPILA MANUALE │  ← Sul sito INPS ufficiale
│    SU INPS      │
└────────┬────────┘
         ▼
┌─────────────────┐
│CARICA RICEVUTA  │  ← Upload PDF da INPS
└────────┬────────┘
         ▼
┌─────────────────┐
│  GENERA PDF     │  ← Comunicazione per artista
│  INTERNO        │
└────────┬────────┘
         ▼
┌─────────────────┐
│ INVIA COMUNIC.  │  ← Artista e/o Locale
└────────┬────────┘
         ▼
┌─────────────────┐
│  PAGAMENTO      │  ← Gestione pagamento artista
│   ARTISTA       │
└─────────────────┘
```

#### Stati Agibilità
1. **DA_CREARE**: richiesta ricevuta, agibilità da creare
2. **DATI_INCOMPLETI**: mancano dati artista o evento
3. **PRONTA_INVIO**: XML generato, pronta per invio INPS
4. **INVIATA_INPS**: inviata sul portale INPS
5. **RICEVUTA_CARICATA**: ricevuta INPS caricata
6. **COMPLETATA**: processo completato
7. **ERRORE**: errore nel processo

#### Logiche Pagamento Artista

| Tipo Artista | Tipo Locale | Azione |
|--------------|-------------|--------|
| Standard | Qualsiasi | Paga dopo 15 giorni |
| Esigente | Qualsiasi | Paga anticipato |
| Qualsiasi | Rischioso | Paga dopo incasso locale |

#### API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/agibilita` | Lista agibilità (con filtri) |
| GET | `/api/agibilita/[id]` | Dettaglio agibilità |
| POST | `/api/agibilita` | Crea agibilità |
| PUT | `/api/agibilita/[id]` | Modifica agibilità |
| POST | `/api/agibilita/xml` | Genera XML INPS |
| POST | `/api/agibilita/pdf` | Genera PDF interno |
| POST | `/api/upload` | Upload ricevuta INPS |

---

## 6. GENERAZIONE XML INPS

### 6.1 Struttura XML

Il file XML per INPS deve seguire lo schema ufficiale ENPALS. Campi principali:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Comunicazione>
  <Mittente>
    <CodiceFiscale>...</CodiceFiscale>
    <Denominazione>OKL SRL</Denominazione>
  </Mittente>
  <Lavoratore>
    <CodiceFiscale>...</CodiceFiscale>
    <Cognome>...</Cognome>
    <Nome>...</Nome>
    <DataNascita>...</DataNascita>
    <ComuneNascita>...</ComuneNascita>
  </Lavoratore>
  <Prestazione>
    <DataInizio>...</DataInizio>
    <DataFine>...</DataFine>
    <LuogoPrestazione>...</LuogoPrestazione>
    <TipoAttivita>...</TipoAttivita>
    <CompensoPrevisto>...</CompensoPrevisto>
  </Prestazione>
</Comunicazione>
```

### 6.2 Libreria Generazione

File: `src/lib/inps-xml.ts`

```typescript
import { XMLBuilder } from 'fast-xml-parser';

interface DatiAgibilita {
  artista: {
    codiceFiscale: string;
    cognome: string;
    nome: string;
    dataNascita: Date;
    comuneNascita: string;
  };
  evento: {
    dataInizio: Date;
    dataFine: Date;
    luogo: string;
    tipoAttivita: string;
    compenso: number;
  };
}

export function generaXMLINPS(dati: DatiAgibilita): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    declaration: {
      encoding: 'UTF-8',
      version: '1.0'
    }
  });

  const xmlObj = {
    Comunicazione: {
      Mittente: {
        CodiceFiscale: process.env.AZIENDA_CF,
        Denominazione: process.env.AZIENDA_NOME
      },
      Lavoratore: {
        CodiceFiscale: dati.artista.codiceFiscale,
        Cognome: dati.artista.cognome,
        Nome: dati.artista.nome,
        DataNascita: formatDate(dati.artista.dataNascita),
        ComuneNascita: dati.artista.comuneNascita
      },
      Prestazione: {
        DataInizio: formatDate(dati.evento.dataInizio),
        DataFine: formatDate(dati.evento.dataFine),
        LuogoPrestazione: dati.evento.luogo,
        TipoAttivita: dati.evento.tipoAttivita,
        CompensoPrevisto: dati.evento.compenso.toFixed(2)
      }
    }
  };

  return builder.build(xmlObj);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

---

## 7. VALIDAZIONE CODICE FISCALE

### 7.1 Algoritmo

File: `src/lib/codice-fiscale.ts`

```typescript
const MESI = 'ABCDEHLMPRST';
const DISPARI = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};
const PARI = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};
const CONTROLLO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function validaCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  
  cf = cf.toUpperCase();
  
  // Pattern base
  const pattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!pattern.test(cf)) return false;
  
  // Calcolo carattere di controllo
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const char = cf[i];
    somma += (i % 2 === 0) ? DISPARI[char] : PARI[char];
  }
  
  const controlloCalcolato = CONTROLLO[somma % 26];
  return cf[15] === controlloCalcolato;
}

export function estraiDatiDaCF(cf: string): {
  sesso: 'M' | 'F';
  dataNascita: Date;
  annoNascita: number;
  meseNascita: number;
  giornoNascita: number;
} | null {
  if (!validaCodiceFiscale(cf)) return null;
  
  cf = cf.toUpperCase();
  
  const anno = parseInt(cf.substring(6, 8));
  const annoCompleto = anno > 50 ? 1900 + anno : 2000 + anno;
  const mese = MESI.indexOf(cf[8]) + 1;
  let giorno = parseInt(cf.substring(9, 11));
  const sesso = giorno > 40 ? 'F' : 'M';
  if (giorno > 40) giorno -= 40;
  
  return {
    sesso,
    dataNascita: new Date(annoCompleto, mese - 1, giorno),
    annoNascita: annoCompleto,
    meseNascita: mese,
    giornoNascita: giorno
  };
}
```

---

## 8. GENERAZIONE PDF

### 8.1 PDF Comunicazione Artista

File: `src/lib/pdf-generator.ts`

```typescript
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  section: {
    marginBottom: 15
  },
  label: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  value: {
    fontSize: 12
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10
  },
  col: {
    flex: 1
  }
});

interface PDFArtistaData {
  artista: {
    nome: string;
    cognome: string;
    codiceFiscale: string;
  };
  evento: {
    nome: string;
    data: Date;
    luogo: string;
  };
  agibilita: {
    compensoLordo: number;
    compensoNetto: number;
    contributi: number;
  };
}

export async function generaPDFArtista(data: PDFArtistaData): Promise<Buffer> {
  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Comunicazione Agibilità</Text>
          <Text>OKL SRL - Servizi per lo Spettacolo</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>ARTISTA</Text>
          <Text style={styles.value}>
            {data.artista.nome} {data.artista.cognome}
          </Text>
          <Text style={styles.value}>CF: {data.artista.codiceFiscale}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>EVENTO</Text>
          <Text style={styles.value}>{data.evento.nome}</Text>
          <Text style={styles.value}>
            Data: {data.evento.data.toLocaleDateString('it-IT')}
          </Text>
          <Text style={styles.value}>Luogo: {data.evento.luogo}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>DETTAGLIO ECONOMICO</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Lordo</Text>
              <Text style={styles.value}>€ {data.agibilita.compensoLordo.toFixed(2)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Contributi</Text>
              <Text style={styles.value}>€ {data.agibilita.contributi.toFixed(2)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Netto</Text>
              <Text style={styles.value}>€ {data.agibilita.compensoNetto.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );

  const buffer = await pdf(MyDocument).toBuffer();
  return buffer;
}
```

---

## 9. CONFIGURAZIONE AMBIENTE

### 9.1 Variabili d'Ambiente

File: `.env.example`

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/recorp"

# Azienda
AZIENDA_NOME="OKL SRL"
AZIENDA_CF="..."
AZIENDA_PIVA="..."

# Auth
JWT_SECRET="your-secret-key-min-32-chars"

# Storage (locale)
STORAGE_PATH="./uploads"

# Storage (produzione - Supabase)
# SUPABASE_URL="https://xxx.supabase.co"
# SUPABASE_ANON_KEY="xxx"
# SUPABASE_SERVICE_KEY="xxx"
```

### 9.2 Docker PostgreSQL

File: `docker-compose.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: recorp_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: recorp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Comandi:
```bash
# Avvia database
docker-compose up -d

# Ferma database
docker-compose down

# Reset completo (cancella dati)
docker-compose down -v
```

---

## 10. COMANDI SVILUPPO

### 10.1 Setup Iniziale

```bash
# Installa dipendenze
npm install

# Genera client Prisma
npx prisma generate

# Crea database e tabelle
npx prisma db push

# (Opzionale) Popola dati test
npx prisma db seed
```

### 10.2 Sviluppo Quotidiano

```bash
# Avvia server sviluppo
npm run dev

# Apri Prisma Studio (GUI database)
npx prisma studio

# Genera migrazione dopo modifica schema
npx prisma migrate dev --name nome_migrazione

# Reset database (cancella tutto)
npx prisma migrate reset
```

### 10.3 Build e Test

```bash
# Build produzione
npm run build

# Avvia in produzione
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 11. SICUREZZA

### 11.1 Autenticazione

- Hash password con bcrypt (cost factor 12)
- JWT per sessioni (scadenza 24h)
- Refresh token (scadenza 7 giorni)
- Rate limiting su login (5 tentativi / 15 min)

### 11.2 Autorizzazione

- Ruoli: `admin`, `operatore`
- Middleware verifica JWT su tutte le API
- Controllo ruolo per operazioni sensibili

### 11.3 Validazione

- Zod per validazione input su tutte le API
- Sanitizzazione stringhe
- Escape HTML in output

### 11.4 File Upload

- Whitelist estensioni (pdf, jpg, png)
- Limite dimensione (10MB)
- Scan antivirus (produzione)
- Storage isolato

---

## 12. DEPLOYMENT

### 12.1 Checklist Pre-Deploy

- [ ] Variabili ambiente produzione configurate
- [ ] Database Supabase creato
- [ ] Migrazioni eseguite su produzione
- [ ] Auth Supabase configurata
- [ ] Storage Supabase configurato
- [ ] Domini e SSL configurati
- [ ] Backup automatici attivi

### 12.2 Piattaforme Consigliate

| Componente | Opzione 1 | Opzione 2 |
|------------|-----------|-----------|
| **Web App** | Vercel | VPS (Hetzner) |
| **Database** | Supabase | Supabase |
| **Storage** | Supabase Storage | Supabase Storage |
| **Domini** | Cloudflare | Cloudflare |

---

## 13. ROADMAP

### Fase 1 - MVP (4-6 settimane)
- [x] Setup progetto
- [ ] Schema database
- [ ] CRUD Artisti
- [ ] CRUD Locali
- [ ] CRUD Eventi
- [ ] Modulo Agibilità completo
- [ ] Generazione XML
- [ ] Upload ricevute
- [ ] Generazione PDF
- [ ] Dashboard base

### Fase 2 - Preventivi (3-4 settimane)
- [ ] CRUD Preventivi
- [ ] Logiche calcolo
- [ ] Template PDF preventivo
- [ ] Stato preventivi

### Fase 3 - Produzione (4-5 settimane)
- [ ] Dossier evento
- [ ] Gestione documenti
- [ ] Timeline evento
- [ ] Schemi tecnici

### Fase 4 - Staff & Magazzino (4-5 settimane)
- [ ] CRUD Staff
- [ ] Competenze e livelli
- [ ] Assegnazione staff
- [ ] CRUD Materiali
- [ ] Check-in/out
- [ ] Pacchetti preconfigurati

### Fase 5 - App Mobile (6-8 settimane)
- [ ] Setup Expo
- [ ] Auth mobile
- [ ] Notifiche push
- [ ] Vista eventi assegnati
- [ ] Conferma presenza
- [ ] Dossier evento mobile

---

## APPENDICE A - Convenzioni Codice

### Naming

- File: `kebab-case.ts`
- Componenti React: `PascalCase.tsx`
- Funzioni: `camelCase`
- Costanti: `UPPER_SNAKE_CASE`
- Tipi/Interface: `PascalCase`

### Import Order

1. React/Next
2. Librerie terze parti
3. Componenti locali
4. Utility/Lib
5. Types
6. Styles

### Commit Messages

```
feat: aggiunta nuova funzionalità
fix: correzione bug
refactor: refactoring codice
docs: aggiornamento documentazione
style: formattazione
test: aggiunta test
chore: manutenzione
```

---

## APPENDICE B - Glossario

| Termine | Descrizione |
|---------|-------------|
| **Agibilità** | Certificazione INPS/ENPALS per prestazioni artistiche |
| **Cachet** | Compenso dell'artista |
| **ENPALS** | Ex ente previdenza lavoratori spettacolo (ora INPS) |
| **Dossier** | Documento completo di produzione evento |
| **Format** | Tipo di evento standardizzato/pacchettizzato |

---

**FINE DOCUMENTO**

*Versione 1.0 - Novembre 2024*
*OKL SRL - Tutti i diritti riservati*