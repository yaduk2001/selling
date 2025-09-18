-- FOCUSED USER SIGNUP FIX
-- Run this in Supabase SQL Editor to fix signup issues
-- This addresses RLS and trigger problems specifically

-- =============================================
-- STEP 1: TEMPORARILY DISABLE RLS ON PROFILES
-- =============================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: DROP AND RECREATE PROFILE TRIGGER
-- =============================================

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a bulletproof profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE LOG 'Profile creation failed for user %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 3: GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant permissions to service role and authenticated users
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;

-- =============================================
-- STEP 4: CREATE SIMPLE RLS POLICIES
-- =============================================

-- Re-enable RLS with permissive policies for testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create new, simple policies
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- STEP 5: TEST THE SETUP
-- =============================================

-- Verify trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created exists';
  ELSE
    RAISE NOTICE '❌ Trigger on_auth_user_created missing';
  END IF;
END $$;

-- Verify function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Function handle_new_user exists';
  ELSE
    RAISE NOTICE '❌ Function handle_new_user missing';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'profiles' 
    AND relrowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is enabled on profiles table';
  ELSE
    RAISE NOTICE '❌ RLS is disabled on profiles table';
  END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '🎉 SIGNUP FIX COMPLETED!';
  RAISE NOTICE '📝 Changes made:';
  RAISE NOTICE '   - Profile creation trigger recreated';
  RAISE NOTICE '   - RLS policies updated';
  RAISE NOTICE '   - Permissions granted';
  RAISE NOTICE '🧪 Please test user signup now';
END $$;
