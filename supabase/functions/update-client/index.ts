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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid token");
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Admin access required");
    }

    const body = await req.json();
    const {
      clientId,
      clientName,
      email,
      plan,
      monthlyAmount,
      maxServices,
      selectedServices,
      subscriptionStatus,
      isActive,
      notes,
      stripeCustomerId,
      stripeSubscriptionId,
      contractDetails,
      contractStatus,
      subscriptions: incomingSubscriptions,
    } = body;

    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Parse client name into first/last
    const nameParts = (clientName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // Build update for client_profiles (source of truth)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email;
    if (plan !== undefined) updateData.plan = plan;
    if (selectedServices !== undefined) updateData.selected_services = selectedServices;
    if (subscriptionStatus !== undefined) updateData.subscription_status = subscriptionStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (maxServices !== undefined) updateData.max_services = maxServices;

    if (isActive !== undefined) {
      updateData.account_status = isActive ? "active" : "inactive";
    }

    if (plan === "custom" && monthlyAmount !== undefined) {
      updateData.custom_price = monthlyAmount;
    }

    if (stripeCustomerId !== undefined) updateData.stripe_customer_id = stripeCustomerId;
    if (stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = stripeSubscriptionId;
    if (contractDetails !== undefined) updateData.contract_details = contractDetails;
    if (contractStatus !== undefined) updateData.contract_status = contractStatus;

    // Update client_profiles
    const { error: updateError } = await supabase
      .from("client_profiles")
      .update(updateData)
      .eq("id", clientId);

    if (updateError) {
      throw new Error(`Failed to update client: ${updateError.message}`);
    }

    // Handle multi-subscriptions if provided
    if (Array.isArray(incomingSubscriptions)) {
      // Get existing subscriptions for this client
      const { data: existingSubs } = await supabase
        .from("client_subscriptions")
        .select("id")
        .eq("client_profile_id", clientId);

      const existingIds = new Set((existingSubs || []).map((s: any) => s.id));
      const incomingIds = new Set(
        incomingSubscriptions.filter((s: any) => s.id).map((s: any) => s.id)
      );

      // Delete subscriptions that were removed
      for (const existingId of existingIds) {
        if (!incomingIds.has(existingId)) {
          await supabase
            .from("client_subscriptions")
            .delete()
            .eq("id", existingId);
          console.log(`Deleted subscription ${existingId} for client ${clientId}`);
        }
      }

      // Upsert each subscription
      for (const sub of incomingSubscriptions) {
        const subData = {
          client_profile_id: clientId,
          label: sub.label || "Unnamed Subscription",
          plan: sub.plan || null,
          selected_services: sub.selectedServices || [],
          monthly_amount: sub.monthlyAmount || 0,
          billing_day: sub.billingDay || null,
          next_billing_date: sub.nextBillingDate || null,
          subscription_status: sub.subscriptionStatus || "active",
          stripe_subscription_id: sub.stripeSubscriptionId || null,
          stripe_customer_id: sub.stripeCustomerId || null,
          is_primary: sub.isPrimary || false,
          notes: sub.notes || null,
          contract_status: sub.contractStatus || "not_signed",
          contract_signed_at: sub.contractSignedAt || null,
          contract_signature: sub.contractSignature || null,
          contract_details: sub.contractDetails || null,
          updated_at: new Date().toISOString(),
        };

        if (sub.id && existingIds.has(sub.id)) {
          // Update existing
          await supabase
            .from("client_subscriptions")
            .update(subData)
            .eq("id", sub.id);
        } else {
          // Insert new
          await supabase
            .from("client_subscriptions")
            .insert(subData);
        }
      }

      console.log(`Synced ${incomingSubscriptions.length} subscriptions for client ${clientId}`);
    }

    console.log(`Client ${clientId} updated successfully:`, { plan, selectedServices, subscriptionStatus });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error updating client:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
