-- CreateEnum
CREATE TYPE "TipoArtista" AS ENUM ('CANTANTE', 'DJ', 'MUSICISTA', 'PERFORMER', 'INTRATTENITORE', 'TECNICO', 'ALTRO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CLUB', 'APERITIVO', 'PIAZZA', 'MATRIMONIO', 'PRIVATO', 'FESTIVAL', 'CORPORATE', 'ALTRO');

-- CreateEnum
CREATE TYPE "StatoEvento" AS ENUM ('BOZZA', 'CONFERMATO', 'IN_CORSO', 'COMPLETATO', 'ANNULLATO');

-- CreateEnum
CREATE TYPE "StatoAgibilita" AS ENUM ('DA_CREARE', 'DATI_INCOMPLETI', 'PRONTA_INVIO', 'INVIATA_INPS', 'RICEVUTA_CARICATA', 'COMPLETATA', 'ERRORE');

-- CreateEnum
CREATE TYPE "StatoPagamentoArtista" AS ENUM ('DA_PAGARE', 'IN_ATTESA_INCASSO', 'PAGATO', 'ANTICIPATO');

-- CreateEnum
CREATE TYPE "TipoPagamentoArtista" AS ENUM ('STANDARD_15GG', 'ANTICIPATO', 'DOPO_INCASSO');

-- CreateEnum
CREATE TYPE "RischioLocale" AS ENUM ('BASSO', 'MEDIO', 'ALTO', 'BLOCCATO');

-- CreateTable
CREATE TABLE "Artista" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "nomeDarte" TEXT,
    "codiceFiscale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "telefonoSecondario" TEXT,
    "indirizzo" TEXT,
    "cap" TEXT,
    "citta" TEXT,
    "provincia" TEXT,
    "dataNascita" TIMESTAMP(3),
    "comuneNascita" TEXT,
    "provinciaNascita" TEXT,
    "tipoArtista" "TipoArtista" NOT NULL DEFAULT 'ALTRO',
    "cachetBase" DECIMAL(10,2),
    "capacitaMicrofono" BOOLEAN NOT NULL DEFAULT false,
    "stileMusicale" TEXT,
    "documentoIdentita" TEXT,
    "iban" TEXT,
    "tipoPagamento" "TipoPagamentoArtista" NOT NULL DEFAULT 'STANDARD_15GG',
    "note" TEXT,
    "noteInterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locale" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ragioneSociale" TEXT,
    "partitaIva" TEXT,
    "codiceFiscale" TEXT,
    "email" TEXT,
    "pec" TEXT,
    "telefono" TEXT,
    "indirizzoLegale" TEXT,
    "capLegale" TEXT,
    "cittaLegale" TEXT,
    "provinciaLegale" TEXT,
    "indirizzoEvento" TEXT,
    "capEvento" TEXT,
    "cittaEvento" TEXT,
    "provinciaEvento" TEXT,
    "referenteNome" TEXT,
    "referenteTelefono" TEXT,
    "referenteEmail" TEXT,
    "tipoEvento" "TipoEvento" NOT NULL DEFAULT 'ALTRO',
    "rischio" "RischioLocale" NOT NULL DEFAULT 'MEDIO',
    "creditSafeScore" INTEGER,
    "creditSafeData" TIMESTAMP(3),
    "iban" TEXT,
    "giorniPagamento" INTEGER NOT NULL DEFAULT 30,
    "note" TEXT,
    "noteInterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "localeId" TEXT NOT NULL,
    "artistaId" TEXT,
    "nome" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "oraInizio" TEXT,
    "oraFine" TEXT,
    "compensoLordo" DECIMAL(10,2),
    "compensoNetto" DECIMAL(10,2),
    "speseViaggio" DECIMAL(10,2),
    "speseAlloggio" DECIMAL(10,2),
    "stato" "StatoEvento" NOT NULL DEFAULT 'BOZZA',
    "note" TEXT,
    "noteInterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agibilita" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "artistaId" TEXT NOT NULL,
    "tipoAttivita" TEXT,
    "compensoLordo" DECIMAL(10,2) NOT NULL,
    "compensoNetto" DECIMAL(10,2),
    "contributiINPS" DECIMAL(10,2),
    "contributiAzienda" DECIMAL(10,2),
    "stato" "StatoAgibilita" NOT NULL DEFAULT 'DA_CREARE',
    "xmlPath" TEXT,
    "xmlGeneratoAt" TIMESTAMP(3),
    "ricevutaINPSPath" TEXT,
    "ricevutaCaricataAt" TIMESTAMP(3),
    "pdfArtistaPath" TEXT,
    "pdfGeneratoAt" TIMESTAMP(3),
    "statoPagamento" "StatoPagamentoArtista" NOT NULL DEFAULT 'DA_PAGARE',
    "dataPagamento" TIMESTAMP(3),
    "metodoPagamento" TEXT,
    "inviatoArtista" BOOLEAN NOT NULL DEFAULT false,
    "inviatoArtistaAt" TIMESTAMP(3),
    "inviatoLocale" BOOLEAN NOT NULL DEFAULT false,
    "inviatoLocaleAt" TIMESTAMP(3),
    "note" TEXT,
    "errore" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agibilita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL DEFAULT 'operatore',
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artista_codiceFiscale_key" ON "Artista"("codiceFiscale");

-- CreateIndex
CREATE INDEX "Artista_codiceFiscale_idx" ON "Artista"("codiceFiscale");

-- CreateIndex
CREATE INDEX "Artista_cognome_nome_idx" ON "Artista"("cognome", "nome");

-- CreateIndex
CREATE INDEX "Locale_partitaIva_idx" ON "Locale"("partitaIva");

-- CreateIndex
CREATE INDEX "Locale_nome_idx" ON "Locale"("nome");

-- CreateIndex
CREATE INDEX "Evento_data_idx" ON "Evento"("data");

-- CreateIndex
CREATE INDEX "Evento_localeId_idx" ON "Evento"("localeId");

-- CreateIndex
CREATE INDEX "Evento_artistaId_idx" ON "Evento"("artistaId");

-- CreateIndex
CREATE INDEX "Evento_stato_idx" ON "Evento"("stato");

-- CreateIndex
CREATE INDEX "Agibilita_eventoId_idx" ON "Agibilita"("eventoId");

-- CreateIndex
CREATE INDEX "Agibilita_artistaId_idx" ON "Agibilita"("artistaId");

-- CreateIndex
CREATE INDEX "Agibilita_stato_idx" ON "Agibilita"("stato");

-- CreateIndex
CREATE INDEX "Agibilita_statoPagamento_idx" ON "Agibilita"("statoPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_localeId_fkey" FOREIGN KEY ("localeId") REFERENCES "Locale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "Artista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
