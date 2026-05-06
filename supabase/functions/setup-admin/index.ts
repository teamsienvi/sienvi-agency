import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    let body: { email?: string; password?: string } = {};
    try { body = await req.json(); } catch {}

    const adminEmail = body.email || "teamsienvi@gmail.com";
    const adminPassword = body.password || "Wmmfnsdd1@#$%";

    // Find or create user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let adminUser = existingUsers?.users?.find(u => u.email === adminEmail);

    if (!adminUser) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });
      if (error) throw error;
      adminUser = created.user!;
      console.log("Created user:", adminUser.id);
    } else {
      // Update password
      await supabase.auth.admin.updateUserById(adminUser.id, { password: adminPassword });
      console.log("User exists:", adminUser.id);
    }

    const userId = adminUser.id;

    // Check if role already exists
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (existing) {
      console.log("Role already exists");
      return new Response(
        JSON.stringify({ success: true, message: "Admin role already set", user_id: userId, email: adminEmail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" })
      .select();

    if (roleError) {
      console.error("Role insert error:", JSON.stringify(roleError));
      return new Response(
        JSON.stringify({ success: false, error: roleError.message, details: roleError, user_id: userId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Role inserted:", JSON.stringify(roleData));
    return new Response(
      JSON.stringify({ success: true, message: "Admin role set", user_id: userId, email: adminEmail, role_row: roleData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
