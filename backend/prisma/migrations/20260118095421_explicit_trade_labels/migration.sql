/*
  Warnings:

  - You are about to drop the `_LabelToTrade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_LabelToTrade" DROP CONSTRAINT "_LabelToTrade_A_fkey";

-- DropForeignKey
ALTER TABLE "_LabelToTrade" DROP CONSTRAINT "_LabelToTrade_B_fkey";

-- DropTable
DROP TABLE "_LabelToTrade";

-- CreateTable
CREATE TABLE "trade_labels" (
    "tradeId" INTEGER NOT NULL,
    "labelId" INTEGER NOT NULL,

    CONSTRAINT "trade_labels_pkey" PRIMARY KEY ("tradeId","labelId")
);

-- AddForeignKey
ALTER TABLE "trade_labels" ADD CONSTRAINT "trade_labels_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_labels" ADD CONSTRAINT "trade_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
