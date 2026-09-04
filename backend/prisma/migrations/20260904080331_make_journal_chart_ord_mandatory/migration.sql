/*
  Warnings:

  - Made the column `ord` on table `JournalChart` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "JournalChart" ALTER COLUMN "ord" SET NOT NULL;
