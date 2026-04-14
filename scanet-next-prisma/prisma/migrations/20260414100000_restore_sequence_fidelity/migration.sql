ALTER TABLE "email_sequences"
ADD COLUMN IF NOT EXISTS "trigger_status" TEXT,
ADD COLUMN IF NOT EXISTS "source_filter" TEXT,
ADD COLUMN IF NOT EXISTS "exclude_statuses" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "email_sequences"
SET "trigger_status" = COALESCE("trigger_status", 'lead')
WHERE "trigger_status" IS NULL;

ALTER TABLE "email_sequence_sends"
ADD COLUMN IF NOT EXISTS "error_message" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'EnrollmentStatus' AND e.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE "EnrollmentStatus" ADD VALUE 'cancelled';
  END IF;
END $$;