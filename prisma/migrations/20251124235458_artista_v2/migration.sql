/*
  Warnings:

  - You are about to drop the column `codiceQualificaINPS` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `codiceQualificaINPS` on the `Artista` table. All the data in the column will be lost.
  - You are about to drop the column `documentoIdentita` on the `Artista` table. All the data in the column will be lost.
  - You are about to drop the column `tipoArtista` on the `Artista` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Qualifica" AS ENUM ('DJ', 'VOCALIST', 'CORISTA', 'MUSICISTA', 'BALLERINO', 'LUCISTA', 'FOTOGRAFO', 'TRUCCATORE', 'ALTRO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CARTA_IDENTITA', 'PASSAPORTO', 'PATENTE', 'PERMESSO_SOGGIORNO', 'ALTRO');

-- AlterTable
ALTER TABLE "Agibilita" DROP COLUMN "codiceQualificaINPS",
ADD COLUMN     "qualifica" "Qualifica";

-- AlterTable
ALTER TABLE "Artista" DROP COLUMN "codiceQualificaINPS",
DROP COLUMN "documentoIdentita",
DROP COLUMN "tipoArtista",
ADD COLUMN     "extraUE" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maggiorenne" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "numeroDocumento" TEXT,
ADD COLUMN     "qualifica" "Qualifica" NOT NULL DEFAULT 'ALTRO',
ADD COLUMN     "scadenzaDocumento" TIMESTAMP(3),
ADD COLUMN     "sesso" TEXT,
ADD COLUMN     "tipoDocumento" "TipoDocumento";

-- DropEnum
DROP TYPE "CodiceQualificaINPS";

-- DropEnum
DROP TYPE "TipoArtista";

-- CreateTable
CREATE TABLE "DocumentoArtista" (
    "id" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "nome" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "dimensione" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoArtista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoArtista_artistaId_idx" ON "DocumentoArtista"("artistaId");

-- AddForeignKey
ALTER TABLE "DocumentoArtista" ADD CONSTRAINT "DocumentoArtista_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
