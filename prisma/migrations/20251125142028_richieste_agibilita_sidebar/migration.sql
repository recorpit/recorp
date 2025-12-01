-- CreateEnum
CREATE TYPE "StatoRichiestaAgibilita" AS ENUM ('NUOVA', 'IN_LAVORAZIONE', 'EVASA', 'RIFIUTATA', 'ANNULLATA');

-- CreateTable
CREATE TABLE "RichiestaAgibilita" (
    "id" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "stato" "StatoRichiestaAgibilita" NOT NULL DEFAULT 'NUOVA',
    "richiedente" TEXT NOT NULL,
    "emailRichiedente" TEXT,
    "telefonoRichiedente" TEXT,
    "datiRichiesta" JSONB,
    "note" TEXT,
    "noteInterne" TEXT,
    "agibilitaId" TEXT,
    "assegnatoA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RichiestaAgibilita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RichiestaAgibilita_codice_key" ON "RichiestaAgibilita"("codice");

-- CreateIndex
CREATE INDEX "RichiestaAgibilita_stato_idx" ON "RichiestaAgibilita"("stato");

-- CreateIndex
CREATE INDEX "RichiestaAgibilita_assegnatoA_idx" ON "RichiestaAgibilita"("assegnatoA");

-- CreateIndex
CREATE INDEX "RichiestaAgibilita_emailRichiedente_idx" ON "RichiestaAgibilita"("emailRichiedente");

-- AddForeignKey
ALTER TABLE "RichiestaAgibilita" ADD CONSTRAINT "RichiestaAgibilita_agibilitaId_fkey" FOREIGN KEY ("agibilitaId") REFERENCES "Agibilita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RichiestaAgibilita" ADD CONSTRAINT "RichiestaAgibilita_assegnatoA_fkey" FOREIGN KEY ("assegnatoA") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
