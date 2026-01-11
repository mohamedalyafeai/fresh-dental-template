import { z } from "zod";

// Booking form validation schema
export const bookingFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[\p{L}\p{M}\s\-']+$/u, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[+]?[0-9\s()\-]+$/, "Invalid phone number format"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

// Patient note validation schema
export const patientNoteSchema = z.object({
  note_content: z
    .string()
    .min(1, "Note content is required")
    .max(5000, "Note must be less than 5000 characters"),
});

// Doctor profile validation schema
export const doctorProfileSchema = z.object({
  specialty: z
    .string()
    .max(100, "Specialty must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[+]?[0-9\s()\-]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  years_experience: z
    .number()
    .min(0, "Years of experience cannot be negative")
    .max(100, "Years of experience must be less than 100")
    .optional(),
  badge_number: z
    .string()
    .max(50, "Badge number must be less than 50 characters")
    .optional()
    .or(z.literal("")),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type PatientNoteData = z.infer<typeof patientNoteSchema>;
export type DoctorProfileData = z.infer<typeof doctorProfileSchema>;
