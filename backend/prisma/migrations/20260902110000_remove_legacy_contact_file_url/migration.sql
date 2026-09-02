-- Phase 3 cleanup: no legacy public attachment URL may remain in the contact model.
-- Existing contact messages remain intact; only the obsolete public URL metadata is removed.
ALTER TABLE "ContactMessage" DROP COLUMN "fileUrl";
