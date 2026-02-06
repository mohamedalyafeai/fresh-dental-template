-- Add policy to allow anyone to view profile names of users who are doctors/admins
-- This is needed for displaying doctor names in appointments and booking
CREATE POLICY "Anyone can view admin/doctor profile names" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = profiles.user_id 
    AND user_roles.role = 'admin'
  )
);