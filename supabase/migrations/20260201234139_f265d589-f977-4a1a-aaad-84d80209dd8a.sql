-- Fix 1: Update the public_doctor_profiles view to exclude phone
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
    badge_number,
    created_at,
    updated_at
    -- phone is intentionally excluded for privacy
  FROM public.doctor_profiles
  WHERE is_available = true;

-- Fix 2: Add SELECT policy for doctors to view their assigned appointments
CREATE POLICY "Doctors can view their assigned appointments"
  ON public.appointments FOR SELECT
  USING (doctor_id = auth.uid());

-- Fix 3: Update waiting_list INSERT policy to require authentication
DROP POLICY IF EXISTS "Anyone can add to waiting list" ON public.waiting_list;

CREATE POLICY "Authenticated users can add to waiting list"
  ON public.waiting_list FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);