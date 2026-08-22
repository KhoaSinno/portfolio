-- A resume belongs to one authenticated Supabase user.  The column stays
-- nullable so the pre-existing portfolio resume can be claimed safely by its
-- owner on their next authenticated save or publish.
ALTER TABLE "Resume" ADD COLUMN "ownerId" TEXT;

CREATE UNIQUE INDEX "Resume_ownerId_key" ON "Resume"("ownerId");
