-- CreateEnum
CREATE TYPE "TipoFatturazione" AS ENUM ('COMMITTENTE', 'EVERYONE');

-- AlterEnum
ALTER TYPE "RuoloUtente" ADD VALUE 'FORMAT_MANAGER';

-- AlterTable
ALTER TABLE "Agibilita" ADD COLUMN     "formatId" TEXT;

-- CreateTable
CREATE TABLE "Format" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "tipoFatturazione" "TipoFatturazione" NOT NULL DEFAULT 'COMMITTENTE',
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormatCommittente" (
    "id" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "committenteId" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormatCommittente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFormat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFormat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Format_nome_key" ON "Format"("nome");

-- CreateIndex
CREATE INDEX "Format_nome_idx" ON "Format"("nome");

-- CreateIndex
CREATE INDEX "Format_attivo_idx" ON "Format"("attivo");

-- CreateIndex
CREATE INDEX "FormatCommittente_formatId_idx" ON "FormatCommittente"("formatId");

-- CreateIndex
CREATE INDEX "FormatCommittente_committenteId_idx" ON "FormatCommittente"("committenteId");

-- CreateIndex
CREATE UNIQUE INDEX "FormatCommittente_formatId_committenteId_key" ON "FormatCommittente"("formatId", "committenteId");

-- CreateIndex
CREATE INDEX "UserFormat_userId_idx" ON "UserFormat"("userId");

-- CreateIndex
CREATE INDEX "UserFormat_formatId_idx" ON "UserFormat"("formatId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFormat_userId_formatId_key" ON "UserFormat"("userId", "formatId");

-- CreateIndex
CREATE INDEX "Agibilita_formatId_idx" ON "Agibilita"("formatId");

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatCommittente" ADD CONSTRAINT "FormatCommittente_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatCommittente" ADD CONSTRAINT "FormatCommittente_committenteId_fkey" FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFormat" ADD CONSTRAINT "UserFormat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFormat" ADD CONSTRAINT "UserFormat_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE CASCADE ON UPDATE CASCADE;
