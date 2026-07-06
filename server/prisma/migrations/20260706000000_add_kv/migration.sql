-- CreateTable
CREATE TABLE "KV" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KV_pkey" PRIMARY KEY ("key")
);
