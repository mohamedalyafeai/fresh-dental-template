-- Treatment reports written by doctors
CREATE TABLE public.treatment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_email text NOT NULL,
  patient_name text NOT NULL,
  doctor_id uuid NOT NULL,
  diagnosis text,
  treatment_done text NOT NULL,
  recommendations text,
  next_visit_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_reports TO authenticated;
GRANT ALL ON public.treatment_reports TO service_role;

ALTER TABLE public.treatment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own reports"
ON public.treatment_reports FOR ALL TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Admins and owners view all reports"
ON public.treatment_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and owners manage all reports"
ON public.treatment_reports FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Patients view own reports"
ON public.treatment_reports FOR SELECT TO authenticated
USING (patient_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_treatment_reports_patient ON public.treatment_reports(patient_email);
CREATE INDEX idx_treatment_reports_doctor ON public.treatment_reports(doctor_id);

CREATE TRIGGER trg_treatment_reports_updated_at
BEFORE UPDATE ON public.treatment_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track hourly reminders separately from the daily SMS reminder
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hour_reminder_sent boolean NOT NULL DEFAULT false;

-- Realtime for live patient record updates in the portal
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.prescriptions REPLICA IDENTITY FULL;
ALTER TABLE public.treatment_plans REPLICA IDENTITY FULL;
ALTER TABLE public.treatment_reports REPLICA IDENTITY FULL;
ALTER TABLE public.patient_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_plans; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_reports; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Run the 1-hour-before reminder check every 10 minutes
SELECT cron.schedule(
  'appointment-hour-reminder',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cyyrmlyubatbqvetwdpj.supabase.co/functions/v1/send-appointment-hour-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);