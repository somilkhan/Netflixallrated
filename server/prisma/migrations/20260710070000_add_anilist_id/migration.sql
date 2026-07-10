-- AlterTable
ALTER TABLE "Title" ADD COLUMN "anilistId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Title_anilistId_key" ON "Title"("anilistId");
