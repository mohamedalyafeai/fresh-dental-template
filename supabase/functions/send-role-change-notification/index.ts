import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoleChangeRequest {
  userEmail: string;
  userName: string;
  actionType: 'promote' | 'demote';
  adminName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, actionType, adminName }: RoleChangeRequest = await req.json();

    console.log(`Sending role change notification to: ${userEmail}, action: ${actionType}`);

    const isPromotion = actionType === 'promote';
    const subject = isPromotion 
      ? "🎉 Congratulations! You've Been Promoted to Doctor/Admin"
      : "Role Update - Your Account Access Has Changed";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${isPromotion ? '#2DD4BF, #06B6D4' : '#6B7280, #4B5563'}); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight-box { background: ${isPromotion ? '#d1fae5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isPromotion ? '#10b981' : '#f59e0b'}; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isPromotion ? '🎉 Congratulations!' : '📋 Role Update'}</h1>
          </div>
          <div class="content">
            <p>Dear ${userName || 'User'},</p>
            
            ${isPromotion ? `
              <div class="highlight-box">
                <p><strong>Great news!</strong> You have been promoted to <strong>Doctor/Admin</strong> by ${adminName}.</p>
              </div>
              <p>As a Doctor/Admin, you now have access to:</p>
              <ul>
                <li>Admin Dashboard</li>
                <li>Manage patient appointments</li>
                <li>View and edit patient notes</li>
                <li>Manage staff and roles</li>
                <li>View analytics and reports</li>
              </ul>
              <p>Log in to access your new capabilities and start managing the clinic!</p>
            ` : `
              <div class="highlight-box">
                <p>Your account role has been changed to <strong>Patient</strong> by ${adminName}.</p>
              </div>
              <p>As a Patient, you can:</p>
              <ul>
                <li>Book and manage your appointments</li>
                <li>View your appointment history</li>
                <li>Access the waiting list</li>
              </ul>
              <p>If you believe this change was made in error, please contact the clinic administration.</p>
            `}
            
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
        to: [userEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Role change notification sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending role change notification:", error);
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
