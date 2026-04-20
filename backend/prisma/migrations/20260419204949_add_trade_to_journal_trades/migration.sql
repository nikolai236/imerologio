/*
  Warnings:

  - A unique constraint covering the columns `[tradeId]` on the table `JournalTrade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "JournalTrade" ADD COLUMN     "tradeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "JournalTrade_tradeId_key" ON "JournalTrade"("tradeId");

-- AddForeignKey
ALTER TABLE "JournalTrade" ADD CONSTRAINT "JournalTrade_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
