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

    console.log("Starting billing reminder check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Calculate 7 days from now
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    // Find manual clients with billing reminders enabled that:
    // 1. Have next_billing_date within next 7 days (due soon)
    // 2. Have next_billing_date in the past (overdue)
    const { data: clients, error: clientsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("is_manual", true)
      .eq("billing_reminder_enabled", true)
      .eq("is_active", true)
      .not("next_billing_date", "is", null);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      throw clientsError;
    }

    console.log(`Found ${clients?.length || 0} manual clients with billing dates set`);

    const remindersToCreate: Array<{
      subscription_id: string;
      reminder_type: string;
      reminder_date: string;
      days_until_due: number;
    }> = [];

    for (const client of clients || []) {
      const nextBillingDate = new Date(client.next_billing_date);
      nextBillingDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if a reminder for this date already exists today
      const { data: existingReminder } = await supabase
        .from("billing_reminders")
        .select("id")
        .eq("subscription_id", client.id)
        .eq("reminder_date", todayStr)
        .single();

      if (existingReminder) {
        console.log(`Reminder already exists for client ${client.id} today`);
        continue;
      }

      if (daysUntilDue < 0) {
        // Overdue
        console.log(`Client ${client.email} is overdue by ${Math.abs(daysUntilDue)} days`);
        remindersToCreate.push({
          subscription_id: client.id,
          reminder_type: "overdue",
          reminder_date: todayStr,
          days_until_due: daysUntilDue,
        });
      } else if (daysUntilDue <= 7) {
        // Due soon
        console.log(`Client ${client.email} is due in ${daysUntilDue} days`);
        remindersToCreate.push({
          subscription_id: client.id,
          reminder_type: "due_soon",
          reminder_date: todayStr,
          days_until_due: daysUntilDue,
        });
      }
    }

    // Insert reminders
    if (remindersToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from("billing_reminders")
        .insert(remindersToCreate);

      if (insertError) {
        console.error("Error inserting reminders:", insertError);
        throw insertError;
      }

      console.log(`Created ${remindersToCreate.length} billing reminders`);
    } else {
      console.log("No new reminders to create");
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersCreated: remindersToCreate.length,
        checkedClients: clients?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in check-billing-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
