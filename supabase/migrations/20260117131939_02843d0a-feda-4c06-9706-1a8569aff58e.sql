-- Create doctor_requests table for doctor registration approval workflow
CREATE TABLE public.doctor_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    specialty text,
    years_experience integer DEFAULT 0,
    badge_number text,
    bio text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own doctor requests"
ON public.doctor_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own doctor request
CREATE POLICY "Users can create their own doctor request"
ON public.doctor_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owners can view all doctor requests
CREATE POLICY "Owners can view all doctor requests"
ON public.doctor_requests
FOR SELECT
USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

-- Only owners can update doctor requests (approve/reject)
CREATE POLICY "Owners can update doctor requests"
ON public.doctor_requests
FOR UPDATE
USING (has_role(auth.uid(), 'owner'));

-- Only owners can delete doctor requests
CREATE POLICY "Owners can delete doctor requests"
ON public.doctor_requests
FOR DELETE
USING (has_role(auth.uid(), 'owner'));

-- Create trigger for updated_at
CREATE TRIGGER update_doctor_requests_updated_at
BEFORE UPDATE ON public.doctor_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow owners to delete user roles (for deleting users)
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Owners and admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

-- Allow owners to insert user roles
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Owners and admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

-- Allow owners to delete from profiles (cascade delete user data)
CREATE POLICY "Owners can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'owner'));

-- Update activity logs policies for owners
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Owners and admins can view activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;
CREATE POLICY "Owners and admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));