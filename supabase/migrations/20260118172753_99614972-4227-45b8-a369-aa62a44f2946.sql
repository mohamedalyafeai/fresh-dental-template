-- Create clinic_settings table for owner configuration
CREATE TABLE public.clinic_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name text NOT NULL DEFAULT 'BrightSmile Dental',
    clinic_logo_url text,
    phone text,
    email text,
    address text,
    working_hours_weekday_start text DEFAULT '08:00',
    working_hours_weekday_end text DEFAULT '18:00',
    working_hours_saturday_start text DEFAULT '09:00',
    working_hours_saturday_end text DEFAULT '14:00',
    sunday_closed boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view clinic settings (public info)
CREATE POLICY "Anyone can view clinic settings"
ON public.clinic_settings
FOR SELECT
USING (true);

-- Only owners can update clinic settings
CREATE POLICY "Owners can update clinic settings"
ON public.clinic_settings
FOR UPDATE
USING (has_role(auth.uid(), 'owner'));

-- Only owners can insert clinic settings
CREATE POLICY "Owners can insert clinic settings"
ON public.clinic_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'));

-- Create trigger for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default clinic settings
INSERT INTO public.clinic_settings (clinic_name, phone, email, address)
VALUES ('BrightSmile Dental', '+1 (555) 123-4567', 'info@brightsmile.com', '123 Dental Avenue, Suite 100, New York, NY 10001');