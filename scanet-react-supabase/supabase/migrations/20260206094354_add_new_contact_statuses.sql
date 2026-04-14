/*
  # Add New Contact Statuses

  ## Overview
  Extends the contact status options to include additional relationship types:
  - collaborateur (collaborator/coworker)
  - ami (friend)
  - fournisseur (supplier/vendor)

  ## Changes
  1. Modified Tables
    - `contacts` - Updated status CHECK constraint to allow new values
    - Also updates the `source` constraint to include 'team' as a valid source

  ## Notes
  - Existing data is preserved, no destructive changes
  - New statuses enable more granular contact categorization
*/

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('lead', 'prospect', 'client', 'partner', 'collaborateur', 'ami', 'fournisseur'));

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_source_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_source_check
  CHECK (source IN ('event', 'referral', 'cold_outreach', 'team'));
