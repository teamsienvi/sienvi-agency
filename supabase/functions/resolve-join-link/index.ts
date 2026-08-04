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

    // --- Check auth status ---
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = authUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    const hasSignedIn = !!existingAuthUser?.last_sign_in_at;
    // Only use last_sign_in_at to determine new user status.
    // email_confirmed_at is unreliable because admin.generateLink({ type: "invite" })
    // automatically confirms the email when the auth user is created.
    const isNewUser = !existingAuthUser || !hasSignedIn;

    // --- Account "fully set up" check ---
    // Only expire once the entire flow is done: contract signed + paid + onboarding complete
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

    // --- Dynamically derive redirect path from current client status ---
    // This ensures the link always sends the client to the correct step, no matter when they click
    let redirectPath = "/dashboard";
    if (isNewUser) {
      redirectPath = "/login?setup=password";
    } else if (profile.contract_status === "not_signed") {
      redirectPath = "/contract";
    } else if (profile.subscription_status === "pending_payment") {
      redirectPath = profile.plan ? `/checkout-summary?plan=${profile.plan}` : "/checkout-summary";
    } else if (profile.contract_status === "signed" && profile.onboarding_status !== "completed") {
      redirectPath = "/onboarding";
    }

    // --- Generate a fresh magic link on-the-fly (never stale) ---
    const linkType: "invite" | "magiclink" = !existingAuthUser ? "invite" : "magiclink";
    let linkData: any = null;

    const firstAttempt = await supabaseAdmin.auth.admin.generateLink({
      type: linkType,
      email: targetEmail,
      options: {
        redirectTo: `https://sienvi.com${redirectPath}`,
      },
    });

    if (!firstAttempt.error && firstAttempt.data) {
      linkData = firstAttempt.data;
    } else {
      // Fallback to opposite link type
      const fallbackType = linkType === "invite" ? "magiclink" : "invite";
      const fallbackAttempt = await supabaseAdmin.auth.admin.generateLink({
        type: fallbackType,
        email: targetEmail,
        options: {
          redirectTo: `https://sienvi.com${redirectPath}`,
        },
      });

      if (!fallbackAttempt.error && fallbackAttempt.data) {
        linkData = fallbackAttempt.data;
      } else {
        console.error("Failed to generate fresh link:", firstAttempt.error, fallbackAttempt.error);
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

    console.log("Resolved join link for:", targetEmail, "→", redirectPath, "(linkType:", linkType, ")");

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
