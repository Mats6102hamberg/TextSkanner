-- CreateTable
CREATE TABLE "FamilyEntityDraft" (
    "id" TEXT NOT NULL,
    "sourceEntryIds" TEXT[],
    "entities" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyEntityDraft_pkey" PRIMARY KEY ("id")
);
