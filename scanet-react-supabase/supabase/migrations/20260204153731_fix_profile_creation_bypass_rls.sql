/*
  # Fix Profile Creation - Bypass RLS in Trigger Function

  1. Problem
    - RLS is still being applied even with SECURITY DEFINER
    - PostgreSQL applies RLS to SECURITY DEFINER functions by default
    - Need to explicitly disable RLS for the function execution

  2. Solution
    - Add `SET row_security = off` to the function
    - This tells PostgreSQL to bypass RLS when the function executes
    - Combined with SECURITY DEFINER, this allows profile creation during signup

  3. Security
    - Function still runs as owner (postgres) with SECURITY DEFINER
    - Only used by internal trigger on auth.users INSERT
    - No user-facing access to this function
*/

-- Drop and recreate the function with row_security disabled
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
SET row_security = off
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- Ensure trigger exists (should already exist from previous migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
