import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const sanitize = (s: string) => String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Appointments starting between 50 and 70 minutes from now (cron runs every 10 min)
    const now = new Date();
    const from = new Date(now.getTime() + 50 * 60 * 1000);
    const to = new Date(now.getTime() + 70 * 60 * 1000);
    const isoDate = (d: Date) => d.toISOString().split("T")[0];

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, patient_name, patient_email, service, appointment_date, appointment_time, doctor_id")
      .in("status", ["pending", "confirmed"])
      .eq("hour_reminder_sent", false)
      .in("appointment_date", Array.from(new Set([isoDate(from), isoDate(to)])));

    if (error) throw error;

    const due = (appointments ?? []).filter((a) => {
      const dt = new Date(`${a.appointment_date}T${a.appointment_time}`);
      return dt >= from && dt <= to;
    });

    let sent = 0;
    for (const appt of due) {
      const timeLabel = `${appt.appointment_date} - ${appt.appointment_time}`;

      // In-app notification
      await supabase.from("patient_notifications").insert({
        patient_email: appt.patient_email,
        title: "تذكير بموعدك",
        message: `تذكير: موعدك (${appt.service}) بعد ساعة تقريباً في ${timeLabel}.`,
        type: "appointment",
        related_id: appt.id,
      });

      // Email reminder
      if (resendApiKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Dental Clinic <onboarding@resend.dev>",
              to: [appt.patient_email],
              subject: "تذكير: موعدك بعد ساعة",
              html: `<div dir="rtl" style="font-family:Arial,sans-serif">
                <h2>مرحباً ${sanitize(appt.patient_name)}</h2>
                <p>نذكّرك بموعدك في العيادة بعد ساعة تقريباً.</p>
                <p><strong>الخدمة:</strong> ${sanitize(appt.service)}</p>
                <p><strong>الموعد:</strong> ${sanitize(timeLabel)}</p>
                <p>نرجو الحضور قبل الموعد بـ 10 دقائق.</p>
              </div>`,
            }),
          });
        } catch (e) {
          console.error("Email reminder failed", e);
        }
      }

      await supabase.from("appointments").update({ hour_reminder_sent: true }).eq("id", appt.id);
      sent++;
    }

    console.log(`Hour reminders processed: ${sent}`);
    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-appointment-hour-reminder error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
