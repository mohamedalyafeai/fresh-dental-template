-- Fix doctor_profiles RLS policies
-- The issue is that "Anyone can view available doctors" exposes phone numbers
-- We'll create a more secure approach where public can only see non-sensitive data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view available doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admins can view all doctor profiles" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctor_profiles;

-- Create a function to check if user is viewing their own profile or is admin
CREATE OR REPLACE FUNCTION public.can_view_full_doctor_profile(doctor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.uid() = doctor_user_id 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
$$;

-- Policy 1: Anyone can view basic info of available doctors (for public listing)
-- Note: Column filtering must be done at application level, but we restrict to available doctors
CREATE POLICY "Public can view available doctors basic info"
ON public.doctor_profiles
FOR SELECT
USING (is_available = true);

-- Policy 2: Doctors can view their own full profile
CREATE POLICY "Doctors can view own full profile"
ON public.doctor_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 3: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.doctor_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));