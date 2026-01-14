import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price ID to plan mapping (Test Mode)
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1SpbnaDnw1azoLSpAmnnUwMX": "single",
  "price_1Spbo0Dnw1azoLSpUgAdICKR": "triple",
  "price_1SpboRDnw1azoLSpG07N2lA0": "full",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { priceId, selectedServices, plan } = await req.json();

    if (!priceId) {
      console.error("Missing priceId in request body");
      return new Response(
        JSON.stringify({ error: "priceId is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate price ID
    const planFromPrice = PRICE_TO_PLAN[priceId];
    if (!planFromPrice) {
      console.error(`Invalid priceId: ${priceId}`);
      return new Response(
        JSON.stringify({ error: "Invalid priceId" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Creating checkout session for plan: ${planFromPrice}, priceId: ${priceId}, services: ${selectedServices?.join(', ')}`);

    // Get the origin from the request or use a default
    const origin = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";

    // Create a customer first (required for Stripe Accounts V2 in testmode)
    const customer = await stripe.customers.create({
      metadata: {
        source: "checkout_session",
        plan: plan || planFromPrice,
      },
    });

    console.log(`Created Stripe customer: ${customer.id}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        product: "sienvi_automation",
        plan: plan || planFromPrice,
        selected_services: selectedServices ? JSON.stringify(selectedServices) : "",
      },
      // Use {CHECKOUT_SESSION_ID} placeholder - Stripe replaces this with actual session ID
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/select-services?plan=${plan || planFromPrice}`,
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
