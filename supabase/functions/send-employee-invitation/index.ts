import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey!);

interface InvitationRequest {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeName, employeeEmail, subject, message }: InvitationRequest = await req.json();

    console.log(`Sending invitation to ${employeeName} at ${employeeEmail}`);

    await resend.emails.send({
      from: "HR System <hr@yourcompany.com>",
      to: [employeeEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to HR Management System</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SITE_URL") || "https://your-app-url.com"}/auth" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Create Your Account
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact the HR team.
          </p>
        </div>
      `,
    });

    console.log(`Invitation sent successfully to ${employeeName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${employeeName}`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-employee-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);