-- CreateTable
CREATE TABLE "LabelEdge" (
    "parentId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,

    CONSTRAINT "LabelEdge_pkey" PRIMARY KEY ("parentId","childId")
);

-- CreateIndex
CREATE INDEX "LabelEdge_childId_idx" ON "LabelEdge"("childId");

-- AddForeignKey
ALTER TABLE "LabelEdge" ADD CONSTRAINT "LabelEdge_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelEdge" ADD CONSTRAINT "LabelEdge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
