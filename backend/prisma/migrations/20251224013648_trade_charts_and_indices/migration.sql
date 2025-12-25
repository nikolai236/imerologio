-- CreateTable
CREATE TABLE "Chart" (
    "id" SERIAL NOT NULL,
    "timeframe" INTEGER NOT NULL,
    "start" DECIMAL(65,30) NOT NULL,
    "end" DECIMAL(65,30) NOT NULL,
    "tradeId" INTEGER NOT NULL,

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chart_tradeId_idx" ON "Chart"("tradeId");

-- CreateIndex
CREATE INDEX "Trade_symbolId_idx" ON "Trade"("symbolId");

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
