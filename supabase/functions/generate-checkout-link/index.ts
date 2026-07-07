import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// STRIPE PRICE IDS (Live - Created via API)
// ============================================

// Bundle plans
const PLAN_PRICE_IDS: Record<string, string> = {
  single: "price_1TmzSSDnw1azoLSpVISk2j7g",
  triple: "price_1TmzSTDnw1azoLSpaa2hhifg",
  full: "price_1TmzSTDnw1azoLSpyqfODpkC",
};

// Individual service prices
const SERVICE_PRICE_IDS: Record<string, string> = {
  "custom-website": "price_1TmzSSDnw1azoLSpdu8Ro2qj",
  "seo-aeo": "price_1TmzSSDnw1azoLSpdu8Ro2qj",
  "custom-ai-assistant": "price_1TmzSSDnw1azoLSpdu8Ro2qj",
  "amazon-design": "price_1TmzSQDnw1azoLSpnP8Zv2uA",
  "social-media-suite": "price_1TmzSSDnw1azoLSp9lSJ8jTS",
  "custom-lms": "price_1TmzSSDnw1azoLSpeZvymtPf",
};

// Advertising pricing by channel count
const ADVERTISING_PRICE_IDS: Record<number, string> = {
  1: "price_1TmzSRDnw1azoLSpBjYhowwg",
  2: "price_1TmzSRDnw1azoLSpAzyv0tkW",
  3: "price_1TmzSRDnw1azoLSp4QyTp9Qv",
  4: "price_1TmzSRDnw1azoLSptPh0wjZ0",
  5: "price_1TmzSRDnw1azoLSpvBkjCky8",
  6: "price_1TmzSRDnw1azoLSpRDE5DMx3",
  7: "price_1TmzSRDnw1azoLSpeQNPrjO8",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { clientId, clientEmail, plan, customPrice, selectedServices } = await req.json();

    if (!clientId || !clientEmail || !plan) {
      return new Response(
        JSON.stringify({ error: "Client ID, email, and plan are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // First, check if customer already exists or create a new one
    // This is required for Stripe Accounts V2 testmode
    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: clientEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log("Using existing Stripe customer:", customerId);
    } else {
      const newCustomer = await stripe.customers.create({
        email: clientEmail,
        metadata: {
          client_id: clientId,
        },
      });
      customerId = newCustomer.id;
      console.log("Created new Stripe customer:", customerId);
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (plan === "advertising") {
      // Advertising plan: price based on number of selected channels
      const channelCount = selectedServices ? selectedServices.filter((s: string) => s.startsWith("channel-")).length : 1;
      const adPriceId = ADVERTISING_PRICE_IDS[Math.min(Math.max(channelCount, 1), 7)];
      if (!adPriceId) {
        return new Response(
          JSON.stringify({ error: "Invalid advertising channel count" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      lineItems = [{ price: adPriceId, quantity: 1 }];
    } else if (plan === "amazon") {
      // Amazon Design Package
      const amazonPriceId = SERVICE_PRICE_IDS["amazon-design"];
      lineItems = [{ price: amazonPriceId, quantity: 1 }];
    } else if (plan === "custom" && customPrice) {
      const price = await stripe.prices.create({
        unit_amount: Math.round(customPrice * 100),
        currency: "usd",
        recurring: { interval: "month" },
        product_data: {
          name: `Custom Plan - ${clientEmail}`,
        },
      });
      lineItems = [{ price: price.id, quantity: 1 }];
    } else {
      const priceId = PLAN_PRICE_IDS[plan];
      if (!priceId) {
        return new Response(
          JSON.stringify({ error: "Invalid plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      lineItems = [{ price: priceId, quantity: 1 }];
    }

    // Amazon Design is a one-time payment; everything else is a subscription
    const isOneTime = plan === "amazon";
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isOneTime ? "payment" : "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: `${req.headers.get("origin") || "https://sienvi.com"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://sienvi.com"}/`,
      metadata: {
        client_id: clientId,
        plan: plan,
        selected_services: selectedServices ? JSON.stringify(selectedServices) : "[]",
        admin_generated: "true",
      },
    };

    // Only add subscription_data for recurring plans
    if (!isOneTime) {
      sessionParams.subscription_data = {
        metadata: {
          client_id: clientId,
          plan: plan,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("Checkout link generated for client:", clientId, "URL:", session.url);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating checkout link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});