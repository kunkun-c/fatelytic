import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SEPAY_QR_ACC = Deno.env.get("SEPAY_QR_ACC");
const SEPAY_QR_BANK = Deno.env.get("SEPAY_QR_BANK");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL or SERVICE_ROLE_KEY environment variable is not set");
}

if (!SEPAY_QR_ACC || !SEPAY_QR_BANK) {
  console.error("SEPAY_QR_ACC or SEPAY_QR_BANK environment variable is not set");
}

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization") ?? "";
  const m = header.match(/^\s*Bearer\s+(.+)\s*$/i);
  return m ? m[1] : null;
}

function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "FTL-";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

type RequestBody = {
  amountVnd: number;
  credits: number;
};

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!supabaseAdmin || !SEPAY_QR_ACC || !SEPAY_QR_BANK) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;

    const token = getBearerToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const authedUser = authData?.user ?? null;
    if (authError || !authedUser) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message ?? "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountVnd = Number(body?.amountVnd);
    const credits = Number(body?.credits);

    if (!Number.isFinite(amountVnd) || amountVnd <= 0 || !Number.isInteger(amountVnd)) {
      return new Response(JSON.stringify({ error: "Invalid amountVnd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Number.isFinite(credits) || credits <= 0 || !Number.isInteger(credits)) {
      return new Response(JSON.stringify({ error: "Invalid credits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed: Array<{ amountVnd: number; credits: number }> = [
      { amountVnd: 29000, credits: 50 },
      { amountVnd: 59000, credits: 120 },
      { amountVnd: 99000, credits: 220 },
      { amountVnd: 199000, credits: 500 },
    ];

    const ok = allowed.some((p) => p.amountVnd === amountVnd && p.credits === credits);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Package not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderCode = generateOrderCode();
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(SEPAY_QR_ACC)}&bank=${encodeURIComponent(SEPAY_QR_BANK)}&amount=${encodeURIComponent(String(amountVnd))}&des=${encodeURIComponent(orderCode)}`;

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("topup_orders")
      .insert({
        user_id: authedUser.id,
        provider: "sepay",
        amount_vnd: amountVnd,
        credits,
        status: "pending",
        order_code: orderCode,
        qr_url: qrUrl,
        qr_payload: {
          acc: SEPAY_QR_ACC,
          bank: SEPAY_QR_BANK,
          amount: amountVnd,
          des: orderCode,
        },
      })
      .select("id, order_code, amount_vnd, credits, status, qr_url, created_at")
      .single();

    if (insertErr) {
      console.error("Failed to create topup order:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ order: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-topup-order error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
