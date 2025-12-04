-- =====================================================
-- MIGRATION: Modulo P.IVA e Full Time Completo
-- =====================================================
-- Eseguire su PostgreSQL/Railway
-- =====================================================

-- =====================================================
-- NUOVI ENUM
-- =====================================================

-- Stato fattura ricevuta da P.IVA
CREATE TYPE "StatoFatturaPIVA" AS ENUM (
  'DA_RICHIEDERE',      -- Compensi accumulati ma non ancora richiesta fattura
  'RICHIESTA_INVIATA',  -- Email inviata all'artista
  'FATTURA_RICEVUTA',   -- PDF caricato
  'INVIATA_CONSULENTE', -- Inviata al consulente
  'IN_DISTINTA',        -- Inserita in distinta pagamento
  'PAGATA'              -- Bonifico effettuato
);

-- Tipo di rimborso spesa
CREATE TYPE "TipoRimborsoSpesa" AS ENUM (
  'TRASFERTA_ITALIA',   -- Forfait trasferta
  'KM',                 -- Rimborso chilometrico
  'VITTO',              -- Pasti
  'ALLOGGIO',           -- Hotel
  'ALTRO'               -- Altro
);

-- Stato busta paga
CREATE TYPE "StatoBustaPaga" AS ENUM (
  'DA_ELABORARE',       -- Dati pronti per il consulente
  'INVIATA_CONSULENTE', -- Inviata al consulente
  'RICEVUTA',           -- Busta paga ricevuta dal consulente
  'PAGATA'              -- Stipendio pagato
);

-- =====================================================
-- TABELLA: RaggruppamentoCompensoPIVA
-- Raggruppa i compensi di un artista P.IVA per periodo
-- =====================================================

