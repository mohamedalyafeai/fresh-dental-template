-- Fix: Update public_doctor_profiles view to only include necessary non-sensitive fields
DROP VIEW IF EXISTS public.public_doctor_profiles;

CREATE VIEW public.public_doctor_profiles
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    specialty,
    bio,
    years_experience,
    is_available,
    avatar_url,
    created_at,
    updated_at
    -- Excluded: phone (personal info), badge_number (professional credential - could be used for fraud)
  FROM public.doctor_profiles
  WHERE is_available = true;

-- Mark clinic settings exposure as intentional (it's a business listing)
COMMENT ON POLICY "Anyone can view clinic settings" ON public.clinic_settings IS 'Intentionally public - clinic contact info is meant to be discoverable by patients seeking care';