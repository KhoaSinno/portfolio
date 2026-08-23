-- Bring database state created via prior db push under Prisma migration control.
ALTER TABLE "Resume" DROP CONSTRAINT IF EXISTS "Resume_ownerId_key";
DROP INDEX IF EXISTS "Resume_ownerId_key";
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Main Resume';
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "viewsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMP(3);

UPDATE "Resume" SET "title" = CASE WHEN "id" = 'portfolio-resume' THEN 'Fullstack General' ELSE 'Main Resume' END WHERE "title" IS NULL OR "title" = '';
UPDATE "Resume" SET "slug" = CONCAT('resume-', LEFT("id", 12)) WHERE "slug" IS NULL;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "ownerId" ORDER BY "isPrimary" DESC, "updatedAt" DESC) AS rank
  FROM "Resume" WHERE "ownerId" IS NOT NULL
)
UPDATE "Resume" r SET "isPrimary" = (ranked.rank = 1) FROM ranked WHERE r."id" = ranked."id";

CREATE UNIQUE INDEX IF NOT EXISTS "Resume_one_primary_per_owner" ON "Resume" ("ownerId") WHERE "isPrimary" = true;
CREATE INDEX IF NOT EXISTS "Resume_ownerId_updatedAt_idx" ON "Resume" ("ownerId", "updatedAt" DESC);

CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "jdLink" TEXT, "fileName" TEXT, "fileUrl" TEXT,
  "fileSize" INTEGER, "message" TEXT, "ip" TEXT, "status" TEXT NOT NULL DEFAULT 'UNREAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
