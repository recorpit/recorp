# RECORP v3.7 - Capitolato Tecnico Generale

## Sistema di Gestione Agibilità e Artisti per il Settore Entertainment

**Versione:** 3.7  
**Data:** Novembre 2025  
**Sviluppatore:** OKL SRL  

---

## INDICE

1. [Panoramica Sistema](#1-panoramica-sistema)
2. [Requisiti di Sistema](#2-requisiti-di-sistema)
3. [Installazione da Zero](#3-installazione-da-zero)
4. [Configurazione](#4-configurazione)
5. [Struttura del Progetto](#5-struttura-del-progetto)
6. [Moduli Funzionali](#6-moduli-funzionali)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Deployment Produzione](#9-deployment-produzione)
10. [Troubleshooting](#10-troubleshooting)
11. [Manutenzione](#11-manutenzione)

---

## 1. PANORAMICA SISTEMA

### 1.1 Descrizione
RECORP è un sistema gestionale web-based progettato per agenzie di spettacolo italiane. Gestisce l'intero ciclo di vita delle agibilità INPS/ENPALS, dalla registrazione artisti fino alla generazione XML per l'invio telematico.

### 1.2 Stack Tecnologico

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Framework | Next.js (App Router) | 14.x |
| Linguaggio | TypeScript | 5.x |
| Database | SQLite (dev) / PostgreSQL (prod) | - |
| ORM | Prisma | 5.x |
| UI | Tailwind CSS | 3.x |
| Grafici | Recharts | 2.x |
| Icone | Lucide React | 0.x |
| PDF | jsPDF + html2canvas | - |
| Excel | xlsx (SheetJS) | - |
| Email | Nodemailer | 6.x |

### 1.3 Funzionalità Principali

- ✅ Gestione Anagrafiche (Artisti, Committenti, Locali)
- ✅ Creazione e Gestione Agibilità
- ✅ Generazione XML INPS/ENPALS
- ✅ Pagamenti Prestazioni Occasionali
- ✅ Import/Export Excel Massivo
- ✅ Report & KPI con Dashboard Analitica
- ✅ Archivio Documenti
- ✅ Area Impostazioni Completa
- ✅ Firma Digitale e PDF Ricevute

---

## 2. REQUISITI DI SISTEMA

### 2.1 Hardware Minimo

| Componente | Requisito Minimo | Raccomandato |
|------------|------------------|--------------|
| CPU | 2 core | 4+ core |
| RAM | 4 GB | 8+ GB |
| Storage | 10 GB SSD | 50+ GB SSD |
| Rete | 10 Mbps | 100+ Mbps |

### 2.2 Software Prerequisiti

| Software | Versione Minima | Download |
|----------|-----------------|----------|
| Node.js | 18.17.0 | https://nodejs.org |
| npm | 9.0.0 | (incluso con Node.js) |
| Git | 2.x | https://git-scm.com |

### 2.3 Sistemi Operativi Supportati

- Windows 10/11 (x64)
- macOS 12+ (Intel/Apple Silicon)
- Ubuntu 20.04+ / Debian 11+
- Qualsiasi distribuzione Linux con glibc 2.31+

### 2.4 Browser Supportati

- Google Chrome 90+
- Mozilla Firefox 90+
- Microsoft Edge 90+
- Safari 14+

---

## 3. INSTALLAZIONE DA ZERO

### 3.1 Installazione Node.js

#### Windows
```powershell
# Scaricare installer da https://nodejs.org (versione LTS)
# Oppure con winget:
winget install OpenJS.NodeJS.LTS
```

#### macOS
```bash
# Con Homebrew
brew install node@20

# Oppure scaricare da https://nodejs.org
```

#### Ubuntu/Debian
```bash
# Aggiungere repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Installare Node.js
sudo apt-get install -y nodejs

# Verificare installazione
node --version
npm --version
```

### 3.2 Clonazione/Download Progetto

```bash
# Se da repository Git
git clone https://github.com/[repo]/recorp.git
cd recorp

# Oppure estrarre archivio ZIP nella cartella desiderata
unzip recorp.zip -d recorp
cd recorp
```

### 3.3 Installazione Dipendenze

```bash
# Installare tutte le dipendenze
npm install

# Se ci sono problemi di permessi (Linux/macOS)
sudo npm install --unsafe-perm

# Dipendenze specifiche se mancanti
npm install recharts xlsx jspdf html2canvas nodemailer
```

### 3.4 Setup Database

#### Opzione A: SQLite (Sviluppo - Default)

```bash
# Generare client Prisma
npx prisma generate

# Creare database e applicare schema
npx prisma migrate dev --name init

# (Opzionale) Popolare con dati demo
npx prisma db seed
```

#### Opzione B: PostgreSQL (Produzione)

```bash
# 1. Installare PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql@15
# Ubuntu: sudo apt install postgresql postgresql-contrib

# 2. Creare database
sudo -u postgres psql
CREATE DATABASE recorp;
CREATE USER recorp_user WITH ENCRYPTED PASSWORD 'password_sicura';
GRANT ALL PRIVILEGES ON DATABASE recorp TO recorp_user;
\q

# 3. Aggiornare DATABASE_URL in .env (vedi sezione 4)

# 4. Applicare migrazioni
npx prisma migrate deploy
```

### 3.5 Configurazione Ambiente

```bash
# Copiare file environment di esempio
cp .env.example .env

# Modificare .env con i propri valori
# (vedi sezione 4 per dettagli)
```

### 3.6 Avvio Sistema

```bash
# Modalità sviluppo (con hot-reload)
npm run dev

# Il sistema sarà disponibile su:
# http://localhost:3000
```

### 3.7 Verifica Installazione

1. Aprire browser su `http://localhost:3000`
2. Verificare che la dashboard sia visibile
3. Provare a creare un artista di test
4. Verificare che non ci siano errori in console (F12)

---

## 4. CONFIGURAZIONE

### 4.1 File .env

Creare file `.env` nella root del progetto:

```env
# ============================================
# DATABASE
# ============================================

# SQLite (sviluppo)
DATABASE_URL="file:./dev.db"

# PostgreSQL (produzione)
# DATABASE_URL="postgresql://user:password@localhost:5432/recorp?schema=public"

# ============================================
# APPLICAZIONE
# ============================================

# URL base applicazione
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Ambiente (development | production)
NODE_ENV="development"

# Secret per sessioni (generare con: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# ============================================
# EMAIL (SMTP)
# ============================================

SMTP_HOST="smtp.tuoserver.it"
SMTP_PORT="587"
SMTP_USER="noreply@tuodominio.it"
SMTP_PASSWORD="password_smtp"
SMTP_FROM="RECORP <noreply@tuodominio.it>"

# ============================================
# STORAGE
# ============================================

# Tutti i file vengono salvati in public/uploads/
# Struttura automatica:
# - public/uploads/documenti/{artistaId}/ - documenti identità
# - public/uploads/locali/{slug}/agibilita/ - PDF agibilità
# - public/uploads/archivio/{categoria}/{anno}/ - archivio generale

# Limite upload file in MB
MAX_UPLOAD_SIZE="50"

# ============================================
# INPS/ENPALS (Produzione)
# ============================================

# Credenziali accesso INPS (se integrazione diretta)
INPS_CODICE_FISCALE_AZIENDA=""
INPS_MATRICOLA=""
INPS_PIN=""

# ============================================
# OPZIONALI
# ============================================

# Limite upload file (in MB)
MAX_UPLOAD_SIZE="50"

# Timezone
TZ="Europe/Rome"
```

### 4.2 Configurazione Prisma

File `prisma/schema.prisma` - header:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Cambiare in "postgresql" per produzione
  url      = env("DATABASE_URL")
}
```

### 4.3 Configurazione Next.js

File `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Abilita standalone per Docker
  output: 'standalone',
  
  // Configurazione immagini
  images: {
    domains: ['localhost'],
  },
  
  // Headers sicurezza
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 5. STRUTTURA DEL PROGETTO

```
recorp/
├── prisma/
│   ├── schema.prisma           # Schema database completo
│   ├── migrations/             # Migrazioni database
│   └── seed.ts                 # Dati iniziali (opzionale)
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Pagine protette
│   │   │   ├── page.tsx        # Dashboard principale
│   │   │   ├── artisti/        # Gestione artisti
│   │   │   ├── committenti/    # Gestione committenti
│   │   │   ├── locali/         # Gestione locali
│   │   │   ├── agibilita/      # Gestione agibilità
│   │   │   ├── pagamenti/      # Pagamenti e prestazioni
│   │   │   ├── report/         # Report e KPI
│   │   │   ├── documenti/      # Archivio documenti
│   │   │   └── impostazioni/   # Area impostazioni
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── artisti/
│   │   │   ├── committenti/
│   │   │   ├── locali/
│   │   │   ├── agibilita/
│   │   │   ├── pagamenti/
│   │   │   ├── report/
│   │   │   ├── documenti/
│   │   │   └── impostazioni/
│   │   │
│   │   ├── layout.tsx          # Layout principale
│   │   └── globals.css         # Stili globali
│   │
│   ├── components/
│   │   ├── Sidebar.tsx         # Menu laterale
│   │   ├── Header.tsx          # Header applicazione
│   │   └── ...                 # Altri componenti
│   │
│   └── lib/
│       ├── db.ts               # Client Prisma
│       ├── utils.ts            # Utility functions
│       └── codiceFiscale.ts    # Validazione CF
│
├── public/                     # Asset statici e file generati
│   └── uploads/
│       ├── documenti/          # Documenti identità artisti
│       │   └── {artistaId}/    # Cartella per artista
│       ├── locali/             # File per locale
│       │   └── {localeSlug}/
│       │       └── agibilita/  # PDF agibilità per locale
│       ├── committenti/        # File per committente  
│       │   └── {committenteSlug}/
│       │       └── agibilita/  # Copia PDF agibilità
│       ├── archivio/           # Archivio documenti generale
│       │   ├── artista/
│       │   │   └── 2025/
│       │   ├── committente/
│       │   │   └── 2025/
│       │   ├── fattura/
│       │   │   └── 2025/
│       │   └── altro/
│       │       └── 2025/
│       └── ricevute/           # Ricevute pagamento artisti
│           └── {artistaId}/
│               └── {mese}/
│
├── .env                        # Variabili ambiente
├── .env.example                # Template variabili
├── package.json                # Dipendenze npm
├── tsconfig.json               # Configurazione TypeScript
├── tailwind.config.ts          # Configurazione Tailwind
└── next.config.js              # Configurazione Next.js
```

---

## 6. MODULI FUNZIONALI

### 6.1 Anagrafiche

#### Artisti (`/artisti`)
- Registrazione completa con dati anagrafici italiani
- Validazione Codice Fiscale automatica
- Gestione documenti identità con scadenze
- Coordinate bancarie (IBAN, BIC)
- Codice Commercialista univoco auto-generato (formato 10001XXXXXX)
- Import/Export massivo Excel
- Filtri: iscritto, qualifica, ricerca

#### Committenti (`/committenti`)
- Ragione sociale e dati fiscali
- P.IVA con validazione
- Flag "a rischio" per monitoraggio
- Storico agibilità collegate
- Import/Export massivo Excel

#### Locali (`/locali`)
- Nome e indirizzo completo
- Coordinate GPS (opzionale)
- Capienza e tipologia
- Collegamento automatico agibilità
- Import/Export massivo Excel

### 6.2 Agibilità (`/agibilita`)

#### Lista Agibilità
- Tabella con filtri avanzati (stato, data, committente)
- Codice progressivo automatico (AG-YYYY-NNN)
- Stati: BOZZA → DATI_INCOMPLETI → PRONTA → INVIATA_INPS → COMPLETATA
- Azioni rapide: modifica, duplica, elimina, genera XML

#### Nuova Agibilità (`/agibilita/nuova`)
- Wizard multi-step
- Selezione locale e committente
- Aggiunta multipla artisti con compensi
- Calcolo automatico ritenute e lordi
- Quota agenzia configurabile

#### Richieste Agibilità (`/agibilita/richieste`)
- Inbox richieste da committenti
- Approvazione/rifiuto con note
- Conversione automatica in agibilità

#### Generazione XML INPS
- Formato conforme specifiche INPS/ENPALS
- Validazione dati pre-invio
- Download file XML
- Storico generazioni

### 6.3 Pagamenti (`/pagamenti`)

#### Prestazioni Occasionali (`/pagamenti/occasionali`)
- Raggruppamento per artista
- Batch pagamento con selezione multipla
- Calcolo automatico netto/lordo/ritenuta
- Generazione ricevuta PDF con firma digitale
- Salvataggio PDF su disco
- Stati: DA_PAGARE → IN_ATTESA → PAGATA
- Invio email artista

#### Contratti / P.IVA (`/pagamenti/contratti`)
- Gestione pagamenti artisti con P.IVA
- Fatturazione separata

### 6.4 Report & KPI (`/report`)

#### Dashboard Principale
- KPI Economici: Fatturato, Cachet, Margine, Da Pagare
- KPI Operativi: Agibilità, Prestazioni, Artisti attivi
- Grafici Recharts: Andamento fatturato, Margine mensile, Distribuzione qualifiche
- Filtri periodo: Mese, Trimestre, Anno, Custom
- Confronto anno precedente

#### Classifiche (`/report/classifiche`)
- Top 10 Artisti per prestazioni/fatturato
- Top 10 Committenti per fatturato
- Top 10 Locali per eventi
- Export CSV

#### Alert (`/report/alert`)
- Committenti a rischio
- Documenti in scadenza (30 giorni)
- Agibilità da inviare
- Prestazioni da pagare

### 6.5 Documenti/Archivio (`/documenti`)

- Upload con categorizzazione automatica
- 9 Categorie: Artista, Committente, Locale, Agibilità, Fattura, Contratto, Ricevuta, Aziendale, Altro
- Collegamento a entità
- Ricerca full-text
- Vista griglia/lista
- Download diretto
- Statistiche per categoria

### 6.6 Impostazioni (`/impostazioni`)

#### Azienda
- Ragione sociale, P.IVA, indirizzo
- Dati legale rappresentante
- Logo aziendale
- Coordinate bancarie

#### Anagrafiche
- Qualifiche artisti predefinite
- Tipi documento
- Categorie committenti

#### Pagamenti
- Aliquota ritenuta default (23%)
- Quota agenzia default
- Metodi pagamento
- Scadenze default

#### INPS
- Codice fiscale azienda
- Matricola INPS
- Sede INPS competente

#### Sistema
- Backup database
- Log attività
- Preferenze UI

---

## 7. DATABASE SCHEMA

### 7.1 Modelli Principali

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Artista     │     │   Committente   │     │     Locale      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ nome            │     │ ragioneSociale  │     │ nome            │
│ cognome         │     │ partitaIva      │     │ indirizzo       │
│ codiceFiscale   │     │ codiceFiscale   │     │ citta           │
│ dataNascita     │     │ indirizzo       │     │ cap             │
│ qualifica       │     │ aRischio        │     │ provincia       │
│ iban            │     │ ...             │     │ ...             │
│ ...             │     └────────┬────────┘     └────────┬────────┘
└────────┬────────┘              │                       │
         │                       │                       │
         │              ┌────────┴───────────────────────┴────────┐
         │              │               Agibilita                  │
         │              ├──────────────────────────────────────────┤
         │              │ id                                       │
         │              │ codice (AG-2025-001)                     │
         │              │ localeId ─────────────────────────────►  │
         │              │ committenteId ────────────────────────►  │
         │              │ data                                     │
         │              │ stato (BOZZA|PRONTA|INVIATA_INPS|...)   │
         │              │ quotaAgenzia                             │
         │              │ totaleCompensiNetti                      │
         │              │ ...                                      │
         │              └────────────────────┬─────────────────────┘
         │                                   │
         │              ┌────────────────────┴─────────────────────┐
         │              │           ArtistaAgibilita               │
         └──────────────┤ (tabella ponte multi-artista)            │
                        ├──────────────────────────────────────────┤
                        │ id                                       │
                        │ agibilitaId ─────────────────────────►   │
                        │ artistaId ───────────────────────────►   │
                        │ compensoNetto                            │
                        │ compensoLordo                            │
                        │ ritenuta                                 │
                        │ statoPagamento (DA_PAGARE|PAGATA|...)    │
                        │ qualifica                                │
                        │ ...                                      │
                        └──────────────────────────────────────────┘
```

### 7.2 Enum Principali

```prisma
enum StatoAgibilita {
  BOZZA
  DATI_INCOMPLETI
  PRONTA
  INVIATA_INPS
  COMPLETATA
  ERRORE
}

enum StatoPagamentoArtista {
  DA_PAGARE
  IN_ATTESA
  PAGATA
  ANNULLATA
}

enum Qualifica {
  DJ
  VOCALIST
  MUSICISTA
  CANTANTE
  BALLERINO
  ATTORE
  INTRATTENITORE
  TECNICO_AUDIO
  TECNICO_LUCI
  ALTRO
}

enum TipoDocumento {
  CARTA_IDENTITA
  PASSAPORTO
  PATENTE
  PERMESSO_SOGGIORNO
  ALTRO
}

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

### 7.3 Comandi Prisma Utili

```bash
# Visualizzare schema
npx prisma studio

# Generare client dopo modifiche schema
npx prisma generate

# Creare nuova migrazione
npx prisma migrate dev --name nome_migrazione

# Applicare migrazioni in produzione
npx prisma migrate deploy

# Reset completo database (ATTENZIONE: cancella tutti i dati)
npx prisma migrate reset

# Seed dati iniziali
npx prisma db seed
```

---

## 8. API REFERENCE

### 8.1 Artisti

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/artisti` | Lista artisti (con filtri) |
| GET | `/api/artisti/[id]` | Singolo artista |
| POST | `/api/artisti` | Crea artista |
| PUT | `/api/artisti/[id]` | Aggiorna artista |
| DELETE | `/api/artisti/[id]` | Elimina artista |
| POST | `/api/artisti/import` | Import Excel massivo |
| GET | `/api/artisti/export` | Export Excel |

**Query params GET lista:**
- `search`: ricerca su nome/cognome/CF
- `iscritto`: true/false
- `qualifica`: enum Qualifica
- `limit`: numero risultati (default 50)
- `offset`: paginazione

### 8.2 Committenti

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/committenti` | Lista committenti |
| GET | `/api/committenti/[id]` | Singolo committente |
| POST | `/api/committenti` | Crea committente |
| PUT | `/api/committenti/[id]` | Aggiorna committente |
| DELETE | `/api/committenti/[id]` | Elimina committente |
| POST | `/api/committenti/import` | Import Excel |
| GET | `/api/committenti/export` | Export Excel |

### 8.3 Locali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/locali` | Lista locali |
| GET | `/api/locali/[id]` | Singolo locale |
| POST | `/api/locali` | Crea locale |
| PUT | `/api/locali/[id]` | Aggiorna locale |
| DELETE | `/api/locali/[id]` | Elimina locale |
| POST | `/api/locali/import` | Import Excel |
| GET | `/api/locali/export` | Export Excel |

### 8.4 Agibilità

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/agibilita` | Lista agibilità |
| GET | `/api/agibilita/[id]` | Singola agibilità |
| POST | `/api/agibilita` | Crea agibilità |
| PUT | `/api/agibilita/[id]` | Aggiorna agibilità |
| DELETE | `/api/agibilita/[id]` | Elimina agibilità |
| POST | `/api/agibilita/[id]/conferma` | Conferma agibilità |
| GET | `/api/agibilita/[id]/xml` | Genera XML INPS |
| POST | `/api/agibilita/[id]/invia` | Segna come inviata |

**Query params GET lista:**
- `stato`: enum StatoAgibilita
- `da`: data inizio (YYYY-MM-DD)
- `a`: data fine (YYYY-MM-DD)
- `committenteId`: filtro committente
- `localeId`: filtro locale

### 8.5 Pagamenti

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/pagamenti/occasionali` | Lista prestazioni raggruppate |
| GET | `/api/pagamenti/occasionali/artista/[id]` | Prestazioni singolo artista |
| POST | `/api/pagamenti/occasionali/batch` | Crea batch pagamento |
| PUT | `/api/pagamenti/occasionali/batch/[id]` | Aggiorna batch |
| POST | `/api/pagamenti/occasionali/batch/[id]/paga` | Esegui pagamento |
| GET | `/api/pagamenti/occasionali/batch/[id]/pdf` | Genera PDF ricevuta |
| POST | `/api/pagamenti/occasionali/batch/[id]/email` | Invia email artista |

### 8.6 Report

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/report/kpi` | KPI economici e operativi |
| GET | `/api/report/trend` | Dati trend per grafici |

**Query params KPI:**
- `da`: data inizio periodo
- `a`: data fine periodo

**Query params Trend:**
- `anno`: anno per dati mensili

### 8.7 Documenti

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/documenti` | Lista documenti |
| POST | `/api/documenti` | Upload documento |
| GET | `/api/documenti/[id]` | Metadati documento |
| PUT | `/api/documenti/[id]` | Aggiorna metadati |
| DELETE | `/api/documenti/[id]` | Elimina documento |
| GET | `/api/documenti/[id]/download` | Download file |

### 8.8 Impostazioni

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/impostazioni` | Tutte le impostazioni |
| GET | `/api/impostazioni/[chiave]` | Singola impostazione |
| PUT | `/api/impostazioni/[chiave]` | Aggiorna impostazione |
| POST | `/api/impostazioni/backup` | Esegui backup |

---

## 9. DEPLOYMENT PRODUZIONE

### 9.1 Build Produzione

```bash
# Build ottimizzata
npm run build

# Avvio produzione
npm start

# Oppure con PM2 per process management
npm install -g pm2
pm2 start npm --name "recorp" -- start
pm2 save
pm2 startup
```

### 9.2 Variabili Ambiente Produzione

```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@localhost:5432/recorp"
NEXT_PUBLIC_APP_URL="https://recorp.tuodominio.it"
NEXTAUTH_SECRET="chiave-segreta-molto-lunga-e-casuale"
```

### 9.3 Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name recorp.tuodominio.it;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name recorp.tuodominio.it;

    ssl_certificate /etc/letsencrypt/live/recorp.tuodominio.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recorp.tuodominio.it/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload file grandi
    client_max_body_size 50M;
}
```

### 9.4 Docker (Opzionale)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://recorp:password@db:5432/recorp
    depends_on:
      - db
    volumes:
      - ./public/uploads:/app/public/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=recorp
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=recorp
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 9.5 Certificato SSL con Let's Encrypt

```bash
# Installare Certbot
sudo apt install certbot python3-certbot-nginx

# Ottenere certificato
sudo certbot --nginx -d recorp.tuodominio.it

# Rinnovo automatico (già configurato da certbot)
sudo certbot renew --dry-run
```

---

## 10. TROUBLESHOOTING

### 10.1 Errori Comuni

#### "Module not found: Can't resolve 'recharts'"
```bash
npm install recharts
```

#### "PrismaClientInitializationError: Can't reach database server"
```bash
# Verificare DATABASE_URL in .env
# Per SQLite, assicurarsi che il path sia corretto
# Per PostgreSQL, verificare che il servizio sia attivo:
sudo systemctl status postgresql
```

#### "Invalid value for argument 'in'. Expected StatoAgibilita"
Verificare che i valori enum nel codice corrispondano esattamente a quelli in `schema.prisma`.

#### Build fallisce con errori TypeScript
```bash
# Rigenerare client Prisma
npx prisma generate

# Pulire cache Next.js
rm -rf .next
npm run build
```

#### Upload file fallisce
```bash
# Verificare permessi cartella uploads
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads  # Linux con Nginx
```

### 10.2 Log e Debug

```bash
# Visualizzare log applicazione
npm run dev 2>&1 | tee app.log

# Con PM2
pm2 logs recorp

# Query database diretto
npx prisma studio
```

### 10.3 Reset Database

```bash
# ATTENZIONE: cancella tutti i dati!

# SQLite
rm prisma/dev.db
npx prisma migrate dev

# PostgreSQL
npx prisma migrate reset
```

---

## 11. MANUTENZIONE

### 11.1 Backup Database

#### SQLite
```bash
# Copia semplice del file
cp prisma/dev.db backup/dev_$(date +%Y%m%d).db
```

#### PostgreSQL
```bash
# Dump completo
pg_dump -U recorp recorp > backup/recorp_$(date +%Y%m%d).sql

# Restore
psql -U recorp recorp < backup/recorp_20251126.sql
```

### 11.2 Aggiornamenti

```bash
# Backup prima di aggiornare
cp -r . ../recorp_backup_$(date +%Y%m%d)

# Pull ultime modifiche (se da Git)
git pull origin main

# Aggiornare dipendenze
npm install

# Applicare migrazioni database
npx prisma migrate deploy

# Rebuild
npm run build

# Riavvio
pm2 restart recorp
```

### 11.3 Monitoraggio

```bash
# Stato processo con PM2
pm2 status
pm2 monit

# Spazio disco
df -h

# Dimensione database e uploads
du -sh prisma/dev.db
du -sh public/uploads/
```

### 11.4 Pulizia Periodica

```bash
# Eliminare file temporanei Next.js
rm -rf .next/cache

# Comprimere archivio vecchio (esempio per anno 2024)
tar -czvf uploads_archivio_2024.tar.gz public/uploads/archivio/*/2024/
rm -rf public/uploads/archivio/*/2024/
```

---

## APPENDICE A - CHECKLIST INSTALLAZIONE

```
□ Node.js 18+ installato
□ npm funzionante
□ Progetto scaricato/clonato
□ npm install completato
□ File .env configurato
□ npx prisma generate eseguito
□ npx prisma migrate dev eseguito
□ Cartella public/uploads/ verificata (creata automaticamente)
□ npm run dev avviato
□ Browser aperto su localhost:3000
□ Dashboard visibile
□ Test creazione artista
□ Test creazione agibilità
□ Test upload documento
```

---

## APPENDICE B - DIPENDENZE PACKAGE.JSON

```json
{
  "name": "recorp",
  "version": "3.7.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "lucide-react": "^0.263.1",
    "next": "14.2.0",
    "nodemailer": "^6.9.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/nodemailer": "^6.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

---

## CONTATTI E SUPPORTO

**Sviluppato da:** OKL SRL  
**Sede:** Zanè (VI), Italia  

Per assistenza tecnica o personalizzazioni, contattare il team di sviluppo.

---

*Documento generato automaticamente - RECORP v3.7*
