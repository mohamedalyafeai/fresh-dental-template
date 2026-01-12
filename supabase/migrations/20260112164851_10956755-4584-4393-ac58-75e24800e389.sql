-- Create a secure view for public doctor listings that excludes phone numbers
CREATE OR REPLACE VIEW public.public_doctor_profiles AS
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

-- Drop the problematic public policy that exposes all columns
DROP POLICY IF EXISTS "Public can view available doctors basic info" ON public.doctor_profiles;

-- Create a more restrictive public policy - only allow access through proper channels
-- Public users should use the view, authenticated doctors/admins access full table
CREATE POLICY "Public cannot directly access doctor_profiles"
ON public.doctor_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);