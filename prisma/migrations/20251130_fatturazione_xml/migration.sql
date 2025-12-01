-- Migration: Fatturazione XML FatturaPA
-- Data: 2024-11-30
-- Descrizione: Aggiunge campi per fatturazione elettronica, scadenze pagamento, note di credito

-- ============================================
-- ENUM per modalità fatturazione
-- ============================================

CREATE TYPE "ModalitaFatturazione" AS ENUM ('DETTAGLIO_SPESE_SEPARATE', 'DETTAGLIO_SPESE_INCLUSE');
CREATE TYPE "ModalitaRigheFattura" AS ENUM ('DETTAGLIO_SPESE_SEPARATE', 'DETTAGLIO_SPESE_INCLUSE', 'VOCE_UNICA');
CREATE TYPE "StatoNotaDiCredito" AS ENUM ('BOZZA', 'EMESSA', 'INVIATA', 'ANNULLATA');

-- ============================================
-- TABELLA: ScadenzaPagamento (configurabile)
-- ============================================

CREATE TABLE "ScadenzaPagamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "giorni" INTEGER NOT NULL DEFAULT 30,
    "fineMese" BOOLEAN NOT NULL DEFAULT false,
    "descrizione" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScadenzaPagamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScadenzaPagamento_codice_key" ON "ScadenzaPagamento"("codice");
CREATE INDEX "ScadenzaPagamento_attivo_idx" ON "ScadenzaPagamento"("attivo");
CREATE INDEX "ScadenzaPagamento_ordine_idx" ON "ScadenzaPagamento"("ordine");

-- Inserisco scadenze default
INSERT INTO "ScadenzaPagamento" ("id", "nome", "codice", "giorni", "fineMese", "descrizione", "attivo", "ordine", "updatedAt") VALUES
('scad_immediata', 'Immediata', 'IMM', 0, false, 'Pagamento immediato', true, 1, NOW()),
('scad_30gg', '30 giorni', '30GG', 30, false, 'Pagamento a 30 giorni', true, 2, NOW()),
('scad_30gg_fm', '30 giorni FM', '30FM', 30, true, 'Pagamento a 30 giorni fine mese', true, 3, NOW()),
('scad_60gg', '60 giorni', '60GG', 60, false, 'Pagamento a 60 giorni', true, 4, NOW()),
('scad_60gg_fm', '60 giorni FM', '60FM', 60, true, 'Pagamento a 60 giorni fine mese', true, 5, NOW()),
('scad_90gg', '90 giorni', '90GG', 90, false, 'Pagamento a 90 giorni', true, 6, NOW()),
('scad_90gg_fm', '90 giorni FM', '90FM', 90, true, 'Pagamento a 90 giorni fine mese', true, 7, NOW());

-- ============================================
-- MODIFICA: Committente
-- ============================================

-- Aggiungo campi fatturazione
ALTER TABLE "Committente" ADD COLUMN "modalitaFatturazione" TEXT NOT NULL DEFAULT 'DETTAGLIO_SPESE_INCLUSE';
ALTER TABLE "Committente" ADD COLUMN "scadenzaPagamentoId" TEXT;
ALTER TABLE "Committente" ADD COLUMN "isPubblicaAmministrazione" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Committente" ADD COLUMN "splitPayment" BOOLEAN NOT NULL DEFAULT false;

-- Foreign key scadenza
ALTER TABLE "Committente" ADD CONSTRAINT "Committente_scadenzaPagamentoId_fkey" 
    FOREIGN KEY ("scadenzaPagamentoId") REFERENCES "ScadenzaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Committente_scadenzaPagamentoId_idx" ON "Committente"("scadenzaPagamentoId");

-- ============================================
-- MODIFICA: Fattura
-- ============================================

