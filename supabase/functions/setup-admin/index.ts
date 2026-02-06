import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminEmail = "teamsienvi@gmail.com";
    const adminPassword = "Wmmfnsdd1@#$%";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    if (existingAdmin) {
      console.log("Admin user already exists, updating password...");
      
      // Update the password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.error("Error updating password:", updateError);
        throw updateError;
      }
      
      // Ensure admin role exists
      await supabase
        .from("user_roles")
        .upsert({
          user_id: existingAdmin.id,
          role: "admin",
        }, { onConflict: "user_id,role" });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin password updated successfully",
          email: adminEmail 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (userError) {
      console.error("Error creating user:", userError);
      throw userError;
    }

    console.log("Admin user created:", userData.user?.id);

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userData.user!.id,
        email: adminEmail,
        first_name: "Admin",
        last_name: "User",
      });

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userData.user!.id,
        role: "admin",
      });

    if (roleError) {
      console.error("Role error:", roleError);
    }

    console.log("Admin setup complete");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user created successfully",
        email: adminEmail,
        password: adminPassword
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
