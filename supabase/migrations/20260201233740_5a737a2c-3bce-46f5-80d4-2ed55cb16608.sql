-- Create doctor_schedules table for weekly recurring availability
CREATE TABLE public.doctor_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, day_of_week)
);

-- Create doctor_days_off table for specific dates off
CREATE TABLE public.doctor_days_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  date_off DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, date_off)
);

-- Enable RLS
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_days_off ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctor_schedules
CREATE POLICY "Doctors can view their own schedules"
  ON public.doctor_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert their own schedules"
  ON public.doctor_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their own schedules"
  ON public.doctor_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete their own schedules"
  ON public.doctor_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all schedules"
  ON public.doctor_schedules FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all schedules"
  ON public.doctor_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for doctor_days_off
CREATE POLICY "Doctors can view their own days off"
  ON public.doctor_days_off FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert their own days off"
  ON public.doctor_days_off FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete their own days off"
  ON public.doctor_days_off FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp 
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all days off"
  ON public.doctor_days_off FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all days off"
  ON public.doctor_days_off FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_doctor_schedules_updated_at
  BEFORE UPDATE ON public.doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for schedules
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_days_off;