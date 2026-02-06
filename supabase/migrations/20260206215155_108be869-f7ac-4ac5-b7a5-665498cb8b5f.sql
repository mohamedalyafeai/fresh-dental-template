-- Drop the old policy that has the auth.users reference issue
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;

-- Create a new policy using the get_user_email function which has SECURITY DEFINER
CREATE POLICY "Patients can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  patient_email = get_user_email(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);