import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  date: string; // The date that has opened slots
  availableSlots: string[]; // Array of available time slots
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, availableSlots }: NotifyRequest = await req.json();
    
    console.log("Notifying waitlist patients for date:", date);
    console.log("Available slots:", availableSlots);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all patients on the waitlist for this date
    const { data: waitlistEntries, error: fetchError } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("preferred_date", date)
      .eq("status", "waiting");

    if (fetchError) {
      console.error("Error fetching waitlist:", fetchError);
      throw fetchError;
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log("No waitlist entries for this date");
      return new Response(
        JSON.stringify({ success: true, message: "No waitlist entries to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${waitlistEntries.length} patients to notify`);

    const slotsHtml = availableSlots.map(slot => `<li style="padding: 8px 0; color: #333;">${slot}</li>`).join("");
    
    const notifications = waitlistEntries.map(async (entry) => {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3B82F6, #14B8A6); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; }
            .content { padding: 40px; }
            .slots-box { background: linear-gradient(135deg, #EEF2FF, #F0FDFA); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #3B82F6; }
            .slots-box h3 { margin: 0 0 16px; color: #1E40AF; font-size: 18px; }
            .slots-list { list-style: none; padding: 0; margin: 0; }
            .slots-list li { padding: 10px 16px; background: white; margin: 8px 0; border-radius: 8px; font-weight: 500; color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #3B82F6, #14B8A6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin-top: 16px; }
            .footer { background: #F9FAFB; padding: 24px 40px; text-align: center; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Great News!</h1>
              <p>A slot has opened up for your preferred date</p>
            </div>
            <div class="content">
              <p>Dear <strong>${entry.patient_name}</strong>,</p>
              <p>We're excited to let you know that appointment slots have become available on your preferred date!</p>
              
              <div class="slots-box">
                <h3>📅 Available Times for ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <ul class="slots-list">
                  ${slotsHtml}
                </ul>
              </div>
              
              <p>You were on the waiting list for: <strong>${entry.service}</strong></p>
              <p style="color: #DC2626; font-weight: 500;">⚡ These slots fill up quickly! Book now to secure your appointment.</p>
              
              <p style="text-align: center;">
                <a href="#" class="cta-button">Book Your Appointment</a>
              </p>
              
              <p style="margin-top: 24px; color: #6B7280; font-size: 14px;">If you no longer need an appointment, you can ignore this email. You'll be automatically removed from the waiting list once you book or after 7 days.</p>
            </div>
            <div class="footer">
              <p><strong>BrightSmile Dental</strong><br>
              123 Dental Way, Smile City, SC 12345<br>
              Phone: (555) 123-4567</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "BrightSmile Dental <onboarding@resend.dev>",
            to: [entry.patient_email],
            subject: "🎉 A Slot Has Opened Up! - BrightSmile Dental",
            html: emailHtml,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error(`Failed to send email to ${entry.patient_email}:`, data);
          return { email: entry.patient_email, success: false, error: data };
        }

        console.log(`Successfully sent email to ${entry.patient_email}`);
        
        // Update the waitlist entry to mark as notified
        await supabase
          .from("waiting_list")
          .update({ status: "notified" })
          .eq("id", entry.id);
        
        return { email: entry.patient_email, success: true };
      } catch (error) {
        console.error(`Error sending to ${entry.patient_email}:`, error);
        return { email: entry.patient_email, success: false, error };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`Sent ${successCount}/${results.length} notifications successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalNotified: successCount,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-waitlist function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
