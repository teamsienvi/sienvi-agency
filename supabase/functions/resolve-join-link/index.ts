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
        .select("id, email, notes")
        .ilike("notes", `%[MagicUrl:${code}:%`)
        .maybeSingle();
      profile = data;
    } else if (clientId) {
      const { data } = await supabaseAdmin
        .from("client_profiles")
        .select("id, email, notes")
        .eq("id", clientId)
        .maybeSingle();
      profile = data;
    }

    if (!profile || !profile.notes) {
      return new Response(
        JSON.stringify({ error: "Link expired or invalid. Please request a new invite link from support." }),
        { status: 444, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the magic link from notes: [MagicUrl:code:URL]
    const match = profile.notes.match(/\[MagicUrl:(?:[^:]+):([^\]]+)\]/);
    if (!match || !match[1]) {
      return new Response(
        JSON.stringify({ error: "No active login link found for this account." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUrl = match[1];

    return new Response(
      JSON.stringify({ targetUrl }),
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
