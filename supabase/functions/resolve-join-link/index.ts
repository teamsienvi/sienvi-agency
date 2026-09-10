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
    const url = new URL(req.url);
    const code = url.searchParams.get("c") || url.searchParams.get("code");
    const clientId = url.searchParams.get("id");

    if (!code && !clientId) {
      return new Response(
        JSON.stringify({ error: "Code or client ID parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let profile: any = null;

    if (code) {
      const { data } = await supabaseAdmin
        .from("client_profiles")
        .select("id, email, notes, contract_status, subscription_status, onboarding_status, plan")
        .ilike("notes", `%[MagicUrl:${code}:%`)
        .maybeSingle();
      profile = data;
    } else if (clientId) {
      const { data } = await supabaseAdmin
        .from("client_profiles")
        .select("id, email, notes, contract_status, subscription_status, onboarding_status")
        .eq("id", clientId)
        .maybeSingle();
      profile = data;
    }

    if (!profile || !profile.notes || !profile.email) {
      return new Response(
        JSON.stringify({ error: "Link expired or invalid. Please request a new invite link from support." }),
        { status: 444, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the stored redirect path from notes: [MagicUrl:code:redirectPath]
    // Legacy format also supported: [MagicUrl:code:https://...]
    const match = profile.notes.match(/\[MagicUrl:(?:[^:]+):([^\]]+)\]/);
    if (!match || !match[1]) {
      return new Response(
        JSON.stringify({ error: "No active login link found for this account." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetEmail = profile.email.split(/[,;]/)[0].trim().toLowerCase();

    // --- Account "fully set up" check (from profile data, no auth call needed) ---
    const isFullySetUp =
      profile.contract_status === "signed" &&
      profile.subscription_status !== "pending_payment" &&
      profile.onboarding_status === "completed";

    if (isFullySetUp) {
      return new Response(
        JSON.stringify({ error: "Your account has already been set up! Please sign in directly at sienvi.com/login" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Universal password check ---
    // Before any status-based routing, check if the user has set their password.
    // If not, they MUST set a password first regardless of contract/payment status.
    const isProspect = profile.plan === "prospect";
    const isDiscovery = isProspect || profile.plan === "discovery" || profile.plan === "custom-lms";

    let redirectPath = "/dashboard";
    let linkType: "invite" | "magiclink" = "magiclink";

    const passwordProbe = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
      options: { redirectTo: `https://sienvi.com/dashboard` },
    });

    const authUserExists = !passwordProbe.error && passwordProbe.data?.user;
    const hasSetPassword = authUserExists && !!passwordProbe.data.user.user_metadata?.password_set;

    if (!hasSetPassword) {
      // Password not set → must set password first, then they'll be routed on next login
      redirectPath = "/login?setup=password";
      linkType = authUserExists ? "magiclink" : "invite";
    } else if (isProspect && profile.contract_status === "not_signed") {
      // Password already set (checked above) → go straight to onboarding
      redirectPath = "/onboarding";
    } else if (profile.contract_status === "not_signed") {
      // Password already set (checked above) → go to contract signing
      redirectPath = "/contract";
    } else if (profile.subscription_status === "pending_payment" && !isProspect) {
      // Check if client has multiple subscriptions or a custom plan —
      // these should go to /dashboard where per-subscription checkout buttons are
      const { count } = await supabaseAdmin
        .from("client_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("client_profile_id", profile.id);
      const hasMultipleSubs = (count || 0) > 1;
      const isCustomPlan = profile.plan === "custom";

      if (hasMultipleSubs || isCustomPlan) {
        redirectPath = "/dashboard";
      } else {
        redirectPath = profile.plan ? `/checkout-summary?plan=${profile.plan}` : "/checkout-summary";
      }
    } else if ((profile.contract_status === "signed" || isDiscovery) && profile.onboarding_status !== "completed") {
      redirectPath = "/onboarding";
    }

    // --- Generate the final magic link with the correct redirect ---
    let linkData: any = null;
    const attempt = await supabaseAdmin.auth.admin.generateLink({
      type: linkType,
      email: targetEmail,
      options: { redirectTo: `https://sienvi.com${redirectPath}` },
    });

    if (!attempt.error && attempt.data) {
      linkData = attempt.data;
    } else {
      // Fallback to opposite type
      const fallbackType = linkType === "invite" ? "magiclink" : "invite";
      const fallback = await supabaseAdmin.auth.admin.generateLink({
        type: fallbackType,
        email: targetEmail,
        options: { redirectTo: `https://sienvi.com${redirectPath}` },
      });
      if (!fallback.error && fallback.data) {
        linkData = fallback.data;
      } else {
        console.error("Failed to generate link:", attempt.error, fallback.error);
        return new Response(
          JSON.stringify({ error: "Unable to generate login link. Please contact support." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const targetUrl = linkData.properties?.action_link || "";
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Failed to create authentication link. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Resolved join link for:", targetEmail, "→", redirectPath);

    return new Response(
      JSON.stringify({ targetUrl, clientEmail: targetEmail, redirectPath }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error resolving join link:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
