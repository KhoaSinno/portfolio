CREATE TABLE "public_resume_snapshots" (
  "key" TEXT NOT NULL,
  "resumeId" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "sourceUpdatedAt" TIMESTAMP(3),
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_resume_snapshots_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "public_resume_snapshots_resumeId_key"
  ON "public_resume_snapshots"("resumeId");