CREATE TABLE "RaggruppamentoCompensoPIVA" (
  "id" TEXT NOT NULL,
  "artistaId" TEXT NOT NULL,
  "stato" "StatoFatturaPIVA" NOT NULL DEFAULT 'DA_RICHIEDERE',
  
  -- Periodo di riferimento
  "periodoInizio" TIMESTAMP(3) NOT NULL,
  "periodoFine" TIMESTAMP(3) NOT NULL,
  
  -- Totali calcolati
  "totaleNetto" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totaleRitenuta4" DECIMAL(10,2) NOT NULL DEFAULT 0,  -- Ritenuta 4% se applicabile
  "totaleImponibile" DECIMAL(10,2) NOT NULL DEFAULT 0, -- Netto + Ritenuta
  "numeroAgibilita" INTEGER NOT NULL DEFAULT 0,
  
  -- Richiesta fattura
  "dataRichiestaFattura" TIMESTAMP(3),
  "emailRichiestaInviata" BOOLEAN NOT NULL DEFAULT false,
  
  -- Fattura ricevuta
  "numeroFattura" TEXT,
  "dataFattura" TIMESTAMP(3),
  "pdfFatturaPath" TEXT,
  "dataRicezioneFattura" TIMESTAMP(3),
  
  -- Invio consulente
  "dataInvioConsulente" TIMESTAMP(3),
  "emailConsulente" TEXT,
  
  -- Pagamento
  "dataInserimentoDistinta" TIMESTAMP(3),
  "dataPagamento" TIMESTAMP(3),
  
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RaggruppamentoCompensoPIVA_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RaggruppamentoCompensoPIVA_artistaId_idx" ON "RaggruppamentoCompensoPIVA"("artistaId");
CREATE INDEX "RaggruppamentoCompensoPIVA_stato_idx" ON "RaggruppamentoCompensoPIVA"("stato");
CREATE INDEX "RaggruppamentoCompensoPIVA_periodoFine_idx" ON "RaggruppamentoCompensoPIVA"("periodoFine");

-- =====================================================
-- TABELLA: AgibilitaRaggruppamento
-- Collega agibilità al raggruppamento P.IVA
-- =====================================================

CREATE TABLE "AgibilitaRaggruppamento" (
  "id" TEXT NOT NULL,
  "raggruppamentoId" TEXT NOT NULL,
  "artistaAgibilitaId" TEXT NOT NULL,
  "compensoNetto" DECIMAL(10,2) NOT NULL,
  "ritenuta4" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgibilitaRaggruppamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgibilitaRaggruppamento_unique" ON "AgibilitaRaggruppamento"("raggruppamentoId", "artistaAgibilitaId");
CREATE INDEX "AgibilitaRaggruppamento_raggruppamentoId_idx" ON "AgibilitaRaggruppamento"("raggruppamentoId");

-- =====================================================
-- TABELLA: ConfigGettoneFullTime
-- Configurazione gettoni per dipendente full time
-- =====================================================

CREATE TABLE "ConfigGettoneFullTime" (
  "id" TEXT NOT NULL,
  "artistaId" TEXT NOT NULL,
  
  -- Gettone base (fisso per evento)
  "gettoneBase" DECIMAL(10,2) NOT NULL DEFAULT 50,
  
  -- Gettoni per tipo evento (JSON: { "CLUB": 50, "PIAZZA": 80, ... })
  "gettoniPerTipoEvento" JSONB,
  
  -- Gettoni per tipo locale (JSON: { "DISCOTECA": 60, "BAR": 40, ... })
  "gettoniPerTipoLocale" JSONB,
  
  -- Stipendio fisso mensile
  "stipendioFissoMensile" DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  "attivo" BOOLEAN NOT NULL DEFAULT true,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConfigGettoneFullTime_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConfigGettoneFullTime_artistaId_key" ON "ConfigGettoneFullTime"("artistaId");

-- =====================================================
-- TABELLA: CalcoloMensileFullTime
-- Calcolo mensile per dipendenti full time
-- =====================================================

CREATE TABLE "CalcoloMensileFullTime" (
  "id" TEXT NOT NULL,
  "artistaId" TEXT NOT NULL,
  "anno" INTEGER NOT NULL,
  "mese" INTEGER NOT NULL,  -- 1-12
  "stato" "StatoBustaPaga" NOT NULL DEFAULT 'DA_ELABORARE',
  
  -- Stipendio fisso
  "stipendioFisso" DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Calcolo da agibilità
  "totaleNettoAgibilita" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totaleGettoniAgenzia" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "nettoPerBustaPaga" DECIMAL(10,2) NOT NULL DEFAULT 0,  -- totaleNetto - gettoni
  "numeroPresenze" INTEGER NOT NULL DEFAULT 0,
  
  -- Rimborsi spesa
  "totaleRimborsiSpesa" DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Totale per busta paga
  "totaleBustaPaga" DECIMAL(10,2) NOT NULL DEFAULT 0,  -- stipendio + nettoPerBustaPaga + rimborsi
  
  -- Busta paga dal consulente
  "pdfBustaPagaPath" TEXT,
  "costoLordoAzienda" DECIMAL(10,2),
  "costiAccessori" DECIMAL(10,2),  -- TFR, contributi extra, etc.
  "dataRicezioneBustaPaga" TIMESTAMP(3),
  
  -- Invio consulente
  "dataInvioConsulente" TIMESTAMP(3),
  
  -- Pagamento
  "dataPagamento" TIMESTAMP(3),
  
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CalcoloMensileFullTime_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalcoloMensileFullTime_artista_mese_key" ON "CalcoloMensileFullTime"("artistaId", "anno", "mese");
CREATE INDEX "CalcoloMensileFullTime_artistaId_idx" ON "CalcoloMensileFullTime"("artistaId");
CREATE INDEX "CalcoloMensileFullTime_anno_mese_idx" ON "CalcoloMensileFullTime"("anno", "mese");
CREATE INDEX "CalcoloMensileFullTime_stato_idx" ON "CalcoloMensileFullTime"("stato");

-- =====================================================
-- TABELLA: DettaglioPresenzaFullTime
-- Dettaglio singola presenza full time
-- =====================================================

CREATE TABLE "DettaglioPresenzaFullTime" (
  "id" TEXT NOT NULL,
  "calcoloMensileId" TEXT NOT NULL,
  "artistaAgibilitaId" TEXT NOT NULL,
  
  "dataAgibilita" TIMESTAMP(3) NOT NULL,
  "localeNome" TEXT,
  "tipoEvento" TEXT,
  
  "compensoNetto" DECIMAL(10,2) NOT NULL,
  "gettoneAgenzia" DECIMAL(10,2) NOT NULL,
  "nettoPerBustaPaga" DECIMAL(10,2) NOT NULL,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DettaglioPresenzaFullTime_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DettaglioPresenzaFullTime_unique" ON "DettaglioPresenzaFullTime"("calcoloMensileId", "artistaAgibilitaId");
CREATE INDEX "DettaglioPresenzaFullTime_calcoloMensileId_idx" ON "DettaglioPresenzaFullTime"("calcoloMensileId");

-- =====================================================
-- TABELLA: RimborsoSpesa
-- Rimborsi spesa per full time e a chiamata
-- =====================================================

CREATE TABLE "RimborsoSpesa" (
  "id" TEXT NOT NULL,
  "artistaId" TEXT NOT NULL,
  "calcoloMensileId" TEXT,  -- Se collegato a calcolo mensile
  
  "tipo" "TipoRimborsoSpesa" NOT NULL DEFAULT 'TRASFERTA_ITALIA',
  "descrizione" TEXT,
  "importo" DECIMAL(10,2) NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  
  -- Riferimento agibilità (opzionale)
  "agibilitaId" TEXT,
  
  -- Documentazione
  "documentoPath" TEXT,
  
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RimborsoSpesa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RimborsoSpesa_artistaId_idx" ON "RimborsoSpesa"("artistaId");
CREATE INDEX "RimborsoSpesa_calcoloMensileId_idx" ON "RimborsoSpesa"("calcoloMensileId");
CREATE INDEX "RimborsoSpesa_data_idx" ON "RimborsoSpesa"("data");

-- =====================================================
-- TABELLA: ConfigGettoneEvento
-- Configurazione gettoni per tipo evento (per a chiamata/tecnici)
-- =====================================================

CREATE TABLE "ConfigGettoneEvento" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "tipoEvento" TEXT,          -- CLUB, PIAZZA, MATRIMONIO, etc.
  "tipoLocale" TEXT,          -- DISCOTECA, BAR, etc.
  "gettone" DECIMAL(10,2) NOT NULL,
  "descrizione" TEXT,
  "attivo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConfigGettoneEvento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConfigGettoneEvento_tipoEvento_idx" ON "ConfigGettoneEvento"("tipoEvento");
CREATE INDEX "ConfigGettoneEvento_tipoLocale_idx" ON "ConfigGettoneEvento"("tipoLocale");

-- =====================================================
-- TABELLA: ImpostazioniPagamenti
-- Impostazioni generali modulo pagamenti
-- =====================================================

CREATE TABLE "ImpostazioniPagamenti" (
  "id" TEXT NOT NULL DEFAULT 'default',
  
  -- Trigger P.IVA
  "pivaGiorniTrigger" INTEGER NOT NULL DEFAULT 30,
  "pivaImportoMinimo" DECIMAL(10,2) NOT NULL DEFAULT 100,
  "pivaApplicaRitenuta4" BOOLEAN NOT NULL DEFAULT true,
  
  -- Trasferta Italia
  "trasfertaItaliaDefault" DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Email consulente
  "emailConsulente" TEXT,
  "emailConsulenteCC" TEXT,
  
  -- Template email
  "templateEmailRichiestaFattura" TEXT,
  "templateEmailInvioConsulente" TEXT,
  
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImpostazioniPagamenti_pkey" PRIMARY KEY ("id")
);

-- Inserisci configurazione default
INSERT INTO "ImpostazioniPagamenti" ("id") VALUES ('default') ON CONFLICT DO NOTHING;

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

ALTER TABLE "RaggruppamentoCompensoPIVA" ADD CONSTRAINT "RaggruppamentoCompensoPIVA_artistaId_fkey" 
  FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgibilitaRaggruppamento" ADD CONSTRAINT "AgibilitaRaggruppamento_raggruppamentoId_fkey" 
  FOREIGN KEY ("raggruppamentoId") REFERENCES "RaggruppamentoCompensoPIVA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgibilitaRaggruppamento" ADD CONSTRAINT "AgibilitaRaggruppamento_artistaAgibilitaId_fkey" 
  FOREIGN KEY ("artistaAgibilitaId") REFERENCES "ArtistaAgibilita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfigGettoneFullTime" ADD CONSTRAINT "ConfigGettoneFullTime_artistaId_fkey" 
  FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalcoloMensileFullTime" ADD CONSTRAINT "CalcoloMensileFullTime_artistaId_fkey" 
  FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DettaglioPresenzaFullTime" ADD CONSTRAINT "DettaglioPresenzaFullTime_calcoloMensileId_fkey" 
  FOREIGN KEY ("calcoloMensileId") REFERENCES "CalcoloMensileFullTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DettaglioPresenzaFullTime" ADD CONSTRAINT "DettaglioPresenzaFullTime_artistaAgibilitaId_fkey" 
  FOREIGN KEY ("artistaAgibilitaId") REFERENCES "ArtistaAgibilita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RimborsoSpesa" ADD CONSTRAINT "RimborsoSpesa_artistaId_fkey" 
  FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RimborsoSpesa" ADD CONSTRAINT "RimborsoSpesa_calcoloMensileId_fkey" 
  FOREIGN KEY ("calcoloMensileId") REFERENCES "CalcoloMensileFullTime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RimborsoSpesa" ADD CONSTRAINT "RimborsoSpesa_agibilitaId_fkey" 
  FOREIGN KEY ("agibilitaId") REFERENCES "Agibilita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- AGGIUNTA CAMPI A TABELLE ESISTENTI
-- =====================================================

-- Aggiungi flag ritenuta 4% su Artista (per P.IVA)
ALTER TABLE "Artista" ADD COLUMN IF NOT EXISTS "applicaRitenuta4" BOOLEAN DEFAULT false;

-- Aggiungi riferimento al raggruppamento su ArtistaAgibilita
ALTER TABLE "ArtistaAgibilita" ADD COLUMN IF NOT EXISTS "raggruppamentoPIVAId" TEXT;
ALTER TABLE "ArtistaAgibilita" ADD CONSTRAINT "ArtistaAgibilita_raggruppamentoPIVAId_fkey" 
  FOREIGN KEY ("raggruppamentoPIVAId") REFERENCES "RaggruppamentoCompensoPIVA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
