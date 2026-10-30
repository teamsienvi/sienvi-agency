import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Gate for functions deployed with verify_jwt = false that must not be
 * callable by the public. Allows either:
 *   - server-to-server calls bearing the service role key, or
 *   - a signed-in user with the "admin" role in user_roles.
 * Returns null when the caller is allowed, otherwise a 401/403 Response.
 */
export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const deny = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return deny(401, "No authorization header");

  if (authHeader === `Bearer ${supabaseServiceKey}`) return null;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) return deny(401, "Unauthorized");

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) return deny(403, "Admin access required");

  return null;
}
