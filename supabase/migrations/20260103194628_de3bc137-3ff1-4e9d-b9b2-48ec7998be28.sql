-- Create patient_notes table for persistent doctor notes
CREATE TABLE public.patient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  note_content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage patient notes
CREATE POLICY "Admins can view patient notes"
ON public.patient_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create patient notes"
ON public.patient_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update patient notes"
ON public.patient_notes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete patient notes"
ON public.patient_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_patient_notes_updated_at
BEFORE UPDATE ON public.patient_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_patient_notes_email ON public.patient_notes(patient_email);