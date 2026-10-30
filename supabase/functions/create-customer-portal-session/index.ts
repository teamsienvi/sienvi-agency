import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Supabase environment variables not configured");
      throw new Error("Server configuration error");
    }

    // Verify the caller: a portal session grants billing access, so only the
    // client themselves or an admin may create one
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleData;

    // Get the email and optional stripeCustomerId from the request body
    const { email, stripeCustomerId } = await req.json();

    if (!email) {
      console.error("Missing email in request body");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!isAdmin && email.toLowerCase().trim() !== (user.email || "").toLowerCase().trim()) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating customer portal session for email: ${email}`);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Only admins may target a Stripe customer directly
    let targetCustomerId: string | null = (isAdmin && stripeCustomerId) || null;

    if (!targetCustomerId) {
      // Collect all distinct Stripe customer IDs for this client
      const allCustomerIds = new Set<string>();

      // 1. Check client_subscriptions (multi-sub clients)
      const { data: clientSubs } = await supabase
        .from("client_subscriptions")
        .select("stripe_customer_id")
        .eq("subscription_status", "active")
        .not("stripe_customer_id", "is", null);

      // We need the client_profile_id first
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("id, stripe_customer_id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (clientProfile) {
        // Get all client_subscriptions for this profile
        const { data: profileSubs } = await supabase
          .from("client_subscriptions")
          .select("stripe_customer_id, subscription_status")
          .eq("client_profile_id", clientProfile.id)
          .not("stripe_customer_id", "is", null);

        if (profileSubs) {
          for (const sub of profileSubs) {
            if (sub.stripe_customer_id && !sub.stripe_customer_id.startsWith("pending_")) {
              allCustomerIds.add(sub.stripe_customer_id);
            }
          }
        }

        // Also check the profile-level stripe_customer_id
        if (clientProfile.stripe_customer_id && !clientProfile.stripe_customer_id.startsWith("pending_")) {
          allCustomerIds.add(clientProfile.stripe_customer_id);
        }
      }

      // 2. Fall back to subscriptions table
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("email", email)
        .not("stripe_customer_id", "is", null);

      if (subs) {
        for (const sub of subs) {
          if (sub.stripe_customer_id && !sub.stripe_customer_id.startsWith("pending_")) {
            allCustomerIds.add(sub.stripe_customer_id);
          }
        }
      }

      const customerIds = Array.from(allCustomerIds);
      console.log(`Found ${customerIds.length} Stripe customer ID(s) for ${email}:`, customerIds);

      if (customerIds.length === 0) {
        console.error(`No Stripe customer ID found for email: ${email}`);
        return new Response(
          JSON.stringify({ error: "No billing information found" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      if (customerIds.length === 1) {
        targetCustomerId = customerIds[0];
      } else {
        // Multiple customer IDs — find the one with the most active subscriptions in Stripe
        let bestCustomerId = customerIds[0];
        let bestActiveCount = 0;

        for (const custId of customerIds) {
          try {
            const stripeSubs = await stripe.subscriptions.list({
              customer: custId,
              status: "active",
              limit: 100,
            });
            const activeCount = stripeSubs.data.length;
            console.log(`Customer ${custId}: ${activeCount} active subscription(s)`);
            if (activeCount > bestActiveCount) {
              bestActiveCount = activeCount;
              bestCustomerId = custId;
            }
          } catch (e) {
            console.error(`Error checking subscriptions for ${custId}:`, e);
          }
        }

        targetCustomerId = bestCustomerId;
        console.log(`Selected primary customer: ${targetCustomerId} (${bestActiveCount} active subs)`);
      }
    }

    // Get the origin from the request or use a default
    const origin = req.headers.get("origin") || "https://sienvi.com";

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: `${origin}/dashboard`,
    });

    console.log(`Customer portal session created: ${portalSession.id} for customer: ${targetCustomerId}`);

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
