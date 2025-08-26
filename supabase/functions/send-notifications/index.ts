import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = "https://outngvycajxdgyellntw.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey!);
// Initialize Resend inside handler to avoid crashes when key is missing
// const resend = new Resend(resendApiKey!);
const fromRaw = Deno.env.get("NOTIFICATION_SENDER") || "PIXUP TEAM <onboarding@resend.dev>";
const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "admin@yourcompany.com";

// Validate 'from' email: must be ASCII and proper format
const isAscii = (s: string) => /^[\x00-\x7F]+$/.test(s);
const isValidEmailOrNameEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || /.+<\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*>/.test(s);

let fromEmail = fromRaw;
if (!isAscii(fromRaw) || !isValidEmailOrNameEmail(fromRaw)) {
  console.warn("NOTIFICATION_SENDER invalid or contains non-ASCII characters. Falling back to onboarding@resend.dev");
  fromEmail = "PIXUP TEAM <onboarding@resend.dev>";
}

// Validate adminEmail for Resend 'cc' field format
const isValidCc =
  !!adminEmail &&
  (isValidEmailOrNameEmail(adminEmail));
if (adminEmail && !isValidCc) {
  console.warn("ADMIN_NOTIFICATION_EMAIL is set but invalid format, skipping cc.");
}

// Simple throttle to avoid provider rate limits (2 req/sec)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  job_entry_date: string;
  birthday: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting notification check...");

    // Initialize Resend client safely
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const resendClient = new Resend(apiKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDay = String(today.getDate()).padStart(2, "0");
    const todayFormatted = `${todayMonth}-${todayDay}`;

    console.log(`Checking for birthdays and anniversaries on: ${todayFormatted}`);

    // Fetch employees and filter by today's month/day in code to avoid DATE LIKE errors
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email, position, job_entry_date, birthday");

    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      throw employeesError;
    }

    // Filter birthdays today
    const birthdayEmployees = (employees || []).filter((e: any) => {
      if (!e.birthday) return false;
      const d = new Date(e.birthday);
      return d.getMonth() + 1 === today.getMonth() + 1 && d.getDate() === today.getDate();
    });

    // Filter work anniversaries today
    const anniversaryEmployees = (employees || []).filter((e: any) => {
      if (!e.job_entry_date) return false;
      const d = new Date(e.job_entry_date);
      return d.getMonth() + 1 === today.getMonth() + 1 && d.getDate() === today.getDate();
    });

    console.log(`Found ${birthdayEmployees?.length || 0} birthdays and ${anniversaryEmployees?.length || 0} anniversaries`);

    // Send birthday notifications
    for (const employee of birthdayEmployees || []) {
      const age = today.getFullYear() - new Date(employee.birthday).getFullYear();
      
const birthdayResp = await resendClient.emails.send({
        from: fromEmail,
        to: [employee.email],
        cc: isValidCc ? [adminEmail!] : undefined,
        subject: `🎂 Happy Birthday, ${employee.first_name} ${employee.last_name}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi ${employee.first_name} ${employee.last_name},</p>
            <p>Wishing you a very Happy Birthday and a wonderful year ahead! 🎉</p>
            <p>Thank you for being a valued part of our team — may this year bring you health, happiness, and success.</p>
            <p>Enjoy your special day! 🎂🎈</p>
            <p>Best wishes,<br/>PIXUP TEAM</p>
          </div>
        `,
      });

      console.log(`Birthday email response for ${employee.email}:`, birthdayResp);
      if (birthdayResp?.error) {
        console.warn(`Birthday email error for ${employee.email}:`, birthdayResp.error);
      } else {
        console.log(`Birthday notification sent for ${employee.first_name} ${employee.last_name}`);
      }
      await sleep(600); // throttle to <= 2 req/sec
    }

    // Send anniversary notifications
    for (const employee of anniversaryEmployees || []) {
      const yearsOfService = today.getFullYear() - new Date(employee.job_entry_date).getFullYear();
      
const anniversaryResp = await resendClient.emails.send({
        from: fromEmail,
        to: [employee.email],
        cc: isValidCc ? [adminEmail!] : undefined,
        subject: `🎉 Happy Work Anniversary, ${employee.first_name} ${employee.last_name}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi ${employee.first_name} ${employee.last_name},</p>
            <p>Congratulations on your ${yearsOfService}-year anniversary with us! 🌟</p>
            <p>We truly appreciate your hard work, dedication, and the positive impact you’ve made on our team.</p>
            <p>Here’s to many more successful years together! 🥂</p>
            <p>Best regards,<br/>PIXUP TEAM</p>
          </div>
        `,
      });

      console.log(`Anniversary email response for ${employee.email}:`, anniversaryResp);
      if (anniversaryResp?.error) {
        console.warn(`Anniversary email error for ${employee.email}:`, anniversaryResp.error);
      } else {
        console.log(`Anniversary notification sent for ${employee.first_name} ${employee.last_name}`);
      }
      await sleep(600); // throttle to <= 2 req/sec
    }

    const totalNotifications = (birthdayEmployees?.length || 0) + (anniversaryEmployees?.length || 0);

    // Prepare detailed response with names and positions
    const birthdayDetails = birthdayEmployees?.map(emp => ({
      name: `${emp.first_name} ${emp.last_name}`,
      position: emp.position
    })) || [];
    
    const anniversaryDetails = anniversaryEmployees?.map(emp => ({
      name: `${emp.first_name} ${emp.last_name}`,
      position: emp.position
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications check completed. Sent ${totalNotifications} notifications.`,
        birthdays: birthdayEmployees?.length || 0,
        anniversaries: anniversaryEmployees?.length || 0,
        birthdayDetails,
        anniversaryDetails,
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
    console.error("Error in send-notifications function:", error);
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