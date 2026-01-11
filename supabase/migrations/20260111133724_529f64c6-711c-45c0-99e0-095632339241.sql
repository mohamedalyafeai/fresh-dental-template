-- Drop the overly permissive policy that exposes patient data
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;

-- Create a policy for patients to view only their own appointments (by matching email)
CREATE POLICY "Patients can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  -- Allow if user email matches patient email, or user is admin
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Update the insert policy to be more specific (require authentication)
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

CREATE POLICY "Authenticated users can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  -- Require the user to be authenticated
  auth.uid() IS NOT NULL
);