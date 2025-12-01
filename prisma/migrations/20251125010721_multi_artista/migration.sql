/*
  Warnings:

  - You are about to drop the column `artistaId` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `compensoLordo` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `compensoNetto` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `contributiINPS` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `dataPagamento` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `inviatoArtista` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `inviatoArtistaAt` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `metodoPagamento` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `oraFine` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `oraInizio` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `pdfArtistaPath` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `pdfGeneratoAt` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `qualifica` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `ritenuta` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `scadenzaPagamento` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `statoPagamento` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `tipoAttivita` on the `Agibilita` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Agibilita" DROP CONSTRAINT "Agibilita_artistaId_fkey";

-- DropIndex
DROP INDEX "Agibilita_artistaId_idx";

-- DropIndex
DROP INDEX "Agibilita_statoPagamento_idx";

-- AlterTable
ALTER TABLE "Agibilita" DROP COLUMN "artistaId",
DROP COLUMN "compensoLordo",
DROP COLUMN "compensoNetto",
DROP COLUMN "contributiINPS",
DROP COLUMN "dataPagamento",
DROP COLUMN "inviatoArtista",
DROP COLUMN "inviatoArtistaAt",
DROP COLUMN "metodoPagamento",
DROP COLUMN "oraFine",
DROP COLUMN "oraInizio",
DROP COLUMN "pdfArtistaPath",
DROP COLUMN "pdfGeneratoAt",
DROP COLUMN "qualifica",
DROP COLUMN "ritenuta",
DROP COLUMN "scadenzaPagamento",
DROP COLUMN "statoPagamento",
DROP COLUMN "tipoAttivita",
ADD COLUMN     "dataFine" TIMESTAMP(3),
ADD COLUMN     "totaleCompensiLordi" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totaleCompensiNetti" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totaleRitenute" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "importoFattura" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "ArtistaAgibilita" (
    "id" TEXT NOT NULL,
    "agibilitaId" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "qualifica" "Qualifica",
    "compensoNetto" DECIMAL(10,2) NOT NULL,
    "compensoLordo" DECIMAL(10,2) NOT NULL,
    "ritenuta" DECIMAL(10,2) NOT NULL,
    "statoPagamento" "StatoPagamentoArtista" NOT NULL DEFAULT 'DA_PAGARE',
    "scadenzaPagamento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "metodoPagamento" TEXT,
    "inviatoArtista" BOOLEAN NOT NULL DEFAULT false,
    "inviatoArtistaAt" TIMESTAMP(3),
    "pdfArtistaPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistaAgibilita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistaAgibilita_agibilitaId_idx" ON "ArtistaAgibilita"("agibilitaId");

-- CreateIndex
CREATE INDEX "ArtistaAgibilita_artistaId_idx" ON "ArtistaAgibilita"("artistaId");

-- CreateIndex
CREATE INDEX "ArtistaAgibilita_statoPagamento_idx" ON "ArtistaAgibilita"("statoPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistaAgibilita_agibilitaId_artistaId_key" ON "ArtistaAgibilita"("agibilitaId", "artistaId");

-- AddForeignKey
ALTER TABLE "ArtistaAgibilita" ADD CONSTRAINT "ArtistaAgibilita_agibilitaId_fkey" FOREIGN KEY ("agibilitaId") REFERENCES "Agibilita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistaAgibilita" ADD CONSTRAINT "ArtistaAgibilita_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
