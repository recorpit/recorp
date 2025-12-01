/*
  Warnings:

  - The `qualifica` column on the `Artista` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `qualifica` column on the `ArtistaAgibilita` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Agibilita" ADD COLUMN     "estera" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paeseEstero" TEXT;

-- AlterTable
ALTER TABLE "Artista" DROP COLUMN "qualifica",
ADD COLUMN     "qualifica" TEXT NOT NULL DEFAULT 'Altro';

-- AlterTable
ALTER TABLE "ArtistaAgibilita" ADD COLUMN     "dataFine" TIMESTAMP(3),
ADD COLUMN     "dataInizio" TIMESTAMP(3),
DROP COLUMN "qualifica",
ADD COLUMN     "qualifica" TEXT;

-- CreateTable
CREATE TABLE "QualificaConfig" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codiceInps" TEXT NOT NULL,
    "sinonimi" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualificaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QualificaConfig_nome_key" ON "QualificaConfig"("nome");

-- CreateIndex
CREATE INDEX "QualificaConfig_attivo_idx" ON "QualificaConfig"("attivo");

-- CreateIndex
CREATE INDEX "QualificaConfig_ordine_idx" ON "QualificaConfig"("ordine");
