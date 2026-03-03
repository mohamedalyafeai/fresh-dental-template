import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { type, patientName, patientEmail, data } = await req.json();

    if (!patientName || !patientEmail || !emailRegex.test(patientEmail) || !type) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const sanitize = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sName = sanitize(patientName);

    let subject = "";
    let emailHtml = "";

    if (type === "invoice") {
      const { invoiceNumber, total, dueDate, items } = data;
      subject = `فاتورة جديدة - ${sanitize(invoiceNumber)}`;
      const itemsHtml = (items || []).map((item: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${sanitize(item.description)}</td>
         <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
         <td style="padding:8px;border-bottom:1px solid #eee;text-align:left">${Number(item.total).toFixed(2)} ر.س</td></tr>`
      ).join("");

      emailHtml = `<!DOCTYPE html><html dir="rtl"><head><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background:linear-gradient(135deg,#2DD4BF,#06B6D4);padding:30px;text-align:center;border-radius:10px 10px 0 0}
        .header h1{color:white;margin:0;font-size:22px}
        .content{background:#f9fafb;padding:30px;border-radius:0 0 10px 10px}
        table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden}
        th{background:#f3f4f6;padding:10px;text-align:right;font-size:14px}
        .total-row{font-size:18px;font-weight:bold;color:#2DD4BF}
        .footer{text-align:center;margin-top:20px;color:#666;font-size:13px}
      </style></head><body><div class="container">
        <div class="header"><h1>📄 فاتورة جديدة</h1></div>
        <div class="content">
          <p>عزيزي/عزيزتي ${sName}،</p>
          <p>تم إصدار فاتورة جديدة لكم:</p>
          <table>
            <tr><th>الوصف</th><th>الكمية</th><th>المبلغ</th></tr>
            ${itemsHtml}
          </table>
          <div style="margin-top:20px;background:white;padding:15px;border-radius:8px;text-align:center">
            <p class="total-row">الإجمالي: ${Number(total).toFixed(2)} ر.س</p>
            ${dueDate ? `<p style="color:#666;font-size:14px">تاريخ الاستحقاق: ${sanitize(dueDate)}</p>` : ""}
          </div>
          <p style="margin-top:20px">يمكنك الاطلاع على تفاصيل الفاتورة من خلال بوابة المريض.</p>
          <div class="footer"><p>BrightSmile Dental</p></div>
        </div>
      </div></body></html>`;
    } else if (type === "prescription") {
      const { diagnosis, medications } = data;
      subject = "وصفة طبية جديدة";
      const medsHtml = (medications || []).map((med: any) =>
        `<div style="background:white;padding:12px;border-radius:8px;margin-bottom:8px">
          <strong>${sanitize(med.medication_name)}</strong>
          <div style="color:#666;font-size:13px;margin-top:4px">
            الجرعة: ${sanitize(med.dosage)} | التكرار: ${sanitize(med.frequency)} | المدة: ${sanitize(med.duration)}
            ${med.instructions ? `<br>تعليمات: ${sanitize(med.instructions)}` : ""}
          </div>
        </div>`
      ).join("");

      emailHtml = `<!DOCTYPE html><html dir="rtl"><head><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background:linear-gradient(135deg,#06B6D4,#8B5CF6);padding:30px;text-align:center;border-radius:10px 10px 0 0}
        .header h1{color:white;margin:0;font-size:22px}
        .content{background:#f9fafb;padding:30px;border-radius:0 0 10px 10px}
        .footer{text-align:center;margin-top:20px;color:#666;font-size:13px}
      </style></head><body><div class="container">
        <div class="header"><h1>💊 وصفة طبية جديدة</h1></div>
        <div class="content">
          <p>عزيزي/عزيزتي ${sName}،</p>
          <p>تم إصدار وصفة طبية جديدة لكم.</p>
          ${diagnosis ? `<p><strong>التشخيص:</strong> ${sanitize(diagnosis)}</p>` : ""}
          <h3 style="margin-top:20px;color:#333">الأدوية الموصوفة:</h3>
          ${medsHtml}
          <p style="margin-top:20px;background:#FEF3C7;padding:12px;border-radius:8px;font-size:14px">
            ⚠️ يرجى الالتزام بالجرعات والمواعيد المحددة. راجع طبيبك في حالة ظهور أي أعراض جانبية.
          </p>
          <div class="footer"><p>BrightSmile Dental</p></div>
        </div>
      </div></body></html>`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`Sending ${type} notification to:`, patientEmail);

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

    const resData = await response.json();
    if (!response.ok) {
      console.error("Resend API error:", resData);
      throw new Error(resData.message || "Failed to send email");
    }

    console.log("Notification sent successfully:", resData);
    return new Response(JSON.stringify({ success: true, data: resData }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
