import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { requireAdmin } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const denied = await requireAdmin(req, corsHeaders);
    if (denied) return denied;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.json();
    const { action, targetCustomerId, subscriptionId, paymentMethodId, fromCustomerId, toCustomerId } = body;

    if (action === "check-subs") {
      const subs = await stripe.subscriptions.list({ customer: targetCustomerId, limit: 100 });
      const pms = await stripe.paymentMethods.list({ customer: targetCustomerId, type: "card" });
      const customer = await stripe.customers.retrieve(targetCustomerId);
      return new Response(JSON.stringify({ 
        customer: {
          id: targetCustomerId,
          default_source: (customer as any).default_source,
          invoice_settings_default_pm: (customer as any).invoice_settings?.default_payment_method,
        },
        paymentMethods: pms.data.map(pm => ({
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          exp: `${pm.card?.exp_month}/${pm.card?.exp_year}`,
        })),
        subscriptions: subs.data.map(s => ({
          id: s.id,
          status: s.status,
          default_payment_method: s.default_payment_method,
          items: s.items.data.map(i => ({
            priceId: i.price.id,
            amount: i.price.unit_amount,
            interval: i.price.recurring?.interval,
          })),
          current_period_end: new Date(s.current_period_end * 1000).toISOString(),
          trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
        })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "attach-pm") {
      // Attach a payment method from one customer to another
      const pms = await stripe.paymentMethods.list({ customer: fromCustomerId, type: "card" });
      const results = [];
      for (const pm of pms.data) {
        try {
          await stripe.paymentMethods.detach(pm.id);
          await stripe.paymentMethods.attach(pm.id, { customer: toCustomerId });
          results.push({ id: pm.id, last4: pm.card?.last4, status: "moved" });
        } catch (e: any) {
          results.push({ id: pm.id, last4: pm.card?.last4, status: "error", error: e.message });
        }
      }
      return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "set-sub-pm") {
      // Set default payment method on a subscription
      const updated = await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      });
      return new Response(JSON.stringify({ 
        success: true, 
        subscriptionId,
        default_payment_method: updated.default_payment_method,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "set-trial-end") {
      const { trialEnd } = body;
      const updated = await stripe.subscriptions.update(subscriptionId, {
        trial_end: trialEnd,
        proration_behavior: "none",
      });
      return new Response(JSON.stringify({ 
        success: true, 
        subscriptionId,
        trial_end: updated.trial_end ? new Date(updated.trial_end * 1000).toISOString() : null,
        status: updated.status,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
