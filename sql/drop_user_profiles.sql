-- Drop the user_profiles table if it exists
DROP TABLE IF EXISTS public.user_profiles;

-- Make sure any triggers or functions related to user_profiles are also dropped
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Find and drop any triggers that reference user_profiles
    FOR trigger_rec IN 
        SELECT tgname, relname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'user_profiles'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                      trigger_rec.tgname, 'public', trigger_rec.relname);
    END LOOP;
END $$;

-- Ensure the profiles table exists and has correct structure
-- This is a redundant check since we already created it
SELECT EXISTS (
   SELECT FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename = 'profiles'
); 