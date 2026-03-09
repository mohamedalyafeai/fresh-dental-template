
-- Inventory management table
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 5,
  unit text NOT NULL DEFAULT 'piece',
  unit_price numeric DEFAULT 0,
  supplier text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory" ON public.inventory_items
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- X-Ray images table
CREATE TABLE public.xray_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_email text NOT NULL,
  patient_name text NOT NULL,
  image_url text NOT NULL,
  description text,
  tooth_number integer,
  taken_date date DEFAULT CURRENT_DATE,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.xray_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage xray images" ON public.xray_images
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Patients can view own xrays" ON public.xray_images
  FOR SELECT TO public USING (patient_email = get_user_email(auth.uid()));

-- Patient reviews table
CREATE TABLE public.patient_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_email text NOT NULL,
  patient_name text NOT NULL,
  doctor_id uuid,
  appointment_id uuid REFERENCES public.appointments(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews" ON public.patient_reviews
  FOR SELECT TO public USING (is_visible = true);

CREATE POLICY "Authenticated users can create reviews" ON public.patient_reviews
  FOR INSERT TO public WITH CHECK (patient_email = get_user_email(auth.uid()));

CREATE POLICY "Admins can manage reviews" ON public.patient_reviews
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL DEFAULT 'patient',
  patient_email text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all messages" ON public.chat_messages
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Patients can view own messages" ON public.chat_messages
  FOR SELECT TO public USING (patient_email = get_user_email(auth.uid()));

CREATE POLICY "Patients can send messages" ON public.chat_messages
  FOR INSERT TO public WITH CHECK (patient_email = get_user_email(auth.uid()) AND sender_id = auth.uid());

CREATE POLICY "Patients can update own messages read status" ON public.chat_messages
  FOR UPDATE TO public USING (patient_email = get_user_email(auth.uid()));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create storage bucket for xray images
INSERT INTO storage.buckets (id, name, public) VALUES ('xray-images', 'xray-images', true);

-- Storage policies for xray images
CREATE POLICY "Admins can upload xray images" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'xray-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can view xray images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'xray-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete xray images" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'xray-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for inventory
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
