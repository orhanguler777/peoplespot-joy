// Supabase Edge Function: create-admin-user
// Creates or ensures an admin user with fixed credentials, idempotent and safe.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client using the service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fixed credentials for the admin to create/ensure
    const email = 'admin@pixupplay.com';
    const password = 'Pix123@';

    // Check if user already exists
    const { data: existingUserData, error: getUserErr } = await supabase.auth.admin.getUserByEmail(email);
    if (getUserErr && getUserErr.message && !getUserErr.message.includes('User not found')) {
      console.error('getUserByEmail error:', getUserErr);
      return new Response(JSON.stringify({ error: getUserErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string | null = existingUserData?.user?.id ?? null;
    let action: 'created' | 'exists' = 'exists';

    if (!userId) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) {
        console.error('createUser error:', createErr);
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
      action = 'created';
    }

    // Ensure profile exists with admin role (upsert to be idempotent)
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId as string, role: 'admin' }, { onConflict: 'id' });
    if (upsertErr) {
      console.error('profiles upsert error:', upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, email, userId, action }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error('Unhandled error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
