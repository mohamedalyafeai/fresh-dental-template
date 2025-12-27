-- Allow admins to delete appointments
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));