-- Aggiungo campi per XML
ALTER TABLE "Fattura" ADD COLUMN "modalitaRighe" TEXT NOT NULL DEFAULT 'DETTAGLIO_SPESE_INCLUSE';
ALTER TABLE "Fattura" ADD COLUMN "descrizioneGenerica" TEXT;
ALTER TABLE "Fattura" ADD COLUMN "aliquotaIva" INTEGER NOT NULL DEFAULT 22;
ALTER TABLE "Fattura" ADD COLUMN "splitPayment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Fattura" ADD COLUMN "righeFattura" JSONB;
ALTER TABLE "Fattura" ADD COLUMN "causale" TEXT;
ALTER TABLE "Fattura" ADD COLUMN "scadenzaPagamentoId" TEXT;
ALTER TABLE "Fattura" ADD COLUMN "progressivoInvio" TEXT;

-- Foreign key scadenza
ALTER TABLE "Fattura" ADD CONSTRAINT "Fattura_scadenzaPagamentoId_fkey" 
    FOREIGN KEY ("scadenzaPagamentoId") REFERENCES "ScadenzaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Fattura_scadenzaPagamentoId_idx" ON "Fattura"("scadenzaPagamentoId");

-- ============================================
-- TABELLA: NotaDiCredito
-- ============================================

CREATE TABLE "NotaDiCredito" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "progressivo" INTEGER NOT NULL,
    
    "fatturaRiferimentoId" TEXT NOT NULL,
    "committenteId" TEXT NOT NULL,
    
    "dataEmissione" TIMESTAMP(3) NOT NULL,
    
    "imponibile" DECIMAL(10,2) NOT NULL,
    "aliquotaIva" INTEGER NOT NULL DEFAULT 22,
    "iva" DECIMAL(10,2) NOT NULL,
    "totale" DECIMAL(10,2) NOT NULL,
    
    "splitPayment" BOOLEAN NOT NULL DEFAULT false,
    
    "stato" "StatoNotaDiCredito" NOT NULL DEFAULT 'BOZZA',
    
    "motivazione" TEXT,
    "righeFattura" JSONB,
    
    "pdfPath" TEXT,
    "xmlPath" TEXT,
    
    "progressivoInvio" TEXT,
    
    "note" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaDiCredito_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotaDiCredito_numero_key" ON "NotaDiCredito"("numero");
CREATE UNIQUE INDEX "NotaDiCredito_anno_progressivo_key" ON "NotaDiCredito"("anno", "progressivo");
CREATE INDEX "NotaDiCredito_stato_idx" ON "NotaDiCredito"("stato");
CREATE INDEX "NotaDiCredito_committenteId_idx" ON "NotaDiCredito"("committenteId");
CREATE INDEX "NotaDiCredito_fatturaRiferimentoId_idx" ON "NotaDiCredito"("fatturaRiferimentoId");

-- Foreign keys
ALTER TABLE "NotaDiCredito" ADD CONSTRAINT "NotaDiCredito_fatturaRiferimentoId_fkey" 
    FOREIGN KEY ("fatturaRiferimentoId") REFERENCES "Fattura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotaDiCredito" ADD CONSTRAINT "NotaDiCredito_committenteId_fkey" 
    FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- TABELLA: ProgressivoFattura (per numerazione)
-- ============================================

CREATE TABLE "ProgressivoFattura" (
    "id" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'FATTURA',
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "ProgressivoFattura_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgressivoFattura_anno_tipo_key" ON "ProgressivoFattura"("anno", "tipo");

-- ============================================
-- TABELLA: ImpostazioniAziendaREA (dati aggiuntivi per XML)
-- ============================================

-- Aggiungo impostazioni REA se non esistono già
INSERT INTO "Impostazioni" ("id", "chiave", "valore", "updatedAt") VALUES
('imp_rea_ufficio', 'rea_ufficio', 'VI', NOW()),
('imp_rea_numero', 'rea_numero', '403841', NOW()),
('imp_rea_capitale', 'rea_capitale_sociale', '10000.00', NOW()),
('imp_rea_socio', 'rea_socio_unico', 'SM', NOW()),
('imp_rea_liquidazione', 'rea_stato_liquidazione', 'LN', NOW()),
('imp_intermediario_piva', 'intermediario_piva', '01641790702', NOW()),
('imp_intermediario_cf', 'intermediario_cf', '01641790702', NOW()),
('imp_intermediario_denominazione', 'intermediario_denominazione', 'TEAMSYSTEM SERVICE SRL', NOW())
ON CONFLICT ("chiave") DO NOTHING;
