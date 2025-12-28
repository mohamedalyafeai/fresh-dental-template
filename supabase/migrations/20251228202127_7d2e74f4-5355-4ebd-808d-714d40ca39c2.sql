-- Add reminder_sent column to track SMS reminders
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMP WITH TIME ZONE;