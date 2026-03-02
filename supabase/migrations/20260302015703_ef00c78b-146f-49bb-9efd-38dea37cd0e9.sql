
-- Dental Charts: stores tooth conditions per patient
CREATE TABLE public.dental_charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Tooth conditions for each chart
CREATE TABLE public.tooth_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_id UUID NOT NULL REFERENCES public.dental_charts(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL CHECK (tooth_number >= 1 AND tooth_number <= 32),
  condition TEXT NOT NULL DEFAULT 'healthy',
  surface TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Treatment Plans
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  total_cost NUMERIC(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Treatment Plan Items/Steps
CREATE TABLE public.treatment_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  tooth_number INTEGER,
  procedure_name TEXT NOT NULL,
  description TEXT,
  cost NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  step_order INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  treatment_plan_id UUID REFERENCES public.treatment_plans(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoice Items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  tooth_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id UUID,
  diagnosis TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescription Items (medications)
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.dental_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- Dental Charts RLS
CREATE POLICY "Admins can manage dental charts" ON public.dental_charts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own charts" ON public.dental_charts FOR SELECT USING (patient_email = get_user_email(auth.uid()));

-- Tooth Conditions RLS
CREATE POLICY "Admins can manage tooth conditions" ON public.tooth_conditions FOR ALL USING (EXISTS (SELECT 1 FROM dental_charts dc WHERE dc.id = tooth_conditions.chart_id AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Patients can view own tooth conditions" ON public.tooth_conditions FOR SELECT USING (EXISTS (SELECT 1 FROM dental_charts dc WHERE dc.id = tooth_conditions.chart_id AND dc.patient_email = get_user_email(auth.uid())));

-- Treatment Plans RLS
CREATE POLICY "Admins can manage treatment plans" ON public.treatment_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own treatment plans" ON public.treatment_plans FOR SELECT USING (patient_email = get_user_email(auth.uid()));

-- Treatment Plan Items RLS
CREATE POLICY "Admins can manage treatment plan items" ON public.treatment_plan_items FOR ALL USING (EXISTS (SELECT 1 FROM treatment_plans tp WHERE tp.id = treatment_plan_items.plan_id AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Patients can view own plan items" ON public.treatment_plan_items FOR SELECT USING (EXISTS (SELECT 1 FROM treatment_plans tp WHERE tp.id = treatment_plan_items.plan_id AND tp.patient_email = get_user_email(auth.uid())));

-- Invoices RLS
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own invoices" ON public.invoices FOR SELECT USING (patient_email = get_user_email(auth.uid()));

-- Invoice Items RLS
CREATE POLICY "Admins can manage invoice items" ON public.invoice_items FOR ALL USING (EXISTS (SELECT 1 FROM invoices inv WHERE inv.id = invoice_items.invoice_id AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Patients can view own invoice items" ON public.invoice_items FOR SELECT USING (EXISTS (SELECT 1 FROM invoices inv WHERE inv.id = invoice_items.invoice_id AND inv.patient_email = get_user_email(auth.uid())));

-- Prescriptions RLS
CREATE POLICY "Admins can manage prescriptions" ON public.prescriptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions FOR SELECT USING (patient_email = get_user_email(auth.uid()));

-- Prescription Items RLS
CREATE POLICY "Admins can manage prescription items" ON public.prescription_items FOR ALL USING (EXISTS (SELECT 1 FROM prescriptions p WHERE p.id = prescription_items.prescription_id AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Patients can view own prescription items" ON public.prescription_items FOR SELECT USING (EXISTS (SELECT 1 FROM prescriptions p WHERE p.id = prescription_items.prescription_id AND p.patient_email = get_user_email(auth.uid())));

-- Triggers for updated_at
CREATE TRIGGER update_dental_charts_updated_at BEFORE UPDATE ON public.dental_charts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tooth_conditions_updated_at BEFORE UPDATE ON public.tooth_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate invoice number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
