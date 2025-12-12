-- CreateTable
CREATE TABLE "MemoryBookChapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chapterText" TEXT NOT NULL,
    "summary" TEXT,
    "tags" TEXT[],
    "diaryEntryIds" TEXT[],
    "keyMoments" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryBookChapter_pkey" PRIMARY KEY ("id")
);
