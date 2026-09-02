-- Phase 3: migrate the public contact form from a recruiter-only/public-upload
-- record to a general contact inbox with private attachment paths.
CREATE TYPE "ContactTopic" AS ENUM ('HIRING', 'COLLABORATION', 'GENERAL');
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'REVIEWED', 'FOLLOW_UP', 'ARCHIVED');
CREATE TYPE "ContactNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

ALTER TABLE "ContactMessage"
  ADD COLUMN "topic" "ContactTopic" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "attachmentPath" TEXT,
  ADD COLUMN "attachmentMimeType" TEXT,
  ADD COLUMN "internalNote" TEXT,
  ADD COLUMN "notificationStatus" "ContactNotificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "notificationError" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Legacy contact submissions permitted an empty note. Preserve the row and make
-- the new required message field explicit rather than losing historical records.
UPDATE "ContactMessage"
SET "message" = 'No message provided (legacy contact).'
WHERE "message" IS NULL OR btrim("message") = '';

ALTER TABLE "ContactMessage"
  ALTER COLUMN "message" SET NOT NULL,
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ContactStatus"
    USING (
      CASE upper("status")
        WHEN 'ARCHIVED' THEN 'ARCHIVED'
        WHEN 'FOLLOW_UP' THEN 'FOLLOW_UP'
        WHEN 'REVIEWED' THEN 'REVIEWED'
        ELSE 'NEW'
      END
    )::"ContactStatus",
  ALTER COLUMN "status" SET DEFAULT 'NEW';

CREATE UNIQUE INDEX "ContactMessage_attachmentPath_key"
  ON "ContactMessage"("attachmentPath");
