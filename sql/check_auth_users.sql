-- Check if there are any users in the auth.users table
SELECT id, email, created_at FROM auth.users;

-- This will create a profile for each user that doesn't have one
INSERT INTO public.profiles (id, email, display_name, is_onboarding_complete, created_at, updated_at)
SELECT 
  au.id, 
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)) as display_name,
  true as is_onboarding_complete,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verify profiles after insert
SELECT * FROM public.profiles; 