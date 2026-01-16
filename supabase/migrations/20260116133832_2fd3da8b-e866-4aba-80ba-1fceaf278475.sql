-- Enable the pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension for HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to track scheduled SMS reminder jobs
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL UNIQUE,
  schedule TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scheduled_jobs
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify scheduled jobs
CREATE POLICY "Admins can view scheduled jobs"
  ON public.scheduled_jobs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update scheduled jobs"
  ON public.scheduled_jobs
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Insert the SMS reminder job configuration (6:00 PM daily = 18:00)
INSERT INTO public.scheduled_jobs (job_name, schedule, enabled)
VALUES ('sms_appointment_reminder', '0 18 * * *', true)
ON CONFLICT (job_name) DO UPDATE SET schedule = '0 18 * * *';

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_jobs_updated_at
  BEFORE UPDATE ON public.scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Schedule the cron job to call the edge function daily at 6:00 PM (18:00 UTC)
-- Note: The actual HTTP call will be made using pg_net
SELECT cron.schedule(
  'sms-reminder-daily',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cyyrmlyubatbqvetwdpj.supabase.co/functions/v1/send-sms-reminder-scheduled',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);