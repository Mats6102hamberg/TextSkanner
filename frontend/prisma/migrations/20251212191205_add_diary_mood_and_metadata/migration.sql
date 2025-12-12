/*
  Warnings:

  - You are about to drop the column `translatedText` on the `DiaryEntry` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DiaryEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiaryEntry" DROP COLUMN "translatedText",
ADD COLUMN     "clarifiedText" TEXT,
ADD COLUMN     "detectedMood" TEXT,
ADD COLUMN     "entryDate" TIMESTAMP(3),
ADD COLUMN     "moodScore" DOUBLE PRECISION,
ADD COLUMN     "storyText" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ContractDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "rawText" TEXT NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAnalysis" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,
    "overallRisk" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,

    CONSTRAINT "ContractAnalysis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContractAnalysis" ADD CONSTRAINT "ContractAnalysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ContractDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
