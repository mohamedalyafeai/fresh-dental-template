-- Create waiting_list table
CREATE TABLE public.waiting_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  service TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policies for waiting list
CREATE POLICY "Anyone can add to waiting list" 
ON public.waiting_list 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own waiting list entries" 
ON public.waiting_list 
FOR SELECT 
USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update waiting list" 
ON public.waiting_list 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from waiting list" 
ON public.waiting_list 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_waiting_list_updated_at
BEFORE UPDATE ON public.waiting_list
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();