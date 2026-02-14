import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from client_profiles as the source of truth
    const { data: clientProfiles, error: profilesError } = await supabase
      .from("client_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching client profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch clients" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also fetch subscriptions to cross-reference Stripe IDs
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("email, stripe_customer_id, stripe_subscription_id, subscription_status, next_billing_date");

    // Build a lookup by email
    const subsByEmail: Record<string, any> = {};
    for (const sub of subscriptions || []) {
      if (sub.email) subsByEmail[sub.email.toLowerCase()] = sub;
    }

    // Map client_profiles and enrich with Stripe data from subscriptions
    const clients = (clientProfiles || []).map((profile: any) => {
      const sub = subsByEmail[profile.email?.toLowerCase()];
      const stripeCustomerId = profile.stripe_customer_id || sub?.stripe_customer_id || null;
      const stripeSubscriptionId = profile.stripe_subscription_id || sub?.stripe_subscription_id || null;

      // Auto-sync: if client_profiles is missing Stripe IDs but subscriptions has them
      if (sub && (!profile.stripe_customer_id || !profile.stripe_subscription_id)) {
        const syncData: Record<string, unknown> = {};
        if (!profile.stripe_customer_id && sub.stripe_customer_id) syncData.stripe_customer_id = sub.stripe_customer_id;
        if (!profile.stripe_subscription_id && sub.stripe_subscription_id) syncData.stripe_subscription_id = sub.stripe_subscription_id;
        if (Object.keys(syncData).length > 0) {
          supabase.from("client_profiles").update(syncData).eq("id", profile.id).then(() => {
            console.log(`Auto-synced Stripe IDs for ${profile.email}`);
          });
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        clientName: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null,
        plan: profile.plan,
        subscriptionStatus: profile.subscription_status,
        isActive: profile.account_status === "active" && profile.subscription_status === "active",
        selectedServices: profile.selected_services || [],
        onboardingCompleted: profile.onboarding_status === "completed",
        stripeCustomerId: stripeCustomerId || `pending_${profile.id}`,
        stripeSubscriptionId,
        customPrice: profile.custom_price,
        maxServices: profile.max_services,
        notes: profile.notes,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        contractStatus: profile.contract_status,
        onboardingStatus: profile.onboarding_status,
        accountStatus: profile.account_status,
      };
    });

    console.log(`Fetched ${clients.length} clients from client_profiles`);

    return new Response(
      JSON.stringify({ clients }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-admin-clients:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
