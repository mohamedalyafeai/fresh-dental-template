import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "reschedule" | "cancel";
  patientName: string;
  patientEmail: string;
  service: string;
  originalDate?: string;
  originalTime?: string;
  newDate?: string;
  newTime?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, patientName, patientEmail, service, originalDate, originalTime, newDate, newTime }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to:`, patientEmail);

    let subject: string;
    let emailHtml: string;

    if (type === "reschedule") {
      subject = "Your Appointment Has Been Rescheduled - BrightSmile Dental";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F59E0B, #D97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .old-time { text-decoration: line-through; color: #999; }
            .new-time { color: #059669; font-weight: bold; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Appointment Rescheduled</h1>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              <p>Your appointment at BrightSmile Dental has been rescheduled.</p>
              
              <div class="details">
                <div class="detail-row">
                  <strong>Service:</strong> ${service}
                </div>
                <div class="detail-row">
                  <strong>Original Time:</strong> <span class="old-time">${originalDate} at ${originalTime}</span>
                </div>
                <div class="detail-row">
                  <strong>New Time:</strong> <span class="new-time">${newDate} at ${newTime}</span>
                </div>
              </div>
              
              <p>Please note your new appointment time. If this doesn't work for you, please contact us to arrange an alternative.</p>
              
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
    } else {
      subject = "Your Appointment Has Been Cancelled - BrightSmile Dental";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Appointment Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              <p>We regret to inform you that your appointment at BrightSmile Dental has been cancelled.</p>
              
              <div class="details">
                <div class="detail-row">
                  <strong>Service:</strong> ${service}
                </div>
                <div class="detail-row">
                  <strong>Originally scheduled:</strong> ${originalDate} at ${originalTime}
                </div>
              </div>
              
              <p>We apologize for any inconvenience. Please contact us if you would like to reschedule your appointment.</p>
              
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
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BrightSmile Dental <onboarding@resend.dev>",
        to: [patientEmail],
        subject,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Notification email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
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
