-- CreateEnum
CREATE TYPE "StatoPrestazione" AS ENUM ('DA_GENERARE', 'IN_ATTESA_INCASSO', 'GENERATA', 'SOLLECITATA', 'FIRMATA', 'SCADUTA', 'PAGABILE', 'IN_DISTINTA', 'PAGATA');

-- CreateEnum
CREATE TYPE "TipoPagamentoPrestazione" AS ENUM ('STANDARD', 'ANTICIPATO');

-- CreateTable
CREATE TABLE "BatchPagamento" (
    "id" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "periodo" INTEGER NOT NULL,
    "mese" INTEGER NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "dataGenerazione" TIMESTAMP(3),
    "stato" TEXT NOT NULL DEFAULT 'PRONTO',
    "totalePrestazioniGenerate" INTEGER NOT NULL DEFAULT 0,
    "totaleImporto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestazioneOccasionale" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anno" INTEGER NOT NULL,
    "codice" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "batchId" TEXT,
    "agibilitaIncluse" JSONB NOT NULL,
    "compensoLordoOriginale" DECIMAL(10,2) NOT NULL,
    "compensoNettoOriginale" DECIMAL(10,2) NOT NULL,
    "ritenutaOriginale" DECIMAL(10,2) NOT NULL,
    "rimborsoSpese" DECIMAL(10,2),
    "rimborsoSpesePath" TEXT,
    "compensoLordo" DECIMAL(10,2) NOT NULL,
    "compensoNetto" DECIMAL(10,2) NOT NULL,
    "ritenuta" DECIMAL(10,2) NOT NULL,
    "scontoAnticipo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalePagato" DECIMAL(10,2) NOT NULL,
    "stato" "StatoPrestazione" NOT NULL DEFAULT 'DA_GENERARE',
    "tipoPagamento" "TipoPagamentoPrestazione",
    "dataEmissione" TIMESTAMP(3),
    "dataInvioLink" TIMESTAMP(3),
    "dataSollecito" TIMESTAMP(3),
    "dataFirma" TIMESTAMP(3),
    "dataScadenzaLink" TIMESTAMP(3),
    "dataScadenzaPagamento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "tokenFirma" TEXT,
    "tokenScadenza" TIMESTAMP(3),
    "firmaNome" TEXT,
    "firmaCognome" TEXT,
    "firmaIP" TEXT,
    "firmaUserAgent" TEXT,
    "firmaAccettazione" BOOLEAN NOT NULL DEFAULT false,
    "causaleBonifico" TEXT,
    "distinaId" TEXT,
    "distinaGenerataAt" TIMESTAMP(3),
    "pdfPath" TEXT,
    "errore" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrestazioneOccasionale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressivoRicevuta" (
    "id" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgressivoRicevuta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BatchPagamento_codice_key" ON "BatchPagamento"("codice");

-- CreateIndex
CREATE INDEX "BatchPagamento_stato_idx" ON "BatchPagamento"("stato");

-- CreateIndex
CREATE UNIQUE INDEX "BatchPagamento_anno_mese_periodo_key" ON "BatchPagamento"("anno", "mese", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "PrestazioneOccasionale_codice_key" ON "PrestazioneOccasionale"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "PrestazioneOccasionale_tokenFirma_key" ON "PrestazioneOccasionale"("tokenFirma");

-- CreateIndex
CREATE INDEX "PrestazioneOccasionale_stato_idx" ON "PrestazioneOccasionale"("stato");

-- CreateIndex
CREATE INDEX "PrestazioneOccasionale_artistaId_idx" ON "PrestazioneOccasionale"("artistaId");

-- CreateIndex
CREATE INDEX "PrestazioneOccasionale_tokenFirma_idx" ON "PrestazioneOccasionale"("tokenFirma");

-- CreateIndex
CREATE INDEX "PrestazioneOccasionale_dataScadenzaPagamento_idx" ON "PrestazioneOccasionale"("dataScadenzaPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "PrestazioneOccasionale_artistaId_anno_numero_key" ON "PrestazioneOccasionale"("artistaId", "anno", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressivoRicevuta_artistaId_anno_key" ON "ProgressivoRicevuta"("artistaId", "anno");

-- AddForeignKey
ALTER TABLE "PrestazioneOccasionale" ADD CONSTRAINT "PrestazioneOccasionale_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestazioneOccasionale" ADD CONSTRAINT "PrestazioneOccasionale_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
