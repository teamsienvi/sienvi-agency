import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const { customAmount, maxServices, notes, customerEmail } = await req.json();

    // Validate inputs
    if (!customAmount || typeof customAmount !== "number" || customAmount < 1) {
      console.error("Invalid customAmount:", customAmount);
      return new Response(
        JSON.stringify({ error: "Invalid custom amount. Must be a positive number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!maxServices || typeof maxServices !== "number" || maxServices < 1 || maxServices > 6) {
      console.error("Invalid maxServices:", maxServices);
      return new Response(
        JSON.stringify({ error: "Invalid max services. Must be between 1 and 6." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating custom checkout session:", { customAmount, maxServices, notes, customerEmail });

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";

    // Create the checkout session with price_data for custom pricing
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(customAmount * 100), // Convert to cents
            recurring: {
              interval: "month",
            },
            product_data: {
              name: "Sienvi Custom Automation Bundle",
              description: `Custom plan with ${maxServices} service${maxServices > 1 ? "s" : ""} included`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: "custom",
        max_services: maxServices.toString(),
        custom_price: customAmount.toString(),
        notes: notes || "",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });

    console.log("Custom checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating custom checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
