-- Create the profiles table for user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_onboarding_complete BOOLEAN DEFAULT false,
  roles TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles using DO blocks to check existence first
DO
$$
BEGIN
  -- Check if the SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public' 
    AND policyname = 'Allow authenticated users to view all profiles'
  ) THEN
    -- Create the SELECT policy
    CREATE POLICY "Allow authenticated users to view all profiles" 
      ON public.profiles 
      FOR SELECT 
      USING (auth.role() = 'authenticated');
  END IF;

  -- Check if the UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public' 
    AND policyname = 'Allow users to update their own profile'
  ) THEN
    -- Create the UPDATE policy
    CREATE POLICY "Allow users to update their own profile" 
      ON public.profiles 
      FOR UPDATE 
      USING (auth.uid() = id);
  END IF;

  -- Check if the INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public' 
    AND policyname = 'Allow users to insert their own profile'
  ) THEN
    -- Create the INSERT policy
    CREATE POLICY "Allow users to insert their own profile" 
      ON public.profiles 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON public.profiles (display_name);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', SPLIT_PART(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a new user is created
-- First check if the trigger already exists to avoid the error
DO
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$; 