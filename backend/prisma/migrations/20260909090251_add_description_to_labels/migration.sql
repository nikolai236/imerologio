-- DropForeignKey
ALTER TABLE "LabelClosure" DROP CONSTRAINT "LabelClosure_ancestorId_fkey";

-- DropForeignKey
ALTER TABLE "LabelClosure" DROP CONSTRAINT "LabelClosure_descendantId_fkey";

-- AlterTable
ALTER TABLE "Label" ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "LabelClosure" ADD CONSTRAINT "LabelClosure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelClosure" ADD CONSTRAINT "LabelClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
