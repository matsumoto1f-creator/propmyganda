// Stripe → PMG. On a paid Checkout Session: mark the order paid and run the
// shared fulfilment (calendar, sheets, email). Replays are acknowledged and ignored.
//
// Secrets: STRIPE_WEBHOOK_SECRET plus those listed in _shared/fulfil.ts.
import { createClient } from "npm:@supabase/supabase-js@2";
import { fulfil } from "../_shared/fulfil.ts";
import { sendEmail, teamEmail } from "../_shared/email.ts";
import { formatUsd } from "../_shared/tiers.ts";
import { parseStripeSignature, type OrderRow } from "../_shared/onboarding.ts";

async function verify(raw: string, header: string | null, secret: string): Promise<boolean> {
  const sig = parseStripeSignature(header);
  if (!sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(sig.t)) > 600) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${sig.t}.${raw}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sig.v1.includes(hex);
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("STRIPE_WEBHOOK_SECRET missing", { status: 500 });
  const raw = await req.text();
  if (!(await verify(raw, req.headers.get("stripe-signature"), secret))) return new Response("Bad signature", { status: 400 });
  const event = JSON.parse(raw);
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return ok({ received: true, ignored: event.type });
  const session = event.data.object;
  if (session.payment_status !== "paid") return ok({ received: true, pending: true });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Add-ons bought on /start/addons: mark the add-on order paid and tell the artist and the team.
  if (session.metadata?.kind === "addon") {
    const { data: ao } = await supabase.from("addon_orders").select("*").eq("id", session.metadata.addon_order_id ?? session.client_reference_id).maybeSingle();
    if (!ao) return new Response("Add-on order not found", { status: 404 });
    if (ao.paid_at) return ok({ received: true, duplicate: true });
    await supabase.from("addon_orders").update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent: session.payment_intent ?? null, stripe_session_id: session.id }).eq("id", ao.id);
    const list = (ao.items as { name: string; label: string; detail: string; priceCents: number }[]).map((l) => `  · ${l.name} — ${l.label} — ${formatUsd(l.priceCents)}\n    ${l.detail}`).join("\n");
    const errors: string[] = [];
    try {
      await sendEmail(ao.email, "PMG · your add-ons are in", [`${ao.artist_name} — got it. Paid ${formatUsd(ao.total_cents)}.`, "", list, "", ao.notes ? `Your note: ${ao.notes}\n` : "", "A person on the team replies on this thread to line each one up. Reply here with anything we should know first.", "", "— PMG"].join("\n"), { bccTeam: true });
      const team = teamEmail();
      if (team) await sendEmail(team, `[PMG add-ons] ${ao.artist_name} · ${formatUsd(ao.total_cents)}`, [`${ao.artist_name} <${ao.email}> bought add-ons.`, "", list, "", ao.notes ? `Note: ${ao.notes}` : "", ao.order_id ? `Booking: ${ao.order_id}` : "No booking attached.", "", "https://propmyganda.com/admin/funnel"].join("\n"), { replyTo: ao.email });
    } catch (e) { errors.push(`email: ${e instanceof Error ? e.message : e}`); }
    return ok({ received: true, addon: true, errors });
  }

  const orderId = session.metadata?.order_id ?? session.client_reference_id;
  const { data: order } = await supabase.from("onboarding_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return new Response("Order not found", { status: 404 });

  // The balance on a deposit order: mark it and stop. The booking was fulfilled when the deposit landed.
  if (session.metadata?.kind === "balance") {
    if (order.balance_paid_at) return ok({ received: true, duplicate: true });
    await supabase.from("onboarding_orders").update({ balance_paid_at: new Date().toISOString(), balance_method: "link", status: "paid", balance_note: session.payment_intent ?? null }).eq("id", order.id);
    return ok({ received: true, balance: true });
  }
  if (order.paid_at) return ok({ received: true, duplicate: true });

  // A deposit saved the card (setup_future_usage); keep the customer and payment method for the day-before pull.
  let saved: Record<string, unknown> = {};
  if (session.metadata?.kind === "deposit" && session.customer && session.payment_intent) {
    try {
      const key = Deno.env.get("STRIPE_SECRET_KEY");
      const r = await fetch(`https://api.stripe.com/v1/payment_intents/${session.payment_intent}`, { headers: { Authorization: `Bearer ${key}` } });
      const pi = await r.json();
      if (r.ok && pi.payment_method) saved = { stripe_customer_id: session.customer, stripe_payment_method_id: pi.payment_method };
    } catch (e) { console.error("payment method lookup failed", e instanceof Error ? e.message : e); }
  }

  const paidStatus = order.payment_plan === "deposit" ? "deposit_paid" : "paid";
  const cardholder = String(session.customer_details?.name ?? "").trim();
  await supabase.from("onboarding_orders").update({
    status: paidStatus, paid_at: new Date().toISOString(), stripe_payment_intent: session.payment_intent ?? null, stripe_session_id: session.id,
    last_step: 6, step_at: new Date().toISOString(), ...saved,
    ...(cardholder && order.legal_name === order.artist_name ? { legal_name: cardholder } : {}),
  }).eq("id", order.id);

  const { patch, errors } = await fulfil(supabase, order as OrderRow, paidStatus);
  await supabase.from("onboarding_orders").update(patch).eq("id", order.id);
  return ok({ received: true, errors });
});
