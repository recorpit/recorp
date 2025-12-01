-- DropForeignKey
ALTER TABLE "Agibilita" DROP CONSTRAINT "Agibilita_committenteId_fkey";

-- AlterTable
ALTER TABLE "Agibilita" ALTER COLUMN "committenteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Agibilita" ADD CONSTRAINT "Agibilita_committenteId_fkey" FOREIGN KEY ("committenteId") REFERENCES "Committente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
