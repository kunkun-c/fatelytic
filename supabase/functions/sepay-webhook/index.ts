import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Optional: set a shared secret to validate incoming webhook calls.
const SEPAY_WEBHOOK_SECRET = Deno.env.get("SEPAY_WEBHOOK_SECRET");

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = atob(parts[1]);
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL or SERVICE_ROLE_KEY environment variable is not set");
}

if (SUPABASE_SERVICE_ROLE_KEY) {
  const payload = decodeJwtPayload(SUPABASE_SERVICE_ROLE_KEY);
  const role = payload && typeof payload.role === "string" ? payload.role : null;
}

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    })
  : null;

function safeString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function computeEventId(payloadText: string): Promise<string> {
  const data = new TextEncoder().encode(payloadText);
  try {
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hash);
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return `sha256:${hex}`;
  } catch {
    return `len:${data.length}`;
  }
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Sepay-Secret",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (SEPAY_WEBHOOK_SECRET) {
      const authHeader = req.headers.get("Authorization") ?? "";
      // Support both "Apikey SECRET" and "Bearer SECRET" formats
      const apiKeyMatch = authHeader.match(/^\s*Apikey\s+(.+)\s*$/i);
      const bearerMatch = authHeader.match(/^\s*Bearer\s+(.+)\s*$/i);
      const got = apiKeyMatch ? apiKeyMatch[1] : bearerMatch ? bearerMatch[1] : null;
      
      if (!got || got !== SEPAY_WEBHOOK_SECRET) {
        console.error("Webhook auth failed. Header:", authHeader);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payloadText = await req.text();
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const obj = payload as Record<string, unknown>;

    // Based on the sample docs: referenceCode + content
    const referenceCode = safeString(obj.referenceCode) ?? safeString(obj.reference_number);
    const content = safeString(obj.content) ?? safeString(obj.transaction_content) ?? "";
    const description = safeString(obj.description) ?? safeString(obj.body) ?? "";

    // We match topup by order_code embedded in description/content.
    // New format: DH + base36 timestamp + random base32 segment
    // Example: DHMABCD123EFGH567
    const orderCodeMatch = (content + "\n" + description).match(/FLT[A-Z0-9]{6,32}/);
    const orderCode = orderCodeMatch ? orderCodeMatch[0] : null;

    const eventId = referenceCode ?? (orderCode
      ? `order:${orderCode}:${payloadText.length}`
      : await computeEventId(payloadText));

    const { error: insertEventErr } = await supabaseAdmin
      .from("sepay_webhook_events")
      .insert({ event_id: eventId, payload })
      .select("id")
      .maybeSingle();

    // Duplicate event_id => already processed.
    let dedup = false;
    if (insertEventErr) {
      const msg = String((insertEventErr as { message?: unknown })?.message ?? "");
      if (msg.toLowerCase().includes("duplicate")) {
        // Important: don't early-return. We still want to process the order in case
        // previous attempts failed before updating/granting credits.
        dedup = true;
      } else {
        console.error("Failed to insert webhook event:", insertEventErr);
        return new Response(JSON.stringify({ error: "Failed to log webhook" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!orderCode) {
      await supabaseAdmin
        .from("sepay_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString(), error: "order_code_not_found" })
        .eq("event_id", eventId);

      return new Response(JSON.stringify({ ok: true, dedup }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("topup_orders")
      .select("id, user_id, credits, status")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (orderErr || !order) {
      await supabaseAdmin
        .from("sepay_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString(), error: "order_not_found" })
        .eq("event_id", eventId);

      return new Response(JSON.stringify({ ok: true, dedup }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status === "paid") {
      await supabaseAdmin
        .from("sepay_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("event_id", eventId);

      return new Response(JSON.stringify({ ok: true, dedup }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("topup_orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "pending");

    if (updateErr) {
      console.error("Failed to update order:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to update order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creditsToGrant = Number(order.credits ?? 0);
    const { error: grantErr } = await supabaseAdmin.rpc("grant_credits", {
      p_user_id: order.user_id,
      p_credits: creditsToGrant,
      p_reason: "topup_sepay",
      p_ref_type: "topup_orders",
      p_ref_id: String(order.id),
    });

    if (grantErr) {
      const msg = String((grantErr as { message?: unknown })?.message ?? "");
      console.error("Failed to grant credits (rpc):", grantErr);

      // Fallback: some projects use non-JWT service keys, which won't set request.jwt.claim.role.
      // In that case, the RPC rejects. We can still grant credits safely using service role DB access.
      if (msg.toLowerCase().includes("service_role")) {
        // Idempotency: if we already inserted a ledger row for this order, don't grant again.
        const { data: existingLedger } = await supabaseAdmin
          .from("credit_ledger")
          .select("id")
          .eq("ref_type", "topup_orders")
          .eq("ref_id", String(order.id))
          .eq("reason", "topup_sepay")
          .maybeSingle();

        if (!existingLedger) {
          await supabaseAdmin
            .from("wallets")
            .upsert(
              { user_id: order.user_id },
              { onConflict: "user_id", ignoreDuplicates: true }
            );

          const { data: walletRow, error: walletReadErr } = await supabaseAdmin
            .from("wallets")
            .select("balance_credits")
            .eq("user_id", order.user_id)
            .maybeSingle();

          if (walletReadErr) {
            await supabaseAdmin
              .from("sepay_webhook_events")
              .update({ processed: true, processed_at: new Date().toISOString(), error: `wallet_read_failed: ${String((walletReadErr as { message?: unknown })?.message ?? "")}` })
              .eq("event_id", eventId);

            return new Response(JSON.stringify({ error: "Failed to grant credits", details: "wallet_read_failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const currentBalance = Number((walletRow as { balance_credits?: unknown } | null)?.balance_credits ?? 0);
          const nextBalance = (Number.isFinite(currentBalance) ? currentBalance : 0) + creditsToGrant;

          const { error: walletUpdateErr } = await supabaseAdmin
            .from("wallets")
            .update({ balance_credits: nextBalance, updated_at: new Date().toISOString() } as unknown)
            .eq("user_id", order.user_id);

          if (walletUpdateErr) {
            await supabaseAdmin
              .from("sepay_webhook_events")
              .update({ processed: true, processed_at: new Date().toISOString(), error: `wallet_update_failed: ${String((walletUpdateErr as { message?: unknown })?.message ?? "")}` })
              .eq("event_id", eventId);

            return new Response(JSON.stringify({ error: "Failed to grant credits", details: "wallet_update_failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const { error: ledgerErr } = await supabaseAdmin
            .from("credit_ledger")
            .insert({
              user_id: order.user_id,
              delta_credits: creditsToGrant,
              reason: "topup_sepay",
              ref_type: "topup_orders",
              ref_id: String(order.id),
            });

          if (ledgerErr) {
            await supabaseAdmin
              .from("sepay_webhook_events")
              .update({ processed: true, processed_at: new Date().toISOString(), error: `ledger_insert_failed: ${String((ledgerErr as { message?: unknown })?.message ?? "")}` })
              .eq("event_id", eventId);

            return new Response(JSON.stringify({ error: "Failed to grant credits", details: "ledger_insert_failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } else {
        await supabaseAdmin
          .from("sepay_webhook_events")
          .update({ processed: true, processed_at: new Date().toISOString(), error: `grant_failed: ${msg}` })
          .eq("event_id", eventId);

        return new Response(JSON.stringify({ error: "Failed to grant credits", details: msg }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log(`Successfully granted ${order.credits} credits to user ${order.user_id}`);
      
      // Trigger wallet refresh event for UI updates
      // We can't directly dispatch events to the client from the edge function,
      // but the successful response will trigger the client-side polling to detect the change
    }

    await supabaseAdmin
      .from("sepay_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    return new Response(JSON.stringify({ ok: true, dedup }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sepay-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
