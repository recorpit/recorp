/*
  Warnings:

  - A unique constraint covering the columns `[codiceCommercialista]` on the table `Artista` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('ARTISTA', 'COMMITTENTE', 'LOCALE', 'AGIBILITA', 'FATTURA', 'CONTRATTO', 'RICEVUTA', 'AZIENDALE', 'ALTRO');

-- AlterTable
ALTER TABLE "Artista" ADD COLUMN     "bic" TEXT,
ADD COLUMN     "codiceCommercialista" TEXT;

-- CreateTable
CREATE TABLE "Impostazioni" (
    "id" TEXT NOT NULL,
    "chiave" TEXT NOT NULL,
    "valore" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Impostazioni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeVisualizzato" TEXT,
    "descrizione" TEXT,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "dimensione" INTEGER,
    "estensione" TEXT,
    "categoria" "CategoriaDocumento" NOT NULL DEFAULT 'ALTRO',
    "tags" TEXT,
    "artistaId" TEXT,
    "committenteId" TEXT,
    "localeId" TEXT,
    "agibilitaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Impostazioni_chiave_key" ON "Impostazioni"("chiave");

-- CreateIndex
CREATE INDEX "Impostazioni_chiave_idx" ON "Impostazioni"("chiave");

-- CreateIndex
CREATE INDEX "Documento_categoria_idx" ON "Documento"("categoria");

-- CreateIndex
CREATE INDEX "Documento_artistaId_idx" ON "Documento"("artistaId");

-- CreateIndex
CREATE INDEX "Documento_committenteId_idx" ON "Documento"("committenteId");

-- CreateIndex
CREATE INDEX "Documento_agibilitaId_idx" ON "Documento"("agibilitaId");

-- CreateIndex
CREATE INDEX "Documento_createdAt_idx" ON "Documento"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Artista_codiceCommercialista_key" ON "Artista"("codiceCommercialista");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_committenteId_fkey" FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_localeId_fkey" FOREIGN KEY ("localeId") REFERENCES "Locale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_agibilitaId_fkey" FOREIGN KEY ("agibilitaId") REFERENCES "Agibilita"("id") ON DELETE SET NULL ON UPDATE CASCADE;
