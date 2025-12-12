/*
  Warnings:

  - You are about to drop the column `chapterText` on the `MemoryBookChapter` table. All the data in the column will be lost.
  - You are about to drop the column `diaryEntryIds` on the `MemoryBookChapter` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `MemoryBookChapter` table. All the data in the column will be lost.
  - You are about to drop the column `keyMoments` on the `MemoryBookChapter` table. All the data in the column will be lost.
  - Added the required column `content` to the `MemoryBookChapter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemoryBookChapter" DROP COLUMN "chapterText",
DROP COLUMN "diaryEntryIds",
DROP COLUMN "generatedAt",
DROP COLUMN "keyMoments",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sourceEntryIds" TEXT[];
