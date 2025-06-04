-- Update the is_onboarding_complete flag to true for all profiles
UPDATE public.profiles
SET is_onboarding_complete = true
WHERE is_onboarding_complete = false;

-- Verify the update
SELECT id, email, display_name, is_onboarding_complete
FROM public.profiles; 