-- Fix: Update RLS policy for doctor_profiles to not expose phone/badge to unauthenticated public queries
-- The "Anyone can view available doctors via view" policy allows direct access to doctor_profiles
-- We need to restrict direct access and force use of the public view

-- Drop the problematic policy that allows public access to full doctor_profiles
DROP POLICY IF EXISTS "Anyone can view available doctors via view" ON public.doctor_profiles;

-- Add SELECT policy for admins to view all appointments (fixing the missing policy)
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));