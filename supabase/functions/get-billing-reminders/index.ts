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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client to check admin status
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse query params
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "true";

    // Fetch reminders with subscription details
    let query = supabaseAdmin
      .from("billing_reminders")
      .select(`
        *,
        subscriptions (
          id,
          email,
          metadata,
          plan,
          next_billing_date,
          is_manual,
          payment_method
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: reminders, error: remindersError } = await query;

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      throw remindersError;
    }

    // Format reminders
    const formattedReminders = (reminders || []).map((reminder: any) => ({
      id: reminder.id,
      subscriptionId: reminder.subscription_id,
      reminderType: reminder.reminder_type,
      reminderDate: reminder.reminder_date,
      daysUntilDue: reminder.days_until_due,
      isRead: reminder.is_read,
      createdAt: reminder.created_at,
      client: reminder.subscriptions ? {
        id: reminder.subscriptions.id,
        email: reminder.subscriptions.email,
        clientName: reminder.subscriptions.metadata?.client_name || reminder.subscriptions.metadata?.clientName || null,
        plan: reminder.subscriptions.plan,
        nextBillingDate: reminder.subscriptions.next_billing_date,
        isManual: reminder.subscriptions.is_manual,
        paymentMethod: reminder.subscriptions.payment_method,
      } : null,
    }));

    return new Response(
      JSON.stringify({ reminders: formattedReminders }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-billing-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
