/*
  Warnings:

  - You are about to drop the column `eventTs` on the `NewsEvent` table. All the data in the column will be lost.
  - Added the required column `date` to the `NewsEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "NewsEvent_eventTs_idx";

-- AlterTable
ALTER TABLE "NewsEvent" DROP COLUMN "eventTs",
ADD COLUMN     "date" TIMESTAMPTZ(3) NOT NULL;

-- CreateIndex
CREATE INDEX "NewsEvent_date_idx" ON "NewsEvent"("date");
