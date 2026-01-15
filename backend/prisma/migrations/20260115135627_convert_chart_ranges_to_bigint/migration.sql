/*
  Warnings:

  - You are about to alter the column `start` on the `Chart` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - You are about to alter the column `end` on the `Chart` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Chart" ALTER COLUMN "start" SET DATA TYPE BIGINT,
ALTER COLUMN "end" SET DATA TYPE BIGINT;
