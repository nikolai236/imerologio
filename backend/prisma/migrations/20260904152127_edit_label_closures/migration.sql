/*
  Warnings:

  - You are about to drop the column `depth` on the `LabelClosure` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LabelClosure" DROP CONSTRAINT "LabelClosure_ancestorId_fkey";

-- DropForeignKey
ALTER TABLE "LabelClosure" DROP CONSTRAINT "LabelClosure_descendantId_fkey";

-- AlterTable
ALTER TABLE "LabelClosure" DROP COLUMN "depth";

-- AddForeignKey
ALTER TABLE "LabelClosure" ADD CONSTRAINT "LabelClosure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelClosure" ADD CONSTRAINT "LabelClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
