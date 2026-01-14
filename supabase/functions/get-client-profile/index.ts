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

    // Get client profile by user_id first, then by email
    let { data: profile, error: profileError } = await supabaseAdmin
      .from("client_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If not found by user_id, try by email
    if (profileError || !profile) {
      const { data: profileByEmail, error: emailError } = await supabaseAdmin
        .from("client_profiles")
        .select("*")
        .eq("email", user.email?.toLowerCase())
        .single();
      
      if (!emailError && profileByEmail) {
        profile = profileByEmail;
        
        // Link user_id to the profile
        await supabaseAdmin
          .from("client_profiles")
          .update({ user_id: user.id })
          .eq("id", profileByEmail.id);
      }
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Client profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    return new Response(
      JSON.stringify({ 
        profile: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          accountStatus: profile.account_status,
          plan: profile.plan,
          subscriptionStatus: profile.subscription_status,
          stripeCustomerId: profile.stripe_customer_id,
          stripeSubscriptionId: profile.stripe_subscription_id,
          contractStatus: profile.contract_status,
          contractSignedAt: profile.contract_signed_at,
          onboardingStatus: profile.onboarding_status,
          onboardingCompletedAt: profile.onboarding_completed_at,
          maxServices: profile.max_services,
          selectedServices: profile.selected_services,
          customPrice: profile.custom_price,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        isAdmin: !!roleData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-client-profile:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});