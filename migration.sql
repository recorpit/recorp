-- RECORP Fix Batch - Migration SQL
-- Esegui questo script sul database prima di avviare l'applicazione

-- 1. Aggiungi campo tipoPagamento al Committente
ALTER TABLE "Committente" ADD COLUMN IF NOT EXISTS "tipoPagamento" TEXT DEFAULT 'BONIFICO_30GG';
UPDATE "Committente" SET "tipoPagamento" = 'BONIFICO_30GG' WHERE "tipoPagamento" IS NULL;

-- 2. Assicurati che ESPORTATA sia nell'enum StatoFattura (se non già presente)
-- Nota: Se usi Prisma, aggiorna lo schema e fai db push invece di questo comando
-- ALTER TYPE "StatoFattura" ADD VALUE IF NOT EXISTS 'ESPORTATA';
