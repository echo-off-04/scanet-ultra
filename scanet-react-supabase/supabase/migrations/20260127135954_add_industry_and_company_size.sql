/*
  # Add Industry and Company Size Fields

  1. Changes
    - Add industry field for business sector categorization
    - Add company_size field for company size classification

  2. New Columns
    - `industry` (text) - Industry/business sector (Technology, Finance, Healthcare, etc.)
    - `company_size` (text) - Company size category (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+, freelance)

  3. Security
    - No RLS changes needed (already disabled for development)
*/

-- Add industry field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'industry'
  ) THEN
    ALTER TABLE contacts ADD COLUMN industry text;
  END IF;
END $$;

-- Add company_size field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE contacts ADD COLUMN company_size text CHECK (
      company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'freelance', 'self-employed')
    );
  END IF;
END $$;

-- Create indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);
CREATE INDEX IF NOT EXISTS idx_contacts_company_size ON contacts(company_size);
