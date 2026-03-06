
CREATE TABLE public.patient_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own notifications"
  ON public.patient_notifications
  FOR SELECT
  TO authenticated
  USING (patient_email = get_user_email(auth.uid()));

CREATE POLICY "Patients can update own notifications"
  ON public.patient_notifications
  FOR UPDATE
  TO authenticated
  USING (patient_email = get_user_email(auth.uid()));

CREATE POLICY "Admins can manage notifications"
  ON public.patient_notifications
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_notifications;
