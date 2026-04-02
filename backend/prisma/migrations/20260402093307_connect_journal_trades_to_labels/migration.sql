-- CreateTable
CREATE TABLE "JournalTradeLabel" (
    "tradeId" INTEGER NOT NULL,
    "labelId" INTEGER NOT NULL,

    CONSTRAINT "JournalTradeLabel_pkey" PRIMARY KEY ("tradeId","labelId")
);

-- AddForeignKey
ALTER TABLE "JournalTradeLabel" ADD CONSTRAINT "JournalTradeLabel_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "JournalTrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalTradeLabel" ADD CONSTRAINT "JournalTradeLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
