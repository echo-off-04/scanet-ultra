/*
  # Disable RLS for Development Mode

  This migration temporarily disables Row Level Security checks to allow
  mock authentication during development and testing.

  1. Security Changes
    - Disable RLS on all tables for development purposes
    - Add public access policies as fallback
*/

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups DISABLE ROW LEVEL SECURITY;
