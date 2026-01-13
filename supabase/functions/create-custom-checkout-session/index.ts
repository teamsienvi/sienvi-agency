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

    const { clientName, clientEmail, customAmount, maxServices, notes, customerEmail } = await req.json();

    // Support both old (customerEmail) and new (clientEmail) parameter names
    const email = clientEmail || customerEmail;

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

    console.log("Creating custom checkout session:", { clientName, email, customAmount, maxServices, notes });

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";

    // Build checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
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
              description: `Custom plan for ${clientName || "Client"} with ${maxServices} service${maxServices > 1 ? "s" : ""} included`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: "custom",
        max_services: maxServices.toString(),
        custom_price: customAmount.toString(),
        client_name: clientName || "",
        notes: notes || "",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    };

    // Add customer email if provided
    if (email) {
      sessionOptions.customer_email = email;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

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
