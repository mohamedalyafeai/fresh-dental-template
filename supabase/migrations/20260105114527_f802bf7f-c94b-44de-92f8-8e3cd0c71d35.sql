-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own waiting list entries" ON public.waiting_list;

-- Create a fixed policy that uses auth.email() instead of querying auth.users
CREATE POLICY "Users can view their own waiting list entries" 
ON public.waiting_list 
FOR SELECT 
USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  OR has_role(auth.uid(), 'admin'::app_role)
);