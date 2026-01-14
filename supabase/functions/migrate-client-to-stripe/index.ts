import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MigrateClientRequest {
  clientId: string;
  priceId?: string; // Optional: for standard plans
  customPrice?: number; // For custom pricing
}

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
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client to check admin status
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: MigrateClientRequest = await req.json();
    console.log("Migrating client to Stripe:", body);

    if (!body.clientId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("id", body.clientId)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if client is already on Stripe
    if (client.payment_method === "stripe" && client.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "Client already has an active Stripe subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Price IDs for standard plans
    const planPriceIds: Record<string, string> = {
      single: "price_1SpFvwDnw1azoLSp17B18jKB",
      triple: "price_1SpFwRDnw1azoLSpuZNVz26s",
      full: "price_1SpFwgDnw1azoLSpFNy5x58Z",
    };

    let priceId = body.priceId;
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    const metadata = client.metadata as Record<string, any> || {};

    if (client.plan === "custom" || body.customPrice) {
      // Create a custom price for this client
      const amount = body.customPrice || metadata.custom_price || 0;
      const product = await stripe.products.create({
        name: `Custom Plan - ${metadata.client_name || client.email}`,
        description: `Custom automation package with ${metadata.max_services || 6} services`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: "usd",
        recurring: { interval: "month" },
      });

      priceId = price.id;
    } else {
      priceId = planPriceIds[client.plan || "single"];
    }

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Could not determine price for migration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    lineItems = [{ price: priceId, quantity: 1 }];

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/admin/clients`,
      customer_email: client.email || undefined,
      metadata: {
        client_id: client.id,
        migrated_from: "manual",
        original_payment_method: client.payment_method,
        plan: client.plan || "custom",
        selected_services: JSON.stringify(client.selected_services || []),
        client_name: metadata.client_name || "",
        max_services: String(metadata.max_services || 6),
      },
      subscription_data: {
        metadata: {
          client_id: client.id,
          migrated_from: "manual",
          original_payment_method: client.payment_method,
        },
      },
    });

    // Update client status to pending migration
    await supabaseAdmin
      .from("subscriptions")
      .update({
        migration_status: "pending_migration",
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    console.log("Migration checkout session created:", session.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: session.url,
        sessionId: session.id,
        message: "Migration checkout link generated" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in migrate-client-to-stripe:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
