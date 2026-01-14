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
      paymentMethod,
      subscriptionStatus,
      isActive,
      notes,
    } = body;

    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Build metadata object
    const metadataUpdates: Record<string, unknown> = {};

    if (clientName !== undefined) {
      metadataUpdates.client_name = clientName;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (plan !== undefined) {
      updateData.plan = plan;
    }

    if (plan === "custom" && monthlyAmount !== undefined) {
      metadataUpdates.custom_price = monthlyAmount;
    }

    if (maxServices !== undefined) {
      metadataUpdates.max_services = maxServices;
    }

    if (selectedServices !== undefined) {
      updateData.selected_services = selectedServices;
    }

    if (paymentMethod !== undefined) {
      updateData.payment_method = paymentMethod;
      // If switching to stripe, mark as not manual
      if (paymentMethod === "stripe") {
        updateData.is_manual = false;
      } else {
        updateData.is_manual = true;
      }
    }

    if (subscriptionStatus !== undefined) {
      updateData.subscription_status = subscriptionStatus;
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    if (notes !== undefined) {
      metadataUpdates.notes = notes;
    }

    // Fetch current metadata to merge
    const { data: currentClient, error: fetchError } = await supabase
      .from("subscriptions")
      .select("metadata")
      .eq("id", clientId)
      .single();

    if (fetchError) {
      throw new Error(`Client not found: ${fetchError.message}`);
    }

    // Merge metadata
    const currentMetadata = (currentClient?.metadata as Record<string, unknown>) || {};
    updateData.metadata = {
      ...currentMetadata,
      ...metadataUpdates,
    };

    // Update the client
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", clientId);

    if (updateError) {
      throw new Error(`Failed to update client: ${updateError.message}`);
    }

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
