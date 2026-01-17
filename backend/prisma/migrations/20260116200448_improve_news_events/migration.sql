-- AlterTable
ALTER TABLE "NewsEvent" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;
