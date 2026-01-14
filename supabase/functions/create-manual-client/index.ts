import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManualClientRequest {
  clientName: string;
  email: string;
  plan: "single" | "triple" | "full" | "custom";
  monthlyAmount: number;
  maxServices: number;
  selectedServices: string[];
  paymentMethod: "manual" | "stripe" | "invoice";
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    const body: ManualClientRequest = await req.json();
    console.log("Creating manual client:", body);

    // Validate required fields
    if (!body.clientName || !body.email || !body.plan || !body.monthlyAmount || !body.maxServices) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate plan limits
    const planLimits: Record<string, number> = { single: 1, triple: 3, full: 6, custom: 6 };
    const maxAllowed = body.plan === "custom" ? body.maxServices : planLimits[body.plan];
    if (body.selectedServices.length > maxAllowed) {
      return new Response(
        JSON.stringify({ error: `Too many services selected. Max allowed: ${maxAllowed}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create manual client record
    const { data: newClient, error: insertError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        email: body.email,
        plan: body.plan,
        selected_services: body.selectedServices,
        is_active: true,
        subscription_status: "manual",
        is_manual: true,
        payment_method: body.paymentMethod,
        stripe_customer_id: `manual_${Date.now()}`, // Placeholder ID for manual clients
        stripe_subscription_id: null,
        onboarding_completed: body.selectedServices.length > 0,
        metadata: {
          client_name: body.clientName,
          custom_price: body.monthlyAmount,
          max_services: body.maxServices,
          notes: body.notes || null,
          created_by_admin: user.id,
          original_payment_method: body.paymentMethod,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating manual client:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create client" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Manual client created:", newClient.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        client: newClient,
        message: "Manual client created successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-manual-client:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
