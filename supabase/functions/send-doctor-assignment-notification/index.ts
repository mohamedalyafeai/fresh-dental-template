import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DoctorAssignmentRequest {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorEmail?: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  isReassignment?: boolean;
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !roles?.some(r => r.role === 'admin' || r.role === 'owner')) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      appointmentId,
      patientName, 
      patientEmail, 
      doctorName,
      doctorEmail,
      service, 
      appointmentDate, 
      appointmentTime,
      isReassignment = false
    }: DoctorAssignmentRequest = await req.json();

    // Validate required inputs
    if (!appointmentId || typeof appointmentId !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid appointment ID" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!patientEmail || typeof patientEmail !== "string" || !emailRegex.test(patientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid patient email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!doctorName || typeof doctorName !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid doctor name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending doctor ${isReassignment ? 'reassignment' : 'assignment'} notification to:`, patientEmail);

    // Sanitize inputs for HTML
    const sanitizedPatientName = patientName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedDoctorName = doctorName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedService = service.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedDate = appointmentDate.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedTime = appointmentTime.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const actionText = isReassignment ? "reassigned" : "assigned";
    const headerText = isReassignment ? "🔄 Doctor Reassigned" : "👨‍⚕️ Doctor Assigned";

    const patientEmailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2DD4BF, #06B6D4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .doctor-card { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #2DD4BF; }
          .doctor-name { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #666; }
          .value { font-weight: bold; color: #333; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${sanitizedPatientName}،</p>
            <p>نود إعلامك بأنه تم ${isReassignment ? 'إعادة تعيين' : 'تعيين'} طبيب لموعدك القادم.</p>
            
            <div class="doctor-card">
              <div class="doctor-name">🩺 ${sanitizedDoctorName}</div>
              <p>سيكون طبيبك المعالج في الموعد المحدد</p>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">الخدمة:</span>
                <span class="value">${sanitizedService}</span>
              </div>
              <div class="detail-row">
                <span class="label">التاريخ:</span>
                <span class="value">${sanitizedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">الوقت:</span>
                <span class="value">${sanitizedTime}</span>
              </div>
            </div>
            
            <p>إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.</p>
            
            <div class="footer">
              <p>عيادة الابتسامة المشرقة<br>
              مع تحياتنا</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to patient
    const patientResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BrightSmile Dental <onboarding@resend.dev>",
        to: [patientEmail],
        subject: isReassignment 
          ? `تم إعادة تعيين طبيب لموعدك - ${sanitizedDoctorName}`
          : `تم تعيين طبيب لموعدك - ${sanitizedDoctorName}`,
        html: patientEmailHtml,
      }),
    });

    const patientData = await patientResponse.json();

    if (!patientResponse.ok) {
      console.error("Resend API error (patient):", patientData);
      throw new Error(patientData.message || "Failed to send patient email");
    }

    console.log("Patient notification email sent successfully:", patientData);

    // Optionally send email to doctor if their email is provided
    let doctorData = null;
    if (doctorEmail && emailRegex.test(doctorEmail)) {
      const doctorEmailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06B6D4, #3B82F6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .patient-card { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #3B82F6; }
            .patient-name { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #666; }
            .value { font-weight: bold; color: #333; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 موعد جديد مُعيّن لك</h1>
            </div>
            <div class="content">
              <p>عزيزي الدكتور ${sanitizedDoctorName}،</p>
              <p>تم ${isReassignment ? 'إعادة تعيين' : 'تعيين'} موعد جديد لك.</p>
              
              <div class="patient-card">
                <div class="patient-name">👤 ${sanitizedPatientName}</div>
                <p>مريض جديد في جدول مواعيدك</p>
              </div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">الخدمة:</span>
                  <span class="value">${sanitizedService}</span>
                </div>
                <div class="detail-row">
                  <span class="label">التاريخ:</span>
                  <span class="value">${sanitizedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">الوقت:</span>
                  <span class="value">${sanitizedTime}</span>
                </div>
              </div>
              
              <p>يرجى مراجعة جدول مواعيدك والتحضير للموعد.</p>
              
              <div class="footer">
                <p>نظام إدارة العيادة</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const doctorResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BrightSmile Dental <onboarding@resend.dev>",
          to: [doctorEmail],
          subject: `موعد جديد مُعيّن لك - ${sanitizedPatientName}`,
          html: doctorEmailHtml,
        }),
      });

      doctorData = await doctorResponse.json();

      if (!doctorResponse.ok) {
        console.error("Resend API error (doctor):", doctorData);
        // Don't throw here - patient email was successful
      } else {
        console.log("Doctor notification email sent successfully:", doctorData);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      patientNotification: patientData,
      doctorNotification: doctorData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending doctor assignment notification:", error);
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
