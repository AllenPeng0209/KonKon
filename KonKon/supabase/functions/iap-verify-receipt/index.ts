import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Fallback declaration for local type-checkers
// deno-lint-ignore no-explicit-any
declare const Deno: any;

const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
    'Vary': 'Origin'
  };

  try {
    const body = await req.json().catch(() => null) as { receiptData?: string } | null;
    const receiptData = body?.receiptData;

    if (!receiptData) {
      return new Response(JSON.stringify({ error: 'Missing receiptData' }), { status: 400, headers: corsHeaders });
    }

    const password = Deno.env.get('APP_STORE_SHARED_SECRET');
    if (!password) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing APP_STORE_SHARED_SECRET' }), { status: 500, headers: corsHeaders });
    }

    const payload = {
      'receipt-data': receiptData,
      password,
      'exclude-old-transactions': true
    };

    const verify = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { ok: res.ok, data } as { ok: boolean; data: any };
    };

    // Try production first
    let { data } = await verify(PROD_URL);

    // If sandbox receipt used in production, retry in sandbox (status 21007)
    if (data?.status === 21007) {
      ({ data } = await verify(SANDBOX_URL));
    }

    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: corsHeaders
    });
  }
}); 