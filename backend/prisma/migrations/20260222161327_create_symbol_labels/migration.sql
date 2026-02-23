/*
  Warnings:

  - A unique constraint covering the columns `[symbolId]` on the table `Label` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Label" ADD COLUMN     "symbolId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Label_symbolId_key" ON "Label"("symbolId");

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;