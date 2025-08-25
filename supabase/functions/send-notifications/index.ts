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
const resend = new Resend(resendApiKey!);
const fromEmail = Deno.env.get("NOTIFICATION_SENDER") || "Lovable HR <onboarding@resend.dev>";
const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "admin@yourcompany.com";
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
      
      await resend.emails.send({
        from: fromEmail,
        to: [employee.email],
        cc: [adminEmail],
        subject: `🎉 Birthday Alert - ${employee.first_name} ${employee.last_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎂 Birthday Celebration!</h2>
            <p>It's <strong>${employee.first_name} ${employee.last_name}</strong>'s birthday today!</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Employee Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${employee.first_name} ${employee.last_name}</li>
                <li><strong>Position:</strong> ${employee.position}</li>
                <li><strong>Email:</strong> ${employee.email}</li>
                <li><strong>Age:</strong> ${age} years old</li>
              </ul>
            </div>
            <p>Don't forget to wish them a happy birthday! 🎈</p>
          </div>
        `,
      });

      console.log(`Birthday notification sent for ${employee.first_name} ${employee.last_name}`);
    }

    // Send anniversary notifications
    for (const employee of anniversaryEmployees || []) {
      const yearsOfService = today.getFullYear() - new Date(employee.job_entry_date).getFullYear();
      
      await resend.emails.send({
        from: fromEmail,
        to: [employee.email],
        cc: [adminEmail],
        subject: `🏆 Work Anniversary - ${employee.first_name} ${employee.last_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">🎊 Work Anniversary!</h2>
            <p><strong>${employee.first_name} ${employee.last_name}</strong> is celebrating their work anniversary today!</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Employee Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${employee.first_name} ${employee.last_name}</li>
                <li><strong>Position:</strong> ${employee.position}</li>
                <li><strong>Email:</strong> ${employee.email}</li>
                <li><strong>Years of Service:</strong> ${yearsOfService} years</li>
                <li><strong>Started:</strong> ${new Date(employee.job_entry_date).toLocaleDateString()}</li>
              </ul>
            </div>
            <p>Congratulations on their dedication and service! 🏅</p>
          </div>
        `,
      });

      console.log(`Anniversary notification sent for ${employee.first_name} ${employee.last_name}`);
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