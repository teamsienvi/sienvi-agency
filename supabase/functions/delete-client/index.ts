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

    // Admin UI passes the subscriptions.id as clientId.
    // We need to resolve the related client_profiles row to avoid "email already exists" on re-create.
    const { data: subscription, error: subFetchError } = await supabase
      .from("subscriptions")
      .select("id,email,metadata")
      .eq("id", clientId)
      .maybeSingle();

    if (subFetchError) {
      console.warn("Subscription fetch warning:", subFetchError);
    }

    const email = (subscription?.email || "").toLowerCase() || null;
    const meta: any = subscription?.metadata ?? null;
    const profileIdFromMeta: string | null =
      meta?.client_profile_id || meta?.clientProfileId || null;

    // Try to resolve a client profile by metadata id, then by email
    let clientProfileId: string | null = null;

    if (profileIdFromMeta) {
      const { data: profileById, error: profileByIdError } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("id", profileIdFromMeta)
        .maybeSingle();

      if (profileByIdError) {
        console.warn("Profile-by-id lookup warning:", profileByIdError);
      }
      clientProfileId = profileById?.id ?? null;
    }

    if (!clientProfileId && email) {
      const { data: profileByEmail, error: profileByEmailError } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profileByEmailError) {
        console.warn("Profile-by-email lookup warning:", profileByEmailError);
      }
      clientProfileId = profileByEmail?.id ?? null;
    }

    // Cleanup dependent onboarding rows first (FK constraints)
    if (clientProfileId) {
      const { error: avatarsDelErr } = await supabase
        .from("onboarding_avatars")
        .delete()
        .eq("client_profile_id", clientProfileId);
      if (avatarsDelErr) console.warn("onboarding_avatars delete warning:", avatarsDelErr);

      const { error: goalsDelErr } = await supabase
        .from("onboarding_goals")
        .delete()
        .eq("client_profile_id", clientProfileId);
      if (goalsDelErr) console.warn("onboarding_goals delete warning:", goalsDelErr);

      const { error: questionnaireDelErr } = await supabase
        .from("onboarding_questionnaire")
        .delete()
        .eq("client_profile_id", clientProfileId);
      if (questionnaireDelErr) console.warn("onboarding_questionnaire delete warning:", questionnaireDelErr);

      const { error: profileDelErr } = await supabase
        .from("client_profiles")
        .delete()
        .eq("id", clientProfileId);

      if (profileDelErr) {
        console.error("client_profiles delete error:", profileDelErr);
        throw new Error(`Failed to delete client profile: ${profileDelErr.message}`);
      }
    } else if (email) {
      // Fallback (should be rare): delete profile by email
      const { error: profileDelByEmailErr } = await supabase
        .from("client_profiles")
        .delete()
        .eq("email", email);

      if (profileDelByEmailErr) {
        console.error("client_profiles delete-by-email error:", profileDelByEmailErr);
        throw new Error(`Failed to delete client profile: ${profileDelByEmailErr.message}`);
      }
    } else {
      console.warn("Could not resolve client profile for deletion; continuing with subscriptions cleanup only.");
    }

    // Delete subscription record(s)
    const { error: subDeleteByIdErr } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", clientId);

    if (subDeleteByIdErr) {
      console.warn("Subscription delete-by-id warning:", subDeleteByIdErr);
      // Don't throw - client_profiles is primary
    }

    if (email) {
      const { error: subDeleteByEmailErr } = await supabase
        .from("subscriptions")
        .delete()
        .eq("email", email);

      if (subDeleteByEmailErr) {
        console.warn("Subscription delete-by-email warning:", subDeleteByEmailErr);
      }
    }

    console.log(`Successfully deleted client ${clientId} (email=${email ?? "n/a"}, profileId=${clientProfileId ?? "n/a"})`);

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
