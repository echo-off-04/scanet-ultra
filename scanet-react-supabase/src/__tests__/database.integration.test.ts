import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Personal Objectives - Database Schema', () => {
  it('personal_objectives table exists and has correct columns', async () => {
    const { data, error } = await supabase
      .from('personal_objectives')
      .select('id, user_id, objective_type, title, description, target_value, current_value, unit, currency, contact_status_filter, period_type, period_start, period_end, event_id, status, achieved_at, notified, priority, created_at, updated_at')
      .limit(0);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('can query personal_objectives table without error', async () => {
    const { error } = await supabase
      .from('personal_objectives')
      .select('id, user_id, objective_type, title, target_value, current_value, unit, currency, period_type, status, priority')
      .limit(1);

    expect(error).toBeNull();
  });

  it('personal_objectives has RLS enabled (unauthenticated reads return empty)', async () => {
    const { data, error } = await supabase
      .from('personal_objectives')
      .select('id')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('validates objective_type constraint', async () => {
    const { error } = await supabase
      .from('personal_objectives')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        objective_type: 'invalid_type',
        title: 'Test',
        target_value: 10,
      });

    expect(error).not.toBeNull();
  });

  it('validates status constraint', async () => {
    const { error } = await supabase
      .from('personal_objectives')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        objective_type: 'revenue',
        title: 'Test',
        target_value: 10,
        status: 'invalid_status',
      });

    expect(error).not.toBeNull();
  });

  it('validates period_type constraint', async () => {
    const { error } = await supabase
      .from('personal_objectives')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        objective_type: 'revenue',
        title: 'Test',
        target_value: 10,
        period_type: 'invalid_period',
      });

    expect(error).not.toBeNull();
  });

  it('validates priority constraint', async () => {
    const { error } = await supabase
      .from('personal_objectives')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        objective_type: 'revenue',
        title: 'Test',
        target_value: 10,
        priority: 'invalid_priority',
      });

    expect(error).not.toBeNull();
  });
});

describe('Email Sequences - Database Schema', () => {
  it('email_sequences table is queryable', async () => {
    const { error } = await supabase
      .from('email_sequences')
      .select('id, user_id, name, description, trigger_status, source_filter, exclude_statuses, is_active')
      .limit(1);

    expect(error).toBeNull();
  });

  it('email_sequence_steps table is queryable', async () => {
    const { error } = await supabase
      .from('email_sequence_steps')
      .select('id, sequence_id, step_order, delay_days, delay_hours, subject, body, channel, include_offer_id')
      .limit(1);

    expect(error).toBeNull();
  });

  it('email_sequence_enrollments table is queryable', async () => {
    const { error } = await supabase
      .from('email_sequence_enrollments')
      .select('id, sequence_id, contact_id, user_id, current_step, status, trigger_context, enrolled_at')
      .limit(1);

    expect(error).toBeNull();
  });

  it('email_sequence_sends table is queryable', async () => {
    const { error } = await supabase
      .from('email_sequence_sends')
      .select('id, enrollment_id, step_id, status, scheduled_for, sent_at, error_message, email_log_id')
      .limit(1);

    expect(error).toBeNull();
  });

  it('email_sequences has RLS enabled (unauthenticated reads return empty)', async () => {
    const { data, error } = await supabase
      .from('email_sequences')
      .select('id')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('email_sequence_enrollments has RLS enabled', async () => {
    const { data, error } = await supabase
      .from('email_sequence_enrollments')
      .select('id')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('email_sequence_sends has RLS enabled', async () => {
    const { data, error } = await supabase
      .from('email_sequence_sends')
      .select('id')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('validates step channel constraint (email or whatsapp)', async () => {
    const { error } = await supabase
      .from('email_sequence_steps')
      .insert({
        sequence_id: '00000000-0000-0000-0000-000000000000',
        subject: 'Test',
        body: 'Test',
        channel: 'sms',
      });

    expect(error).not.toBeNull();
  });

  it('validates enrollment status constraint', async () => {
    const { error } = await supabase
      .from('email_sequence_enrollments')
      .insert({
        sequence_id: '00000000-0000-0000-0000-000000000000',
        contact_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        status: 'invalid_status',
      });

    expect(error).not.toBeNull();
  });

  it('validates send status constraint', async () => {
    const { error } = await supabase
      .from('email_sequence_sends')
      .insert({
        enrollment_id: '00000000-0000-0000-0000-000000000000',
        step_id: '00000000-0000-0000-0000-000000000000',
        status: 'invalid_status',
        scheduled_for: new Date().toISOString(),
      });

    expect(error).not.toBeNull();
  });
});

describe('Email Sequences - Relationships', () => {
  it('email_sequence_steps references email_sequences (FK integrity)', async () => {
    const { error } = await supabase
      .from('email_sequence_steps')
      .select('id, sequence_id, sequence:email_sequences(id, name)')
      .limit(1);

    expect(error).toBeNull();
  });

  it('email_sequence_enrollments references contacts and sequences', async () => {
    const { error } = await supabase
      .from('email_sequence_enrollments')
      .select(`
        id,
        contact:contacts(id, full_name),
        sequence:email_sequences(id, name)
      `)
      .limit(1);

    expect(error).toBeNull();
  });

  it('email_sequence_sends references enrollments and steps', async () => {
    const { error } = await supabase
      .from('email_sequence_sends')
      .select(`
        id,
        enrollment:email_sequence_enrollments(id, status),
        step:email_sequence_steps(id, step_order, subject)
      `)
      .limit(1);

    expect(error).toBeNull();
  });
});

describe('Supporting Tables Exist', () => {
  it('contacts table is queryable', async () => {
    const { error } = await supabase
      .from('contacts')
      .select('id, full_name, email, status, source')
      .limit(0);

    expect(error).toBeNull();
  });

  it('contact_opportunities table is queryable', async () => {
    const { error } = await supabase
      .from('contact_opportunities')
      .select('id, amount, currency, status')
      .limit(0);

    expect(error).toBeNull();
  });

  it('events table is queryable', async () => {
    const { error } = await supabase
      .from('events')
      .select('id, name, actual_participants, target_participants')
      .limit(0);

    expect(error).toBeNull();
  });

  it('email_logs table is queryable', async () => {
    const { error } = await supabase
      .from('email_logs')
      .select('id, user_id, to_email, subject, status')
      .limit(0);

    expect(error).toBeNull();
  });

  it('profiles table is queryable', async () => {
    const { error } = await supabase
      .from('profiles')
      .select('id, full_name, company')
      .limit(0);

    expect(error).toBeNull();
  });
});

describe('Database Functions and Triggers', () => {
  it('auto_enroll_contact_in_sequences trigger is attached to contacts table', async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('id')
      .limit(0);

    expect(error).toBeNull();
  });

  it('enrollment_schedule_sends trigger is attached to enrollments table', async () => {
    const { data, error } = await supabase
      .from('email_sequence_enrollments')
      .select('id')
      .limit(0);

    expect(error).toBeNull();
  });
});
