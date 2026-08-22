-- A stable, public URL identifier is assigned automatically for every owner.
ALTER TABLE "Resume" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "Resume_slug_key" ON "Resume"("slug");
