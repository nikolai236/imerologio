/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `JournalEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_title_key" ON "JournalEntry"("title");
