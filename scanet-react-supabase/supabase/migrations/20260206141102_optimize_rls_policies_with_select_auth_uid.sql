/*
  # Optimize RLS Policies with (select auth.uid())

  ## Overview
  Replaces `auth.uid()` with `(select auth.uid())` in RLS policies to avoid
  re-evaluating the function for each row. This produces better query plans at scale.

  ## Tables Affected
  1. `personal_objectives` - 4 policies (select, insert, update, delete)
  2. `email_sequences` - 4 policies (select, insert, update, delete)
  3. `email_sequence_steps` - 4 policies (select, insert, update, delete)
  4. `email_sequence_enrollments` - 4 policies (select, insert, update, delete)
  5. `email_sequence_sends` - 3 policies (select, insert, update)

  ## Changes
  - DROP and recreate each policy with `(select auth.uid())` instead of `auth.uid()`
*/

-- personal_objectives policies
DROP POLICY IF EXISTS "Users can view own personal objectives" ON personal_objectives;
CREATE POLICY "Users can view own personal objectives"
  ON personal_objectives FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own personal objectives" ON personal_objectives;
CREATE POLICY "Users can create own personal objectives"
  ON personal_objectives FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own personal objectives" ON personal_objectives;
CREATE POLICY "Users can update own personal objectives"
  ON personal_objectives FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own personal objectives" ON personal_objectives;
CREATE POLICY "Users can delete own personal objectives"
  ON personal_objectives FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- email_sequences policies
DROP POLICY IF EXISTS "Users can select own sequences" ON email_sequences;
CREATE POLICY "Users can select own sequences"
  ON email_sequences FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own sequences" ON email_sequences;
CREATE POLICY "Users can insert own sequences"
  ON email_sequences FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sequences" ON email_sequences;
CREATE POLICY "Users can update own sequences"
  ON email_sequences FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own sequences" ON email_sequences;
CREATE POLICY "Users can delete own sequences"
  ON email_sequences FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- email_sequence_steps policies
DROP POLICY IF EXISTS "Users can select own sequence steps" ON email_sequence_steps;
CREATE POLICY "Users can select own sequence steps"
  ON email_sequence_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can insert own sequence steps" ON email_sequence_steps;
CREATE POLICY "Users can insert own sequence steps"
  ON email_sequence_steps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update own sequence steps" ON email_sequence_steps;
CREATE POLICY "Users can update own sequence steps"
  ON email_sequence_steps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can delete own sequence steps" ON email_sequence_steps;
CREATE POLICY "Users can delete own sequence steps"
  ON email_sequence_steps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = (select auth.uid())));

-- email_sequence_enrollments policies
DROP POLICY IF EXISTS "Users can select own enrollments" ON email_sequence_enrollments;
CREATE POLICY "Users can select own enrollments"
  ON email_sequence_enrollments FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON email_sequence_enrollments;
CREATE POLICY "Users can insert own enrollments"
  ON email_sequence_enrollments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON email_sequence_enrollments;
CREATE POLICY "Users can update own enrollments"
  ON email_sequence_enrollments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own enrollments" ON email_sequence_enrollments;
CREATE POLICY "Users can delete own enrollments"
  ON email_sequence_enrollments FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- email_sequence_sends policies
DROP POLICY IF EXISTS "Users can select own sequence sends" ON email_sequence_sends;
CREATE POLICY "Users can select own sequence sends"
  ON email_sequence_sends FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can insert own sequence sends" ON email_sequence_sends;
CREATE POLICY "Users can insert own sequence sends"
  ON email_sequence_sends FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update own sequence sends" ON email_sequence_sends;
CREATE POLICY "Users can update own sequence sends"
  ON email_sequence_sends FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = (select auth.uid())));
