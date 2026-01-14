import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateClientRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  clientType: "new" | "existing";
  plan: "single" | "triple" | "full" | "custom";
  customPrice?: number;
  maxServices?: number;
  subscriptionStatus: "pending_payment" | "active" | "past_due" | "canceled";
  contractStatus: "not_signed" | "signed";
  contractSignedAt?: string;
  onboardingStatus: "not_started" | "in_progress" | "completed";
  notes?: string;
  selectedServices?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
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

    // Check admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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

    const body: CreateClientRequest = await req.json();
    console.log("Creating client:", body);

    // Validate required fields
    if (!body.email || !body.plan) {
      return new Response(
        JSON.stringify({ error: "Email and plan are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from("client_profiles")
      .select("id")
      .eq("email", body.email.toLowerCase())
      .single();

    if (existingClient) {
      return new Response(
        JSON.stringify({ error: "A client with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate max_services based on plan
    const planLimits: Record<string, number> = { single: 1, triple: 3, full: 6, custom: 6 };
    const maxServices = body.plan === "custom" && body.maxServices 
      ? body.maxServices 
      : planLimits[body.plan];

    // Set account_status based on subscription_status
    let accountStatus = "pending";
    if (body.subscriptionStatus === "active" && body.contractStatus === "signed") {
      accountStatus = "active";
    }

    // Create client profile
    const { data: newClient, error: insertError } = await supabaseAdmin
      .from("client_profiles")
      .insert({
        email: body.email.toLowerCase(),
        first_name: body.firstName || null,
        last_name: body.lastName || null,
        role: "client",
        account_status: accountStatus,
        plan: body.plan,
        subscription_status: body.subscriptionStatus,
        contract_status: body.contractStatus,
        contract_signed_at: body.contractStatus === "signed" ? (body.contractSignedAt || new Date().toISOString()) : null,
        onboarding_status: body.onboardingStatus,
        onboarding_completed_at: body.onboardingStatus === "completed" ? new Date().toISOString() : null,
        max_services: maxServices,
        selected_services: body.selectedServices || [],
        notes: body.notes || null,
        custom_price: body.plan === "custom" ? body.customPrice : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating client:", insertError);
      return new Response(
        JSON.stringify({ error: `Failed to create client: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also create a subscription record for backwards compatibility
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        email: body.email.toLowerCase(),
        plan: body.plan,
        selected_services: body.selectedServices || [],
        is_active: body.subscriptionStatus === "active",
        subscription_status: body.subscriptionStatus,
        is_manual: false,
        payment_method: "stripe",
        stripe_customer_id: `pending_${Date.now()}`,
        onboarding_completed: body.onboardingStatus === "completed",
        metadata: {
          client_name: `${body.firstName || ""} ${body.lastName || ""}`.trim() || null,
          custom_price: body.plan === "custom" ? body.customPrice : null,
          max_services: maxServices,
          notes: body.notes || null,
          created_by_admin: user.id,
          client_profile_id: newClient.id,
        },
      });

    if (subError) {
      console.error("Error creating subscription record:", subError);
      // Don't fail - client_profiles is the source of truth
    }

    console.log("Client created:", newClient.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        client: newClient,
        message: "Client created successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-client:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});