-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalTrade" (
    "id" SERIAL NOT NULL,
    "target" DECIMAL(65,30),
    "stop" DECIMAL(65,30) NOT NULL,
    "pnl" DECIMAL(65,30) NOT NULL,
    "journalEntryId" INTEGER NOT NULL,
    "symbolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalOrder" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "type" "OrderType" NOT NULL,
    "tradeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalChart" (
    "id" SERIAL NOT NULL,
    "timeframe" INTEGER NOT NULL,
    "start" BIGINT NOT NULL,
    "end" BIGINT NOT NULL,
    "objects" JSONB NOT NULL DEFAULT '{}',
    "journalEntryId" INTEGER NOT NULL,
    "symbolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalChart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JournalTrade" ADD CONSTRAINT "JournalTrade_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalTrade" ADD CONSTRAINT "JournalTrade_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalOrder" ADD CONSTRAINT "JournalOrder_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "JournalTrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalChart" ADD CONSTRAINT "JournalChart_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalChart" ADD CONSTRAINT "JournalChart_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
