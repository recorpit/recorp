/*
  Warnings:

  - The values [DA_CREARE,PRONTA_INVIO,RICEVUTA_CARICATA] on the enum `StatoAgibilita` will be removed. If these variants are still used in the database, this will fail.
  - The values [CANTANTE,INTRATTENITORE] on the enum `TipoArtista` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contributiAzienda` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `eventoId` on the `Agibilita` table. All the data in the column will be lost.
  - You are about to drop the column `capacitaMicrofono` on the `Artista` table. All the data in the column will be lost.
  - You are about to drop the column `stileMusicale` on the `Artista` table. All the data in the column will be lost.
  - You are about to drop the column `capEvento` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `capLegale` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `cittaEvento` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `cittaLegale` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `codiceFiscale` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `creditSafeData` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `creditSafeScore` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `giorniPagamento` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `indirizzoEvento` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `indirizzoLegale` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `partitaIva` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `pec` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `provinciaEvento` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `provinciaLegale` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `ragioneSociale` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `rischio` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Locale` table. All the data in the column will be lost.
  - You are about to drop the column `tipoEvento` on the `Locale` table. All the data in the column will be lost.
  - The `ruolo` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Evento` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codice]` on the table `Agibilita` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codice` to the `Agibilita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `committenteId` to the `Agibilita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `Agibilita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `importoFattura` to the `Agibilita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `localeId` to the `Agibilita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ritenuta` to the `Agibilita` table without a default value. This is not possible if the table is not empty.
  - Made the column `compensoNetto` on table `Agibilita` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cognome` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CodiceQualificaINPS" AS ENUM ('COD_013_CORISTI_VOCALISTI', 'COD_031_VOCALIST', 'COD_032_DJ', 'COD_081_MUSICISTI', 'COD_092_BALLERINI', 'COD_117_LUCISTI', 'COD_126_FOTOGRAFI', 'COD_141_TRUCCATORI');

-- CreateEnum
CREATE TYPE "TipoContratto" AS ENUM ('A_CHIAMATA', 'P_IVA', 'FULL_TIME', 'PRESTAZIONE_OCCASIONALE');

-- CreateEnum
CREATE TYPE "TipoLocale" AS ENUM ('CLUB', 'DISCOTECA', 'BAR', 'RISTORANTE', 'PIAZZA', 'TEATRO', 'ARENA', 'STABILIMENTO', 'PRIVATO', 'ALTRO');

-- CreateEnum
CREATE TYPE "StatoFatturaAgibilita" AS ENUM ('DA_FATTURARE', 'FATTURATA', 'PAGATA');

-- CreateEnum
CREATE TYPE "Richiedente" AS ENUM ('COMMITTENTE', 'OKL');

-- CreateEnum
CREATE TYPE "TipoNotifica" AS ENUM ('RISCHIO', 'SCADENZA_PAGAMENTO', 'SCADENZA_PRENOTAZIONE', 'LOCK_BOZZA', 'SOGLIA_COMPENSI', 'DOCUMENTO_MANCANTE', 'SISTEMA');

-- CreateEnum
CREATE TYPE "StatoFattura" AS ENUM ('BOZZA', 'EMESSA', 'INVIATA', 'PAGATA', 'ANNULLATA');

-- CreateEnum
CREATE TYPE "StatoBozza" AS ENUM ('IN_LAVORAZIONE', 'SOSPESA', 'COMPLETATA');

-- CreateEnum
CREATE TYPE "RuoloUtente" AS ENUM ('ADMIN', 'OPERATORE', 'ARTISTICO', 'PRODUZIONE');

-- AlterEnum
BEGIN;
CREATE TYPE "StatoAgibilita_new" AS ENUM ('BOZZA', 'DATI_INCOMPLETI', 'PRONTA', 'INVIATA_INPS', 'COMPLETATA', 'ERRORE');
ALTER TABLE "Agibilita" ALTER COLUMN "stato" DROP DEFAULT;
ALTER TABLE "Agibilita" ALTER COLUMN "stato" TYPE "StatoAgibilita_new" USING ("stato"::text::"StatoAgibilita_new");
ALTER TYPE "StatoAgibilita" RENAME TO "StatoAgibilita_old";
ALTER TYPE "StatoAgibilita_new" RENAME TO "StatoAgibilita";
DROP TYPE "StatoAgibilita_old";
ALTER TABLE "Agibilita" ALTER COLUMN "stato" SET DEFAULT 'BOZZA';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoArtista_new" AS ENUM ('DJ', 'VOCALIST', 'MUSICISTA', 'BALLERINO', 'PERFORMER', 'TECNICO', 'ALTRO');
ALTER TABLE "Artista" ALTER COLUMN "tipoArtista" DROP DEFAULT;
ALTER TABLE "Artista" ALTER COLUMN "tipoArtista" TYPE "TipoArtista_new" USING ("tipoArtista"::text::"TipoArtista_new");
ALTER TYPE "TipoArtista" RENAME TO "TipoArtista_old";
ALTER TYPE "TipoArtista_new" RENAME TO "TipoArtista";
DROP TYPE "TipoArtista_old";
ALTER TABLE "Artista" ALTER COLUMN "tipoArtista" SET DEFAULT 'ALTRO';
COMMIT;

-- DropForeignKey
ALTER TABLE "Agibilita" DROP CONSTRAINT "Agibilita_eventoId_fkey";

-- DropForeignKey
ALTER TABLE "Evento" DROP CONSTRAINT "Evento_artistaId_fkey";

-- DropForeignKey
ALTER TABLE "Evento" DROP CONSTRAINT "Evento_localeId_fkey";

-- DropIndex
DROP INDEX "Agibilita_eventoId_idx";

-- DropIndex
DROP INDEX "Artista_codiceFiscale_idx";

-- DropIndex
DROP INDEX "Locale_partitaIva_idx";

-- AlterTable
ALTER TABLE "Agibilita" DROP COLUMN "contributiAzienda",
DROP COLUMN "eventoId",
ADD COLUMN     "bozzaOriginaleId" TEXT,
ADD COLUMN     "codice" TEXT NOT NULL,
ADD COLUMN     "codiceQualificaINPS" "CodiceQualificaINPS",
ADD COLUMN     "committenteId" TEXT NOT NULL,
ADD COLUMN     "data" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fatturaId" TEXT,
ADD COLUMN     "importoFattura" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "inviatoCommittente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inviatoCommittenteAt" TIMESTAMP(3),
ADD COLUMN     "localeId" TEXT NOT NULL,
ADD COLUMN     "luogoPrestazione" TEXT,
ADD COLUMN     "noteInterne" TEXT,
ADD COLUMN     "oraFine" TEXT,
ADD COLUMN     "oraInizio" TEXT,
ADD COLUMN     "quotaAgenzia" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "richiedente" "Richiedente" NOT NULL DEFAULT 'COMMITTENTE',
ADD COLUMN     "ritenuta" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "scadenzaPagamento" TIMESTAMP(3),
ADD COLUMN     "statoFattura" "StatoFatturaAgibilita" NOT NULL DEFAULT 'DA_FATTURARE',
ALTER COLUMN "compensoNetto" SET NOT NULL,
ALTER COLUMN "stato" SET DEFAULT 'BOZZA';

-- AlterTable
ALTER TABLE "Artista" DROP COLUMN "capacitaMicrofono",
DROP COLUMN "stileMusicale",
ADD COLUMN     "codiceFiscaleEstero" TEXT,
ADD COLUMN     "codiceQualificaINPS" "CodiceQualificaINPS",
ADD COLUMN     "iscritto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matricolaEnpals" TEXT,
ADD COLUMN     "nazionalita" TEXT NOT NULL DEFAULT 'IT',
ADD COLUMN     "tipoContratto" "TipoContratto" NOT NULL DEFAULT 'PRESTAZIONE_OCCASIONALE',
ALTER COLUMN "codiceFiscale" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Locale" DROP COLUMN "capEvento",
DROP COLUMN "capLegale",
DROP COLUMN "cittaEvento",
DROP COLUMN "cittaLegale",
DROP COLUMN "codiceFiscale",
DROP COLUMN "creditSafeData",
DROP COLUMN "creditSafeScore",
DROP COLUMN "email",
DROP COLUMN "giorniPagamento",
DROP COLUMN "iban",
DROP COLUMN "indirizzoEvento",
DROP COLUMN "indirizzoLegale",
DROP COLUMN "partitaIva",
DROP COLUMN "pec",
DROP COLUMN "provinciaEvento",
DROP COLUMN "provinciaLegale",
DROP COLUMN "ragioneSociale",
DROP COLUMN "rischio",
DROP COLUMN "telefono",
DROP COLUMN "tipoEvento",
ADD COLUMN     "cap" TEXT,
ADD COLUMN     "citta" TEXT,
ADD COLUMN     "codiceBelfiore" TEXT,
ADD COLUMN     "committenteDefaultId" TEXT,
ADD COLUMN     "indirizzo" TEXT,
ADD COLUMN     "provincia" TEXT,
ADD COLUMN     "tipoLocale" "TipoLocale" NOT NULL DEFAULT 'ALTRO';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cognome" TEXT NOT NULL,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "workstationId" TEXT,
DROP COLUMN "ruolo",
ADD COLUMN     "ruolo" "RuoloUtente" NOT NULL DEFAULT 'OPERATORE';

-- DropTable
DROP TABLE "Evento";

-- DropEnum
DROP TYPE "RischioLocale";

-- DropEnum
DROP TYPE "StatoEvento";

-- DropEnum
DROP TYPE "TipoEvento";

-- CreateTable
CREATE TABLE "Committente" (
    "id" TEXT NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "codiceFiscale" TEXT,
    "email" TEXT,
    "pec" TEXT,
    "telefono" TEXT,
    "codiceSDI" TEXT NOT NULL DEFAULT '0000000',
    "indirizzoFatturazione" TEXT,
    "capFatturazione" TEXT,
    "cittaFatturazione" TEXT,
    "provinciaFatturazione" TEXT,
    "quotaAgenzia" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "giorniPagamento" INTEGER NOT NULL DEFAULT 30,
    "iban" TEXT,
    "aRischio" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "noteInterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Committente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrenotazioneNumero" (
    "id" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "progressivo" INTEGER NOT NULL,
    "codice" TEXT NOT NULL,
    "confermato" BOOLEAN NOT NULL DEFAULT false,
    "agibilitaId" TEXT,
    "scadeAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrenotazioneNumero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BozzaAgibilita" (
    "id" TEXT NOT NULL,
    "codicePrenotato" TEXT,
    "prenotazioneId" TEXT,
    "datiArtisti" JSONB,
    "datiLocale" JSONB,
    "datiCommittente" JSONB,
    "datiPrestazione" JSONB,
    "datiEconomici" JSONB,
    "stato" "StatoBozza" NOT NULL DEFAULT 'IN_LAVORAZIONE',
    "percentualeCompletamento" INTEGER NOT NULL DEFAULT 0,
    "lockedById" TEXT,
    "lockedByName" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockScadeAt" TIMESTAMP(3),
    "creatoDaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BozzaAgibilita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fattura" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "progressivo" INTEGER NOT NULL,
    "committenteId" TEXT NOT NULL,
    "dataEmissione" TIMESTAMP(3) NOT NULL,
    "dataScadenza" TIMESTAMP(3),
    "imponibile" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "totale" DECIMAL(10,2) NOT NULL,
    "stato" "StatoFattura" NOT NULL DEFAULT 'BOZZA',
    "pdfPath" TEXT,
    "xmlPath" TEXT,
    "dataPagamento" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fattura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifica" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotifica" NOT NULL,
    "titolo" TEXT NOT NULL,
    "messaggio" TEXT NOT NULL,
    "agibilitaId" TEXT,
    "artistaId" TEXT,
    "committenteId" TEXT,
    "link" TEXT,
    "destinatarioId" TEXT,
    "letto" BOOLEAN NOT NULL DEFAULT false,
    "lettoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Committente_ragioneSociale_idx" ON "Committente"("ragioneSociale");

-- CreateIndex
CREATE INDEX "Committente_aRischio_idx" ON "Committente"("aRischio");

-- CreateIndex
CREATE UNIQUE INDEX "PrenotazioneNumero_codice_key" ON "PrenotazioneNumero"("codice");

-- CreateIndex
CREATE INDEX "PrenotazioneNumero_scadeAt_idx" ON "PrenotazioneNumero"("scadeAt");

-- CreateIndex
CREATE INDEX "PrenotazioneNumero_confermato_idx" ON "PrenotazioneNumero"("confermato");

-- CreateIndex
CREATE UNIQUE INDEX "PrenotazioneNumero_anno_progressivo_key" ON "PrenotazioneNumero"("anno", "progressivo");

-- CreateIndex
CREATE INDEX "BozzaAgibilita_stato_idx" ON "BozzaAgibilita"("stato");

-- CreateIndex
CREATE INDEX "BozzaAgibilita_lockScadeAt_idx" ON "BozzaAgibilita"("lockScadeAt");

-- CreateIndex
CREATE INDEX "BozzaAgibilita_creatoDaId_idx" ON "BozzaAgibilita"("creatoDaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fattura_numero_key" ON "Fattura"("numero");

-- CreateIndex
CREATE INDEX "Fattura_stato_idx" ON "Fattura"("stato");

-- CreateIndex
CREATE INDEX "Fattura_committenteId_idx" ON "Fattura"("committenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Fattura_anno_progressivo_key" ON "Fattura"("anno", "progressivo");

-- CreateIndex
CREATE INDEX "Notifica_destinatarioId_letto_idx" ON "Notifica"("destinatarioId", "letto");

-- CreateIndex
CREATE INDEX "Notifica_tipo_idx" ON "Notifica"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Agibilita_codice_key" ON "Agibilita"("codice");

-- CreateIndex
CREATE INDEX "Agibilita_statoFattura_idx" ON "Agibilita"("statoFattura");

-- CreateIndex
CREATE INDEX "Agibilita_data_idx" ON "Agibilita"("data");

-- CreateIndex
CREATE INDEX "Agibilita_localeId_idx" ON "Agibilita"("localeId");

-- CreateIndex
CREATE INDEX "Agibilita_committenteId_idx" ON "Agibilita"("committenteId");

-- CreateIndex
CREATE INDEX "Artista_nomeDarte_idx" ON "Artista"("nomeDarte");

-- CreateIndex
CREATE INDEX "Artista_iscritto_idx" ON "Artista"("iscritto");

-- CreateIndex
CREATE INDEX "Locale_citta_idx" ON "Locale"("citta");

-- CreateIndex
CREATE INDEX "User_ruolo_idx" ON "User"("ruolo");

-- AddForeignKey
ALTER TABLE "Locale" ADD CONSTRAINT "Locale_committenteDefaultId_fkey" FOREIGN KEY ("committenteDefaultId") REFERENCES "Committente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_localeId_fkey" FOREIGN KEY ("localeId") REFERENCES "Locale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_committenteId_fkey" FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_fatturaId_fkey" FOREIGN KEY ("fatturaId") REFERENCES "Fattura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BozzaAgibilita" ADD CONSTRAINT "BozzaAgibilita_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BozzaAgibilita" ADD CONSTRAINT "BozzaAgibilita_creatoDaId_fkey" FOREIGN KEY ("creatoDaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fattura" ADD CONSTRAINT "Fattura_committenteId_fkey" FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifica" ADD CONSTRAINT "Notifica_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
