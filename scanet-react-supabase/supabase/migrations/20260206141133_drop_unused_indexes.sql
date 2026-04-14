/*
  # Drop Unused Indexes

  ## Overview
  Removes indexes that have never been used according to pg_stat_user_indexes.
  This reduces storage overhead and write amplification.

  ## Indexes Removed
  1. `idx_email_sequence_enrollments_contact` on email_sequence_enrollments(contact_id)
  2. `idx_scheduled_email_recipients_email_log_id` on scheduled_email_recipients(email_log_id)
  3. `idx_personal_objectives_status` on personal_objectives(status)
  4. `idx_personal_objectives_type` on personal_objectives(objective_type)
  5. `idx_personal_objectives_event_id` on personal_objectives(event_id)
*/

DROP INDEX IF EXISTS idx_email_sequence_enrollments_contact;
DROP INDEX IF EXISTS idx_scheduled_email_recipients_email_log_id;
DROP INDEX IF EXISTS idx_personal_objectives_status;
DROP INDEX IF EXISTS idx_personal_objectives_type;
DROP INDEX IF EXISTS idx_personal_objectives_event_id;
