-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- CreateIndex
CREATE INDEX "WatchProgress_userId_idx" ON "WatchProgress"("userId");

-- CreateIndex
CREATE INDEX "WatchProgress_titleId_idx" ON "WatchProgress"("titleId");

-- CreateIndex
CREATE INDEX "WatchlistItem_titleId_idx" ON "WatchlistItem"("titleId");
