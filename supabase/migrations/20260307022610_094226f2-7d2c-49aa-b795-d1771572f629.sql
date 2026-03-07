
-- Medical records table for patient medical history
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  blood_type TEXT,
  chronic_diseases TEXT,
  surgical_history TEXT,
  family_history TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patient allergies table
CREATE TABLE public.patient_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  allergy_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'mild',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patient current medications table
CREATE TABLE public.patient_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;

-- RLS for medical_records
CREATE POLICY "Admins can manage medical records" ON public.medical_records FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own medical records" ON public.medical_records FOR SELECT USING (patient_email = get_user_email(auth.uid()));

-- RLS for patient_allergies
CREATE POLICY "Admins can manage allergies" ON public.patient_allergies FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own allergies" ON public.patient_allergies FOR SELECT USING (patient_email = get_user_email(auth.uid()));

-- RLS for patient_medications
CREATE POLICY "Admins can manage medications" ON public.patient_medications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own medications" ON public.patient_medications FOR SELECT USING (patient_email = get_user_email(auth.uid()));
