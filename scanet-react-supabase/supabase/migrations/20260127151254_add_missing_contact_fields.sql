/*
  # Add missing contact fields
  
  1. Changes
    - Add `address` column to contacts table
    - Add `website` column to contacts table  
    - Add `linkedin` column to contacts table (renaming from linkedin_url)
    - Add `twitter` column to contacts table
    
  2. Notes
    - These fields are needed for contact profile management
    - Using IF NOT EXISTS to prevent errors if columns already exist
*/

DO $$
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'address'
  ) THEN
    ALTER TABLE contacts ADD COLUMN address text;
  END IF;

  -- Add website column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'website'
  ) THEN
    ALTER TABLE contacts ADD COLUMN website text;
  END IF;

  -- Add twitter column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'twitter'
  ) THEN
    ALTER TABLE contacts ADD COLUMN twitter text;
  END IF;

  -- Add linkedin column if it doesn't exist (as alias for linkedin_url)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE contacts ADD COLUMN linkedin text;
    -- Copy data from linkedin_url if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contacts' AND column_name = 'linkedin_url'
    ) THEN
      UPDATE contacts SET linkedin = linkedin_url WHERE linkedin_url IS NOT NULL;
    END IF;
  END IF;
END $$;
