import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientName, patientEmail, service, appointmentDate, appointmentTime }: EmailRequest = await req.json();

    console.log("Sending confirmation email to:", patientEmail);

    const emailResponse = await resend.emails.send({
      from: "BrightSmile Dental <onboarding@resend.dev>",
      to: [patientEmail],
      subject: "Appointment Confirmation - BrightSmile Dental",
      html: `
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
              <p>Dear ${patientName},</p>
              <p>Thank you for booking with BrightSmile Dental. Your appointment has been confirmed.</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">Service:</span>
                  <span class="value">${service}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${appointmentDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${appointmentTime}</span>
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
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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
