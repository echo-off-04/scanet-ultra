/*
  # Add Extended Profile Fields

  ## Overview
  This migration adds additional profile fields to support user settings and preferences
  displayed in the Settings page.

  ## Changes
  1. Schema Changes - Add new columns to profiles table
    - `phone` (text) - User phone number
    - `bio` (text) - User biography/description
    - `website` (text) - User website URL
    - `linkedin` (text) - LinkedIn profile URL
    - `country` (text) - User country
    - `city` (text) - User city
    - `preferred_currency` (text) - Default currency for displaying amounts (EUR, USD, etc.)

  ## Notes
  - All new fields are nullable to support existing profiles
  - preferred_currency defaults to 'EUR' if not specified
  - These fields match the Settings form fields in the application
*/

-- Add phone field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Add bio field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
END $$;

-- Add website field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;
END $$;

-- Add linkedin field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN linkedin text;
  END IF;
END $$;

-- Add country field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text;
  END IF;
END $$;

-- Add city field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;
END $$;

-- Add preferred_currency field with default value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_currency text DEFAULT 'EUR';
  END IF;
END $$;