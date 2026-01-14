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
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Invalid token");
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Admin access required");
    }

    const { clientId } = await req.json();

    if (!clientId) {
      throw new Error("Client ID is required");
    }

    console.log(`Admin ${user.email} deleting client ${clientId}`);

    // clientId is now the client_profiles.id directly
    // First, fetch the client profile to get the email
    const { data: clientProfile, error: profileFetchError } = await supabase
      .from("client_profiles")
      .select("id, email, user_id")
      .eq("id", clientId)
      .maybeSingle();

    if (profileFetchError) {
      console.error("Error fetching client profile:", profileFetchError);
      throw new Error(`Failed to fetch client profile: ${profileFetchError.message}`);
    }

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    const email = (clientProfile.email || "").toLowerCase();
    const userId = clientProfile.user_id;

    console.log(`Found client profile: id=${clientId}, email=${email}, user_id=${userId}`);

    // Cleanup dependent onboarding rows first (FK constraints)
    const { error: avatarsDelErr } = await supabase
      .from("onboarding_avatars")
      .delete()
      .eq("client_profile_id", clientId);
    if (avatarsDelErr) console.warn("onboarding_avatars delete warning:", avatarsDelErr);

    const { error: goalsDelErr } = await supabase
      .from("onboarding_goals")
      .delete()
      .eq("client_profile_id", clientId);
    if (goalsDelErr) console.warn("onboarding_goals delete warning:", goalsDelErr);

    const { error: questionnaireDelErr } = await supabase
      .from("onboarding_questionnaire")
      .delete()
      .eq("client_profile_id", clientId);
    if (questionnaireDelErr) console.warn("onboarding_questionnaire delete warning:", questionnaireDelErr);

    // Delete the client profile
    const { error: profileDelErr } = await supabase
      .from("client_profiles")
      .delete()
      .eq("id", clientId);

    if (profileDelErr) {
      console.error("client_profiles delete error:", profileDelErr);
      throw new Error(`Failed to delete client profile: ${profileDelErr.message}`);
    }

    // Also cleanup any subscription records by email (if they exist)
    if (email) {
      const { error: subDeleteByEmailErr } = await supabase
        .from("subscriptions")
        .delete()
        .eq("email", email);

      if (subDeleteByEmailErr) {
        console.warn("Subscription delete-by-email warning:", subDeleteByEmailErr);
      }
    }

    console.log(`Successfully deleted client ${clientId} (email=${email || "n/a"}, userId=${userId || "n/a"})`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
