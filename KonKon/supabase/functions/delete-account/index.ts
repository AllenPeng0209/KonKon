import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Fallback declaration for local type-checkers
// deno-lint-ignore no-explicit-any
declare const Deno: any;

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...(init ?? {}),
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": req.headers.get("origin") ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  } as const;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(
      { error: "Server misconfiguration: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500, headers: corsHeaders }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing Authorization header" }, { status: 401, headers: corsHeaders });
  }

  try {
    // 1) Get current user from token
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        apikey: SERVICE_ROLE_KEY,
      },
    });
    if (!userRes.ok) {
      return json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    const userJson = await userRes.json();
    const userId: string | undefined = userJson?.id;
    if (!userId) {
      return json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    // 2) Best-effort cleanup
    // 2a) Fetch profile to get avatar_url
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=avatar_url,email&id=eq.${userId}`,
      {
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      }
    );
    let avatarUrl: string | null = null;
    if (profileRes.ok) {
      const profiles = (await profileRes.json()) as Array<{ avatar_url: string | null; email: string | null }>;
      avatarUrl = profiles?.[0]?.avatar_url ?? null;
    }

    // 2b) Remove avatar file if stored in 'avatars' bucket
    if (avatarUrl && avatarUrl.includes("avatars/")) {
      const fileName = avatarUrl.split("/").pop();
      if (fileName) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/avatars/${fileName}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            apikey: SERVICE_ROLE_KEY,
          },
        });
      }
    }

    // 2c) Remove user from all families
    await fetch(`${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
    });

    // 2d) Anonymize users profile to remove PII
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        display_name: "Deleted User",
        email: `deleted_${userId}@example.com`,
        phone: null,
        avatar_url: null,
        language_preference: null,
        interests: null,
        updated_at: new Date().toISOString(),
      }),
    });

    // 3) Delete the auth user
    const delRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    });

    if (!delRes.ok) {
      const detail = await delRes.text();
      return json({ error: "Failed to delete user", detail }, { status: 500, headers: corsHeaders });
    }

    return json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (e) {
    return json(
      { error: "Unexpected error", detail: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: corsHeaders }
    );
  }
}); 