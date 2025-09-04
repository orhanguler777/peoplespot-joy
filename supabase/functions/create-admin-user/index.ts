import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface CreateAdminBody {
  email: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    // Require caller to be authenticated
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Client to validate caller and check admin role
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use SECURITY DEFINER function to check admin
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin", { user_id: userRes.user.id });
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, password }: CreateAdminBody = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Try to create user
    let targetUserId: string | null = null;
    const { data: createRes, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      // If already exists, try to find the user by listing users and matching email
      const msg = (createErr as any)?.message?.toLowerCase?.() || "";
      if (msg.includes("already") || msg.includes("exists")) {
        // Fallback: list users and find by email (best-effort)
        let page = 1;
        const perPage = 200;
        let found = false;
        while (!found && page <= 10) { // limit pages to avoid long loops
          const { data: listRes, error: listErr } = await adminClient.auth.admin.listUsers({ page, perPage });
          if (listErr) break;
          const match = listRes?.users?.find?.((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
          if (match) {
            targetUserId = match.id;
            found = true;
            break;
          }
          if (!listRes || listRes.users.length < perPage) break;
          page += 1;
        }
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "User already exists but could not retrieve id." }), {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: createErr.message || "Failed to create user" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } else {
      targetUserId = createRes.user?.id || null;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Could not determine user id" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Upsert a profile with admin role
    const { error: upsertErr } = await adminClient
      .from("profiles")
      .upsert({ id: targetUserId, role: "admin" }, { onConflict: "id" });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message || "Failed to promote to admin" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: targetUserId, email }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("create-admin-user error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
