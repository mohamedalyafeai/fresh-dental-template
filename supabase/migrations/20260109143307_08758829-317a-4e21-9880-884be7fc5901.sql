-- Create doctor_profiles table for doctor-specific information
CREATE TABLE public.doctor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  specialty TEXT,
  bio TEXT,
  phone TEXT,
  years_experience INTEGER DEFAULT 0,
  badge_number TEXT UNIQUE,
  avatar_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for doctor_profiles
CREATE POLICY "Doctors can view their own profile"
ON public.doctor_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own profile"
ON public.doctor_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own profile"
ON public.doctor_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all doctor profiles"
ON public.doctor_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view available doctors"
ON public.doctor_profiles
FOR SELECT
USING (is_available = true);

-- Add doctor_id column to appointments table
ALTER TABLE public.appointments ADD COLUMN doctor_id UUID;

-- Create trigger for updated_at
CREATE TRIGGER update_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;