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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, clientId } = await req.json();

    // Get the client profile
    let profileQuery = supabaseAdmin.from("client_profiles").select("*");
    
    // If clientId is provided (admin action), use that; otherwise use current user
    if (clientId) {
      // Check if user is admin
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required to update other clients" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      profileQuery = profileQuery.eq("id", clientId);
    } else {
      profileQuery = profileQuery.eq("user_id", user.id);
    }

    const { data: profile, error: profileError } = await profileQuery.single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Client profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "sign_contract":
        if (profile.subscription_status !== "active") {
          return new Response(
            JSON.stringify({ error: "Payment must be completed before signing contract" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = {
          contract_status: "signed",
          contract_signed_at: new Date().toISOString(),
        };
        break;

      case "start_onboarding":
        if (profile.contract_status !== "signed") {
          return new Response(
            JSON.stringify({ error: "Contract must be signed before starting onboarding" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = {
          onboarding_status: "in_progress",
        };
        break;

      case "complete_onboarding":
        if (profile.onboarding_status === "not_started") {
          return new Response(
            JSON.stringify({ error: "Onboarding must be started first" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = {
          onboarding_status: "completed",
          onboarding_completed_at: new Date().toISOString(),
          account_status: "active",
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const { error: updateError } = await supabaseAdmin
      .from("client_profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, action }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in update-client-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});