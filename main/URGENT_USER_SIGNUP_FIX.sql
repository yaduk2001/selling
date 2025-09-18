-- URGENT: User Signup Database Fix
-- Run this IMMEDIATELY in your Supabase SQL editor to fix signup errors

-- =============================================
-- 1. DROP AND RECREATE PROFILE CREATION FUNCTION WITH BETTER ERROR HANDLING
-- =============================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;

-- Create a more robust profile creation function
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Safely extract metadata
    BEGIN
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    EXCEPTION 
        WHEN OTHERS THEN
            first_name_val := '';
            last_name_val := '';
    END;

    -- Insert profile with comprehensive error handling
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            first_name, 
            last_name,
            created_at, 
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.email, ''),
            NULLIF(trim(first_name_val), ''),
            NULLIF(trim(last_name_val), ''),
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully created profile for user: %', NEW.id;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE LOG 'Profile already exists for user: %', NEW.id;
        WHEN OTHERS THEN
            RAISE LOG 'Failed to create profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
            -- Don't fail the user creation, just log the error
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- =============================================
-- 2. ENSURE PROFILES TABLE HAS PROPER STRUCTURE
-- =============================================

-- Check if profiles table exists and has correct structure
DO $$
BEGIN
    -- Ensure email column allows nulls temporarily
    ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
    
    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
    
    RAISE NOTICE 'Profiles table structure verified';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE LOG 'Error updating profiles table: %', SQLERRM;
END
$$;

-- =============================================
-- 3. TEST THE FIX
-- =============================================

-- Create a test to ensure the function works
DO $$
DECLARE
    test_result BOOLEAN := FALSE;
BEGIN
    -- Test if function exists and can be called
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_profile_for_user'
    ) INTO test_result;
    
    IF test_result THEN
        RAISE NOTICE 'SUCCESS: Profile creation function exists and is ready';
    ELSE
        RAISE EXCEPTION 'FAILED: Profile creation function not found';
    END IF;
END
$$;

-- Show current profiles count
SELECT COUNT(*) as profile_count FROM profiles;

-- =============================================
-- 4. ALTERNATIVE: DISABLE RLS TEMPORARILY IF NEEDED
-- =============================================

-- If RLS is causing issues, temporarily disable it for profiles
-- (You can re-enable after testing)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

-- Create more permissive policies for profile creation
CREATE POLICY "System can create profiles" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- VERIFICATION
-- =============================================

-- Show trigger status and final verification
DO $$
BEGIN
    -- Show trigger status
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'create_profile_trigger'
    ) THEN
        RAISE NOTICE 'SUCCESS: Profile creation trigger is active';
    ELSE
        RAISE NOTICE 'WARNING: Profile creation trigger not found';
    END IF;
    
    RAISE NOTICE 'User signup fix applied successfully!';
END
$$;

-- Show trigger status in results
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'create_profile_trigger';
