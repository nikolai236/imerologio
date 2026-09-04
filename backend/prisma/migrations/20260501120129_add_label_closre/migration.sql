-- CreateTable
CREATE TABLE "LabelClosure" (
    "ancestorId" INTEGER NOT NULL,
    "descendantId" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "LabelClosure_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateIndex
CREATE INDEX "LabelClosure_descendantId_idx" ON "LabelClosure"("descendantId");

-- AddForeignKey
ALTER TABLE "LabelClosure" ADD CONSTRAINT "LabelClosure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelClosure" ADD CONSTRAINT "LabelClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
