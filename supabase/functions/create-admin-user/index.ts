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

    let userId: string | null = null;
    let action: 'created' | 'exists' = 'created';

    // Try creating the user first
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      // If the user already exists, fallback to list users and find by email
      action = 'exists';
      console.error('createUser error (will attempt to find existing):', createErr);

      let page = 1;
      const perPage = 1000;
      let found: any = null;

      while (true) {
        const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage });
        if (listErr) {
          console.error('listUsers error:', listErr);
          return new Response(JSON.stringify({ error: listErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const users = (listData as any)?.users ?? [];
        found = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase()) ?? null;
        if (found || users.length < perPage) break;
        page += 1;
      }

      if (!found) {
        return new Response(JSON.stringify({ error: 'User exists but could not be retrieved' }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = found.id as string;
    } else {
      userId = created!.user.id;
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
