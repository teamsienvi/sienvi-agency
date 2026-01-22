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
  single: "price_1SsCemDnw1azoLSpvfY7B30Y",
  triple: "price_1SsCenDnw1azoLSp613lo4Ye",
  full: "price_1SsCeoDnw1azoLSpO7KUsTYp",
};

// Individual service prices
const SERVICE_PRICE_IDS: Record<string, string> = {
  "custom-website": "price_1SsCelDnw1azoLSpQEQ0YSAB",
  "seo-aeo": "price_1SsCelDnw1azoLSpQEQ0YSAB",
  "custom-ai-assistant": "price_1SsCelDnw1azoLSpQEQ0YSAB",
  "amazon-design": "price_1SsCeiDnw1azoLSpWtUULskR",        // $999/mo
  "social-media-suite": "price_1SsCelDnw1azoLSpROO7m3P1",   // $2,450/mo
  "custom-lms": "price_1SsCemDnw1azoLSpSuyocfHZ",           // $2,450/mo
};

// Advertising pricing by channel count
const ADVERTISING_PRICE_IDS: Record<number, string> = {
  1: "price_1SsCeiDnw1azoLSpdKorTBU8",  // 1 channel = $888
  2: "price_1SsCejDnw1azoLSpKGej9Ksg",  // 2 channels = $1,776
  3: "price_1SsCejDnw1azoLSpheqeYG3a",  // 3 channels = $1,479 (bundle)
  4: "price_1SsCejDnw1azoLSpWC515bsb",  // 4 channels = $1,971 (bundle)
  5: "price_1SsCekDnw1azoLSpH2i8JsLM",  // 5 channels = $2,464 (bundle)
  6: "price_1SsCekDnw1azoLSpKL6oHsDB",  // 6 channels = $2,957 (bundle)
  7: "price_1SsCekDnw1azoLSpFwnEh8a2",  // 7 channels = $3,450 (all)
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

    if (plan === "custom" && customPrice) {
      // Create a one-time price for custom plans
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

    // Create checkout session with customer ID (required for Stripe Accounts V2)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: `${req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app"}/`,
      metadata: {
        client_id: clientId,
        plan: plan,
        selected_services: selectedServices ? JSON.stringify(selectedServices) : "[]",
        admin_generated: "true",
      },
      subscription_data: {
        metadata: {
          client_id: clientId,
          plan: plan,
        },
      },
    });

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