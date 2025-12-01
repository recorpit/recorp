-- Migration: Creazione tabella NotaDiCredito
-- Eseguire con: npx prisma db execute --file ./prisma/migrations/create_nota_di_credito.sql

-- Tabella Note di Credito
CREATE TABLE IF NOT EXISTS "NotaDiCredito" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "numero" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "progressivo" INTEGER NOT NULL,
    "dataEmissione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Riferimenti
    "fatturaRiferimentoId" TEXT NOT NULL,
    "committenteId" TEXT NOT NULL,
    
    -- Tipo e motivo
    "tipo" TEXT NOT NULL DEFAULT 'TOTALE', -- TOTALE o PARZIALE
    "motivo" TEXT NOT NULL,
    
    -- Importi
    "imponibile" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL,
    "totale" DECIMAL(12,2) NOT NULL,
    "aliquotaIva" INTEGER NOT NULL DEFAULT 22,
    "splitPayment" BOOLEAN NOT NULL DEFAULT false,
    
    -- Righe (JSON)
    "righe" JSONB NOT NULL DEFAULT '[]',
    
    -- Stato
    "stato" TEXT NOT NULL DEFAULT 'EMESSA', -- EMESSA, INVIATA, ANNULLATA
    
    -- Dati XML
    "progressivoInvio" TEXT,
    
    -- Note
    "note" TEXT,
    
    -- Timestamp
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "NotaDiCredito_pkey" PRIMARY KEY ("id")
);

-- Indice univoco per numero/anno
CREATE UNIQUE INDEX IF NOT EXISTS "NotaDiCredito_anno_progressivo_key" ON "NotaDiCredito"("anno", "progressivo");

-- Indice per fattura riferimento
CREATE INDEX IF NOT EXISTS "NotaDiCredito_fatturaRiferimentoId_idx" ON "NotaDiCredito"("fatturaRiferimentoId");

-- Indice per committente
CREATE INDEX IF NOT EXISTS "NotaDiCredito_committenteId_idx" ON "NotaDiCredito"("committenteId");

-- Foreign keys
ALTER TABLE "NotaDiCredito" 
ADD CONSTRAINT "NotaDiCredito_fatturaRiferimentoId_fkey" 
FOREIGN KEY ("fatturaRiferimentoId") REFERENCES "Fattura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotaDiCredito" 
ADD CONSTRAINT "NotaDiCredito_committenteId_fkey" 
FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger per updatedAt
CREATE OR REPLACE FUNCTION update_nota_credito_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_nota_credito_timestamp ON "NotaDiCredito";
CREATE TRIGGER update_nota_credito_timestamp
    BEFORE UPDATE ON "NotaDiCredito"
    FOR EACH ROW
    EXECUTE FUNCTION update_nota_credito_updated_at();

-- Commenti
COMMENT ON TABLE "NotaDiCredito" IS 'Note di credito per storno fatture';
COMMENT ON COLUMN "NotaDiCredito"."tipo" IS 'TOTALE = storno completo, PARZIALE = storno parziale';
COMMENT ON COLUMN "NotaDiCredito"."righe" IS 'Array JSON delle righe della nota di credito';
