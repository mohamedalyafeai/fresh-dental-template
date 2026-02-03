import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScheduleUpdateRequest {
  doctorName: string;
  updateType: 'schedule' | 'day_off_add' | 'day_off_remove';
  details: string;
}

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role to fetch admin emails
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the calling user is authenticated
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { doctorName, updateType, details }: ScheduleUpdateRequest = await req.json();

    // Validate inputs
    if (!doctorName || typeof doctorName !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid doctor name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!updateType || !['schedule', 'day_off_add', 'day_off_remove'].includes(updateType)) {
      return new Response(
        JSON.stringify({ error: "Invalid update type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch owner and admin emails (excluding the doctor making the change)
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['owner', 'admin'])
      .neq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admins to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from auth.users
    const adminEmails: string[] = [];
    for (const role of adminRoles) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(
        JSON.stringify({ success: true, message: 'No admin emails found' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending schedule update notification to ${adminEmails.length} admins`);

    // Sanitize inputs for HTML
    const sanitizedDoctorName = doctorName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedDetails = details.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Determine email subject and content based on update type
    let subject = '';
    let updateTitle = '';
    let updateDescription = '';

    switch (updateType) {
      case 'schedule':
        subject = `تحديث جدول الدوام - ${sanitizedDoctorName}`;
        updateTitle = 'تحديث ساعات العمل الأسبوعية';
        updateDescription = 'قام الطبيب بتحديث ساعات عمله الأسبوعية';
        break;
      case 'day_off_add':
        subject = `إضافة يوم إجازة - ${sanitizedDoctorName}`;
        updateTitle = 'إضافة يوم إجازة';
        updateDescription = 'قام الطبيب بإضافة يوم إجازة جديد';
        break;
      case 'day_off_remove':
        subject = `إلغاء يوم إجازة - ${sanitizedDoctorName}`;
        updateTitle = 'إلغاء يوم إجازة';
        updateDescription = 'قام الطبيب بإلغاء يوم إجازة';
        break;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2DD4BF, #06B6D4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #2DD4BF; }
          .doctor-name { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .update-type { color: #06B6D4; font-weight: 600; margin-bottom: 8px; }
          .update-details { color: #4b5563; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .action-btn { display: inline-block; background: linear-gradient(135deg, #2DD4BF, #06B6D4); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 ${updateTitle}</h1>
          </div>
          <div class="content">
            <p>مرحباً،</p>
            <p>${updateDescription}:</p>
            
            <div class="details-box">
              <div class="doctor-name">د. ${sanitizedDoctorName}</div>
              <div class="update-type">${updateTitle}</div>
              <div class="update-details">${sanitizedDetails}</div>
            </div>
            
            <p>يرجى مراجعة الجدول للتأكد من عدم وجود تعارضات مع المواعيد الحالية.</p>
            
            <div class="footer">
              <p>عيادة BrightSmile للأسنان<br>
              نظام إدارة المواعيد</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all admins
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BrightSmile Dental <onboarding@resend.dev>",
        to: adminEmails,
        subject: subject,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Schedule update notification sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending schedule update notification:", error);
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
