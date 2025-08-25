import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = Deno.env.get("NOTIFICATION_SENDER") || "Lovable HR <onboarding@resend.dev>";
const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || undefined;

interface TestEmailBody {
  toEmail?: string;
  subject?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { toEmail, subject, message }: TestEmailBody = await req.json();

    if (!toEmail) {
      throw new Error("Missing toEmail in request body");
    }

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      cc: adminEmail ? [adminEmail] : undefined,
      subject: subject || "Test email from PixUp HR",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email</h2>
          <p>This is a test email sent via Resend from your HR app.</p>
          <p>If you received this, your email setup works!</p>
          <hr />
          <p style="color:#6b7280; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log("Test email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, toEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-test-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
