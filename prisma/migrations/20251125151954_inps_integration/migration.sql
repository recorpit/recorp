-- AlterTable
ALTER TABLE "Agibilita" ADD COLUMN     "erroreINPS" TEXT,
ADD COLUMN     "esitoINPS" TEXT,
ADD COLUMN     "hashINPS" TEXT,
ADD COLUMN     "identificativoINPS" INTEGER,
ADD COLUMN     "identificativoOccupazioneINPS" INTEGER,
ADD COLUMN     "identificativoPeriodoINPS" INTEGER,
ADD COLUMN     "inviatoINPSAt" TIMESTAMP(3),
ADD COLUMN     "rispostaINPSAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ArtistaAgibilita" ADD COLUMN     "identificativoLavoratoreINPS" INTEGER;
