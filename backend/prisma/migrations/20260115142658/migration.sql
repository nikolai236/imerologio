/*
  Warnings:

  - The values [CFD] on the enum `SymbolType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SymbolType_new" AS ENUM ('Stock', 'ETF', 'Futures', 'Forex', 'Commodity', 'Crypto', 'Security');
ALTER TABLE "Symbol" ALTER COLUMN "type" TYPE "SymbolType_new" USING ("type"::text::"SymbolType_new");
ALTER TYPE "SymbolType" RENAME TO "SymbolType_old";
ALTER TYPE "SymbolType_new" RENAME TO "SymbolType";
DROP TYPE "public"."SymbolType_old";
COMMIT;
