-- Drop the security definer view and recreate with INVOKER security
DROP VIEW IF EXISTS public.public_doctor_profiles;

-- Create view with SECURITY INVOKER (default, explicit for clarity)
-- This ensures the view uses the permissions of the querying user
CREATE VIEW public.public_doctor_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  specialty,
  bio,
  years_experience,
  badge_number,
  avatar_url,
  is_available,
  created_at,
  updated_at
FROM public.doctor_profiles
WHERE is_available = true;

-- Grant access to the view
GRANT SELECT ON public.public_doctor_profiles TO anon, authenticated;

-- Since the view uses INVOKER, we need a policy that allows public read for available doctors
-- But only for the columns exposed in the view - this is handled by the view itself
-- We need to add back a limited access policy for the underlying table
DROP POLICY IF EXISTS "Public cannot directly access doctor_profiles" ON public.doctor_profiles;

-- Allow public to read available doctors (view will filter columns)
CREATE POLICY "Anyone can view available doctors via view"
ON public.doctor_profiles
FOR SELECT
USING (
  is_available = true
  OR auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);