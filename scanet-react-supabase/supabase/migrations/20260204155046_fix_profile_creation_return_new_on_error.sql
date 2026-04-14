/*
  # Fix Profile Creation - Return NEW on Error

  1. Problem
    - The trigger function raises an exception on error, which causes the entire signup transaction to fail
    - When RAISE; is called in the EXCEPTION block, it aborts the user creation in auth.users
    - This results in "Database error saving new user" error during signup

  2. Solution
    - Change the EXCEPTION handler to return NEW instead of raising the exception
    - This allows the user to be created in auth.users even if profile creation fails
    - Errors are still logged for debugging, but don't block user creation

  3. Security
    - Function still runs as postgres with SECURITY DEFINER
    - RLS is bypassed with row_security = off
    - Only triggered by internal auth.users INSERT
    - Profile can be created manually later if trigger fails
*/

-- Recreate the function to return NEW on error instead of raising
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
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
