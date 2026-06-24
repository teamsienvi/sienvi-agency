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
      throw new Error("Invalid token: " + (authError?.message || "No user found"));
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

    const { clientId, clientEmail } = await req.json();

    if (!clientId && !clientEmail) {
      throw new Error("Client ID or clientEmail is required");
    }

    let email = (clientEmail || "").toLowerCase();
    let userId = null;
    let targetClientId = clientId;

    if (targetClientId) {
      const { data: clientProfile, error: profileFetchError } = await supabase
        .from("client_profiles")
        .select("id, email, user_id")
        .eq("id", targetClientId)
        .maybeSingle();

      if (profileFetchError) {
        console.error("Error fetching client profile:", profileFetchError);
        throw new Error(`Failed to fetch client profile: ${profileFetchError.message}`);
      }

      if (clientProfile) {
        email = (clientProfile.email || "").toLowerCase();
        userId = clientProfile.user_id;
      }
    } else if (email) {
      const { data: clientProfile, error: profileFetchError } = await supabase
        .from("client_profiles")
        .select("id, user_id")
        .eq("email", email)
        .maybeSingle();

      if (profileFetchError) {
        console.error("Error fetching client profile by email:", profileFetchError);
      }

      if (clientProfile) {
        targetClientId = clientProfile.id;
        userId = clientProfile.user_id;
      }
    }

    console.log(`Admin ${user.email} deleting client: id=${targetClientId || "n/a"}, email=${email || "n/a"}, userId=${userId || "n/a"}`);

    if (targetClientId) {
      // Cleanup dependent onboarding rows first (FK constraints)
      const { error: avatarsDelErr } = await supabase
        .from("onboarding_avatars")
        .delete()
        .eq("client_profile_id", targetClientId);
      if (avatarsDelErr) console.warn("onboarding_avatars delete warning:", avatarsDelErr);

      const { error: goalsDelErr } = await supabase
        .from("onboarding_goals")
        .delete()
        .eq("client_profile_id", targetClientId);
      if (goalsDelErr) console.warn("onboarding_goals delete warning:", goalsDelErr);

      const { error: questionnaireDelErr } = await supabase
        .from("onboarding_questionnaire")
        .delete()
        .eq("client_profile_id", targetClientId);
      if (questionnaireDelErr) console.warn("onboarding_questionnaire delete warning:", questionnaireDelErr);

      // Delete the client profile
      const { error: profileDelErr } = await supabase
        .from("client_profiles")
        .delete()
        .eq("id", targetClientId);

      if (profileDelErr) {
        console.error("client_profiles delete error:", profileDelErr);
        throw new Error(`Failed to delete client profile: ${profileDelErr.message}`);
      }
    }

    // Find auth user by email if we still don't have userId
    if (!userId && email) {
      console.log(`Looking up auth user by email: ${email}`);
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const foundUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        userId = foundUser.id;
        console.log(`Found auth user by email lookup: ${userId}`);
      }
    }

    // Delete the auth user
    if (userId) {
      console.log(`Deleting auth user: ${userId}`);
      const { error: authDelErr } = await supabase.auth.admin.deleteUser(userId);
      if (authDelErr) {
        console.warn("Auth user delete warning:", authDelErr);
      } else {
        console.log(`Successfully deleted auth user: ${userId}`);
      }
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

    console.log(`Successfully deleted client. id=${targetClientId || "n/a"}, email=${email || "n/a"}, userId=${userId || "n/a"}`);

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
