import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DoctorApprovalRequest {
  userEmail: string;
  userName: string;
  actionType: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Doctor approval notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, actionType, rejectionReason }: DoctorApprovalRequest = await req.json();
    
    console.log(`Sending ${actionType} notification to: ${userEmail}`);

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (actionType === 'approved') {
      subject = "تمت الموافقة على طلبك - BrightSmile Dental";
      htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎉 تهانينا!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">تمت الموافقة على طلبك</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              مرحباً <strong>${userName}</strong>،
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              يسعدنا إبلاغك أنه تمت الموافقة على طلبك للانضمام كطبيب في عيادة BrightSmile Dental!
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #10b981;">
              <h3 style="color: #10b981; margin: 0 0 10px 0;">الخطوات التالية:</h3>
              <ul style="color: #6b7280; margin: 0; padding-right: 20px;">
                <li>يمكنك الآن الوصول إلى لوحة تحكم الطبيب</li>
                <li>أكمل ملفك الشخصي لتظهر للمرضى</li>
                <li>ابدأ باستقبال المواعيد</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              نتطلع للعمل معك!<br>
              <strong>فريق BrightSmile Dental</strong>
            </p>
          </div>
        </div>
      `;
    } else {
      subject = "تحديث بشأن طلبك - BrightSmile Dental";
      htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">تحديث بشأن طلبك</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              مرحباً <strong>${userName}</strong>،
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              نأسف لإبلاغك أنه تم رفض طلبك للانضمام كطبيب في عيادة BrightSmile Dental.
            </p>
            
            ${rejectionReason ? `
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #ef4444;">
                <h3 style="color: #ef4444; margin: 0 0 10px 0;">سبب الرفض:</h3>
                <p style="color: #6b7280; margin: 0;">${rejectionReason}</p>
              </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #6b7280;">
              إذا كان لديك أي استفسارات، يرجى التواصل معنا.<br>
              <strong>فريق BrightSmile Dental</strong>
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "BrightSmile Dental <onboarding@resend.dev>",
        to: [userEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const responseData = await emailResponse.json();
    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending doctor approval notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
