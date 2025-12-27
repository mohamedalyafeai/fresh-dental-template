-- Allow admins to update appointments
CREATE POLICY "Admins can update appointments"
ON public.appointments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));