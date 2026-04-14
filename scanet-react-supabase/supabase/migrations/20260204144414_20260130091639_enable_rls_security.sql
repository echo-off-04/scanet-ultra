/*
  # Enable Row Level Security (RLS)

  1. Security Changes
    - Enable RLS on all tables to ensure data isolation between users
    - Each user can only access their own data
    - Maintains existing RLS policies that were created in the initial migration
  
  2. Tables Affected
    - profiles: Users can only view/update their own profile
    - contacts: Users can only view/create/update/delete their own contacts
    - events: Users can only view/create/update/delete their own events
    - contact_events: Users can only access contact-event relationships for their own contacts
    - interactions: Users can only access their own interactions
    - follow_ups: Users can only access their own follow-ups
    - contact_opportunities: Users can only access opportunities for their own contacts
    - offers: Users can only access their own offers
    - enterprises: Users can only access their own enterprise data
*/

-- Enable RLS on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Enable RLS on opportunity tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_opportunities') THEN
    ALTER TABLE contact_opportunities ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on offers table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
    ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on enterprise tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprises') THEN
    ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on contact groups tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_groups') THEN
    ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_group_members') THEN
    ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on event objectives if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_objectives') THEN
    ALTER TABLE event_objectives ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;