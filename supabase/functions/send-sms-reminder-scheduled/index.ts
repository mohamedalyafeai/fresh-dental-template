import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

// Phone validation regex
const phoneRegex = /^[+]?[0-9\s()-]{10,20}$/;

async function sendSMS(to: string, body: string): Promise<any> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: twilioPhoneNumber!,
      Body: body,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || "Failed to send SMS");
  }
  
  return data;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is designed to be called by a cron job (pg_cron or external scheduler)
    // It doesn't require user authentication - it uses service role key
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date range for appointments 24 hours from now
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    console.log("Scheduled SMS reminder check for appointments on:", tomorrowDate);

    // Get all appointments scheduled for tomorrow that haven't been reminded
    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("appointment_date", tomorrowDate)
      .eq("status", "pending")
      .is("reminder_sent", null);

    if (error) {
      throw error;
    }

    console.log(`Found ${appointments?.length || 0} appointments to remind`);

    const results = [];

    for (const appointment of appointments || []) {
      try {
        // Validate phone number
        if (!phoneRegex.test(appointment.patient_phone)) {
          console.log(`Invalid phone number for appointment ${appointment.id}`);
          results.push({ id: appointment.id, status: "skipped", error: "Invalid phone number" });
          continue;
        }

        // Sanitize patient name
        const sanitizedName = appointment.patient_name.substring(0, 100);

        const message = `مرحباً ${sanitizedName}! هذا تذكير من عيادة BrightSmile. لديك موعد غداً ${appointment.appointment_date} الساعة ${appointment.appointment_time}. يرجى الحضور قبل 10 دقائق. للإلغاء رد STOP.`;
        
        console.log(`Sending reminder to ${appointment.patient_phone}`);
        
        await sendSMS(appointment.patient_phone, message);

        // Mark as reminded
        await supabaseAdmin
          .from("appointments")
          .update({ reminder_sent: new Date().toISOString() })
          .eq("id", appointment.id);

        results.push({ id: appointment.id, status: "sent" });
        console.log(`Reminder sent successfully for appointment ${appointment.id}`);
      } catch (smsError: any) {
        console.error(`Failed to send SMS for appointment ${appointment.id}:`, smsError);
        results.push({ id: appointment.id, status: "failed", error: smsError.message });
      }
    }

    // Log the scheduled run
    console.log(`Scheduled SMS reminder completed. Processed: ${appointments?.length || 0}, Sent: ${results.filter(r => r.status === 'sent').length}, Failed: ${results.filter(r => r.status === 'failed').length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled: true,
        timestamp: new Date().toISOString(),
        processed: appointments?.length || 0,
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in scheduled send-sms-reminder:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
