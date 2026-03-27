/*
  Warnings:

  - You are about to drop the column `date` on the `JournalEntry` table. All the data in the column will be lost.
  - Added the required column `from` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "date",
ADD COLUMN     "from" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "to" TIMESTAMP(3) NOT NULL;
