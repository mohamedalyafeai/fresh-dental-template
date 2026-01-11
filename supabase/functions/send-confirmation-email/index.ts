import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  patientName: string;
  patientEmail: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Email validation regex
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { patientName, patientEmail, service, appointmentDate, appointmentTime }: EmailRequest = await req.json();

    // Validate inputs
    if (!patientName || typeof patientName !== "string" || patientName.length < 2 || patientName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid patient name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!patientEmail || typeof patientEmail !== "string" || !emailRegex.test(patientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!service || typeof service !== "string" || service.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid service" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!appointmentDate || typeof appointmentDate !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid appointment date" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!appointmentTime || typeof appointmentTime !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid appointment time" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending confirmation email to:", patientEmail);

    // Sanitize inputs for HTML
    const sanitizedName = patientName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedService = service.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedDate = appointmentDate.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedTime = appointmentTime.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2DD4BF, #06B6D4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #666; }
          .value { font-weight: bold; color: #333; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Appointment Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${sanitizedName},</p>
            <p>Thank you for booking with BrightSmile Dental. Your appointment has been confirmed.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Service:</span>
                <span class="value">${sanitizedService}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${sanitizedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${sanitizedTime}</span>
              </div>
            </div>
            
            <p><strong>Important:</strong> Please arrive 10 minutes before your scheduled appointment time.</p>
            <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            
            <div class="footer">
              <p>BrightSmile Dental<br>
              123 Dental Way, Smile City, SC 12345<br>
              Phone: (555) 123-4567</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BrightSmile Dental <onboarding@resend.dev>",
        to: [patientEmail],
        subject: "Appointment Confirmation - BrightSmile Dental",
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
