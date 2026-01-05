-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own waiting list entries" ON public.waiting_list;

-- Create a security definer function to safely get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;

-- Create a fixed policy using the security definer function
CREATE POLICY "Users can view their own waiting list entries" 
ON public.waiting_list 
FOR SELECT 
USING (
  patient_email = public.get_user_email(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);