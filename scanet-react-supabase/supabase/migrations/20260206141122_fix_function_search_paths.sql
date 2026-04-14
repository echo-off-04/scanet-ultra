/*
  # Fix Mutable search_path on Functions

  ## Overview
  Sets an immutable search_path on functions to prevent search_path injection attacks.

  ## Functions Fixed
  1. `update_personal_objectives_updated_at` - Trigger function for updated_at
  2. `auto_enroll_contact_in_sequences` - Trigger to auto-enroll contacts in email sequences
  3. `schedule_sequence_step_sends` - Trigger to schedule email sends on enrollment

  ## Security
  - Each function now has `SET search_path = ''` to prevent search_path manipulation
  - All table references use explicit `public.` schema prefix
*/

CREATE OR REPLACE FUNCTION public.update_personal_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.auto_enroll_contact_in_sequences()
RETURNS TRIGGER AS $$
DECLARE
  seq RECORD;
  event_name text;
  event_date text;
BEGIN
  event_name := NULL;
  event_date := NULL;

  IF NEW.source = 'event' THEN
    SELECT e.name, to_char(e.start_date, 'DD/MM/YYYY')
    INTO event_name, event_date
    FROM public.contact_events ce
    JOIN public.events e ON e.id = ce.event_id
    WHERE ce.contact_id = NEW.id
    ORDER BY ce.created_at DESC
    LIMIT 1;
  END IF;

  FOR seq IN
    SELECT id FROM public.email_sequences
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND trigger_status = NEW.status
      AND (source_filter IS NULL OR source_filter = NEW.source)
      AND NOT (NEW.status = ANY(exclude_statuses))
  LOOP
    INSERT INTO public.email_sequence_enrollments (sequence_id, contact_id, user_id, trigger_context)
    VALUES (
      seq.id,
      NEW.id,
      NEW.user_id,
      jsonb_build_object(
        'contact_name', NEW.full_name,
        'contact_email', COALESCE(NEW.email, ''),
        'contact_phone', COALESCE(NEW.phone, ''),
        'contact_company', COALESCE(NEW.company, ''),
        'source', COALESCE(NEW.source, ''),
        'event_name', COALESCE(event_name, ''),
        'event_date', COALESCE(event_date, '')
      )
    )
    ON CONFLICT (sequence_id, contact_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.schedule_sequence_step_sends()
RETURNS TRIGGER AS $$
DECLARE
  step RECORD;
  cumulative_interval interval;
BEGIN
  cumulative_interval := interval '0';

  FOR step IN
    SELECT * FROM public.email_sequence_steps
    WHERE sequence_id = NEW.sequence_id
    ORDER BY step_order ASC
  LOOP
    cumulative_interval := cumulative_interval
      + (step.delay_days || ' days')::interval
      + (step.delay_hours || ' hours')::interval;

    INSERT INTO public.email_sequence_sends (enrollment_id, step_id, status, scheduled_for)
    VALUES (NEW.id, step.id, 'pending', NEW.enrolled_at + cumulative_interval);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
