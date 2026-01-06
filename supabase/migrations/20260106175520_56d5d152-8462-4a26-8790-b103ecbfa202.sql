-- Create a function to assign admin role when doctor signs up
CREATE OR REPLACE FUNCTION public.assign_doctor_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user signed up with 'doctor' role in metadata
  IF NEW.raw_user_meta_data ->> 'role' = 'doctor' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_doctor_signup ON auth.users;
CREATE TRIGGER on_doctor_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_doctor_admin_role();