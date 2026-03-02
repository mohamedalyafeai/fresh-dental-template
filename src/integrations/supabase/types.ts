export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          details: string | null
          id: string
          target_user_email: string | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: string | null
          id?: string
          target_user_email?: string | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: string | null
          id?: string
          target_user_email?: string | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          reminder_sent: string | null
          service: string
          status: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          reminder_sent?: string | null
          service: string
          status?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          patient_phone?: string
          reminder_sent?: string | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string | null
          clinic_logo_url: string | null
          clinic_name: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          sunday_closed: boolean | null
          updated_at: string
          working_hours_saturday_end: string | null
          working_hours_saturday_start: string | null
          working_hours_weekday_end: string | null
          working_hours_weekday_start: string | null
        }
        Insert: {
          address?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          sunday_closed?: boolean | null
          updated_at?: string
          working_hours_saturday_end?: string | null
          working_hours_saturday_start?: string | null
          working_hours_weekday_end?: string | null
          working_hours_weekday_start?: string | null
        }
        Update: {
          address?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          sunday_closed?: boolean | null
          updated_at?: string
          working_hours_saturday_end?: string | null
          working_hours_saturday_start?: string | null
          working_hours_weekday_end?: string | null
          working_hours_weekday_start?: string | null
        }
        Relationships: []
      }
      dental_charts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_email: string
          patient_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_email: string
          patient_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_days_off: {
        Row: {
          created_at: string
          date_off: string
          doctor_id: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          date_off: string
          doctor_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          date_off?: string
          doctor_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_days_off_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_days_off_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "public_doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          avatar_url: string | null
          badge_number: string | null
          bio: string | null
          created_at: string
          id: string
          is_available: boolean | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          badge_number?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          badge_number?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      doctor_requests: {
        Row: {
          badge_number: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialty: string | null
          status: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          badge_number?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          badge_number?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      doctor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "public_doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          tooth_number: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          tooth_number?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          tooth_number?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          created_at: string
          created_by: string | null
          discount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          patient_email: string
          patient_name: string
          status: string
          subtotal: number
          tax: number | null
          total: number
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          patient_email: string
          patient_name: string
          status?: string
          subtotal?: number
          tax?: number | null
          total?: number
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          status?: string
          subtotal?: number
          tax?: number | null
          total?: number
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          id: string
          promotional_emails: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          id?: string
          promotional_emails?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          id?: string
          promotional_emails?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note_content: string
          patient_email: string
          patient_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_content: string
          patient_email: string
          patient_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_content?: string
          patient_email?: string
          patient_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medication_name: string
          prescription_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medication_name: string
          prescription_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medication_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          created_by: string | null
          diagnosis: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_email: string
          patient_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_email: string
          patient_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          job_name: string
          last_run: string | null
          last_status: string | null
          schedule: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          job_name: string
          last_run?: string | null
          last_status?: string | null
          schedule: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          job_name?: string
          last_run?: string | null
          last_status?: string | null
          schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      tooth_conditions: {
        Row: {
          chart_id: string
          condition: string
          created_at: string
          id: string
          notes: string | null
          surface: string | null
          tooth_number: number
          updated_at: string
        }
        Insert: {
          chart_id: string
          condition?: string
          created_at?: string
          id?: string
          notes?: string | null
          surface?: string | null
          tooth_number: number
          updated_at?: string
        }
        Update: {
          chart_id?: string
          condition?: string
          created_at?: string
          id?: string
          notes?: string | null
          surface?: string | null
          tooth_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooth_conditions_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "dental_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan_items: {
        Row: {
          completed_at: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          plan_id: string
          procedure_name: string
          status: string
          step_order: number
          tooth_number: number | null
        }
        Insert: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          plan_id: string
          procedure_name: string
          status?: string
          step_order?: number
          tooth_number?: number | null
        }
        Update: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          plan_id?: string
          procedure_name?: string
          status?: string
          step_order?: number
          tooth_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          doctor_id: string | null
          id: string
          patient_email: string
          patient_name: string
          status: string
          title: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          doctor_id?: string | null
          id?: string
          patient_email: string
          patient_name: string
          status?: string
          title: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          doctor_id?: string | null
          id?: string
          patient_email?: string
          patient_name?: string
          status?: string
          title?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waiting_list: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          preferred_date: string
          service: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          preferred_date: string
          service: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          patient_phone?: string
          preferred_date?: string
          service?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_doctor_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          is_available: boolean | null
          specialty: string | null
          updated_at: string | null
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_available?: boolean | null
          specialty?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_available?: boolean | null
          specialty?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_full_doctor_profile: {
        Args: { doctor_user_id: string }
        Returns: boolean
      }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "owner"],
    },
  },
} as const
