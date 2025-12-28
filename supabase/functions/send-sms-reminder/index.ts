import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date range for appointments 24 hours from now
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    console.log("Checking for appointments on:", tomorrowDate);

    // Get all appointments scheduled for tomorrow that haven't been reminded
    const { data: appointments, error } = await supabase
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
        const message = `Hi ${appointment.patient_name}! This is a reminder from BrightSmile Dental. You have an appointment scheduled for tomorrow, ${appointment.appointment_date} at ${appointment.appointment_time}. Please arrive 10 minutes early. Reply STOP to unsubscribe.`;
        
        console.log(`Sending reminder to ${appointment.patient_phone}`);
        
        await sendSMS(appointment.patient_phone, message);

        // Mark as reminded
        await supabase
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: appointments?.length || 0,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sms-reminder:", error);
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
