-- CreateEnum
CREATE TYPE "StatoFatturaArtista" AS ENUM ('ATTESA_FATTURA', 'FATTURA_RICEVUTA', 'IN_DISTINTA', 'PAGATA');

-- CreateEnum
CREATE TYPE "StatoPresenzaMensile" AS ENUM ('IN_CORSO', 'DA_CONFERMARE', 'CONFERMATA', 'ELABORATA');

-- CreateTable
CREATE TABLE "FatturaArtista" (
    "id" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "mese" INTEGER NOT NULL,
    "agibilitaIncluse" JSONB NOT NULL,
    "importoTotale" DECIMAL(10,2) NOT NULL,
    "numeroFattura" TEXT,
    "dataFattura" TIMESTAMP(3),
    "fatturaPath" TEXT,
    "stato" "StatoFatturaArtista" NOT NULL DEFAULT 'ATTESA_FATTURA',
    "dataRicezione" TIMESTAMP(3),
    "dataScadenza" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "distinaId" TEXT,
    "distinaGenerataAt" TIMESTAMP(3),
    "causaleBonifico" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FatturaArtista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenzaMensile" (
    "id" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "mese" INTEGER NOT NULL,
    "tipoContratto" "TipoContratto" NOT NULL,
    "giorniLavorati" JSONB NOT NULL,
    "totaleGiorni" INTEGER NOT NULL DEFAULT 0,
    "totaleOre" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "importoOrario" DECIMAL(10,2),
    "importoGiornaliero" DECIMAL(10,2),
    "importoTotale" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stato" "StatoPresenzaMensile" NOT NULL DEFAULT 'IN_CORSO',
    "dataConferma" TIMESTAMP(3),
    "confermatoDa" TEXT,
    "bustaPagaRef" TEXT,
    "dataElaborazione" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresenzaMensile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FatturaArtista_stato_idx" ON "FatturaArtista"("stato");

-- CreateIndex
CREATE INDEX "FatturaArtista_artistaId_idx" ON "FatturaArtista"("artistaId");

-- CreateIndex
CREATE UNIQUE INDEX "FatturaArtista_artistaId_anno_mese_key" ON "FatturaArtista"("artistaId", "anno", "mese");

-- CreateIndex
CREATE INDEX "PresenzaMensile_stato_idx" ON "PresenzaMensile"("stato");

-- CreateIndex
CREATE INDEX "PresenzaMensile_artistaId_idx" ON "PresenzaMensile"("artistaId");

-- CreateIndex
CREATE UNIQUE INDEX "PresenzaMensile_artistaId_anno_mese_key" ON "PresenzaMensile"("artistaId", "anno", "mese");

-- AddForeignKey
ALTER TABLE "FatturaArtista" ADD CONSTRAINT "FatturaArtista_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresenzaMensile" ADD CONSTRAINT "PresenzaMensile_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
