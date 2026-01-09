-- CreateEnum
CREATE TYPE "FolderColor" AS ENUM ('Grey', 'Yellow', 'Orange', 'Red');

-- CreateTable
CREATE TABLE "NewsEvent" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eventTs" TIMESTAMPTZ(6) NOT NULL,
    "folderColor" "FolderColor" NOT NULL,
    "currencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,

    CONSTRAINT "NewsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsEvent_eventTs_idx" ON "NewsEvent"("eventTs");
