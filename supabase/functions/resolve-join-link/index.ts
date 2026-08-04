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

    // --- Derive redirect path from profile status ---
    // For most steps, the profile data alone tells us the redirect. The only ambiguous case
    // is when contract_status="not_signed" — could be a brand-new user needing password setup
    // or an existing user who needs to sign their contract. We resolve this by trying
    // generateLink(magiclink) — if it succeeds, the user exists and we check last_sign_in_at.
    let redirectPath = "/dashboard";
    let linkType: "invite" | "magiclink" = "magiclink";

    if (profile.contract_status === "not_signed") {
      // Ambiguous: new user or needs contract? Try magiclink to probe user state.
      const probe = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: targetEmail,
        options: { redirectTo: "https://sienvi.com/contract" },
      });

      if (!probe.error && probe.data?.user) {
        // Check user_metadata.password_set (set by the password setup form).
        // We DON'T use last_sign_in_at because admin test clicks contaminate it.
        const hasSetPassword = !!probe.data.user.user_metadata?.password_set;
        if (!hasSetPassword) {
          // Password not yet set → password setup first
          // Use "invite" type so auth redirect hash contains type=invite,
          // which AuthErrorHandler catches and routes to /login?setup=password
          redirectPath = "/login?setup=password";
          linkType = "invite";
        } else {
          redirectPath = "/contract";
          linkType = "magiclink";
        }
      } else {
        // User doesn't exist at all → brand new → invite + password setup
        redirectPath = "/login?setup=password";
        linkType = "invite";
      }
    } else if (profile.subscription_status === "pending_payment") {
      redirectPath = profile.plan ? `/checkout-summary?plan=${profile.plan}` : "/checkout-summary";
    } else if (profile.contract_status === "signed" && profile.onboarding_status !== "completed") {
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
