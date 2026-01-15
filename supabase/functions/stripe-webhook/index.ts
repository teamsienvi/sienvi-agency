import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Map price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1SpD4wKEtylNfLjGh9kGQO3z": "single",
  "price_1SpD4wKEtylNfLjGfBzytYeS": "triple",
  "price_1SpD4wKEtylNfLjGGsGBcNq1": "full",
};

// Log webhook event to database
async function logWebhookEvent(
  eventType: string,
  eventId: string,
  customerEmail: string | null,
  status: "success" | "error",
  errorMessage?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from("webhook_logs").insert({
      event_type: eventType,
      event_id: eventId,
      customer_email: customerEmail,
      status,
      error_message: errorMessage || null,
      metadata: metadata || null,
    });
    console.log(`Logged webhook event: ${eventType} (${status})`);
  } catch (e) {
    console.error("Failed to log webhook event:", e);
  }
}

// Helper to get next billing date from Stripe subscription
async function getNextBillingDate(subscriptionId: string): Promise<string | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.current_period_end) {
      return new Date(subscription.current_period_end * 1000).toISOString();
    }
  } catch (e) {
    console.error("Error fetching subscription details:", e);
  }
  return null;
}

// Helper to upsert client_profiles by email
async function updateClientProfile(
  email: string | null,
  updates: {
    subscription_status?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    account_status?: string;
  },
  options?: {
    // Used when creating a brand-new client profile from Stripe checkout
    plan?: string | null;
    selected_services?: string[];
    max_services?: number | null;
    custom_price?: number | null;
    notes?: string | null;
    contract_status?: string;
    onboarding_status?: string;
  }
) {
  if (!email) {
    console.log("No email provided, skipping client_profiles upsert");
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const nowIso = new Date().toISOString();

  // If the row exists → update it.
  // If it doesn't exist → insert a new row with safe defaults.
  const { data: existing, error: existingError } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking existing client_profiles:", existingError);
    // Continue and attempt insert/update anyway.
  }

  if (existing?.id) {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: nowIso,
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("client_profiles")
      .update(updateData)
      .eq("id", existing.id)
      .select("id");

    if (updateError) {
      console.error("Error updating client_profiles:", updateError);
    } else {
      console.log(
        `Updated client_profiles (${updatedRows?.length || 0} row(s)) for:`,
        normalizedEmail,
        updates
      );
    }

    return;
  }

  // Insert new client profile (this is what was missing previously)
  const insertData: Record<string, unknown> = {
    email: normalizedEmail,
    first_name: null,
    last_name: null,
    role: "client",

    // Status defaults
    subscription_status: updates.subscription_status ?? "pending_payment",
    account_status: updates.account_status ?? "pending",
    contract_status: options?.contract_status ?? "not_signed",
    onboarding_status: options?.onboarding_status ?? "not_started",
    onboarding_completed_at: null,
    contract_signed_at: null,

    // Commercial fields
    plan: options?.plan ?? null,
    max_services: options?.max_services ?? null,
    custom_price: options?.custom_price ?? null,
    notes: options?.notes ?? null,
    selected_services: options?.selected_services ?? [],

    // Stripe linkage
    stripe_customer_id: updates.stripe_customer_id ?? null,
    stripe_subscription_id: updates.stripe_subscription_id ?? null,

    created_at: nowIso,
    updated_at: nowIso,
  };

  const { error: insertError } = await supabase
    .from("client_profiles")
    .insert(insertData);

  if (insertError) {
    console.error("Error inserting client_profiles:", insertError, { email: normalizedEmail });
  } else {
    console.log("Inserted client_profiles for:", normalizedEmail, {
      ...updates,
      ...options,
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed:", session.id);
  
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const metadata = session.metadata || {};
  
  // Get plan from metadata or determine from line items
  let plan = metadata.plan;
  
  if (!plan && session.line_items?.data?.[0]?.price?.id) {
    plan = PRICE_TO_PLAN[session.line_items.data[0].price.id];
  }
  
  // Parse selected services from metadata
  let selectedServices: string[] = [];
  if (metadata.selected_services) {
    try {
      selectedServices = JSON.parse(metadata.selected_services);
    } catch (e) {
      console.error("Error parsing selected_services:", e);
    }
  }
  
  // For custom plans, extract additional metadata
  const isCustomPlan = plan === "custom";
  const maxServices = isCustomPlan ? parseInt(metadata.max_services || "6") : null;
  const customPrice = isCustomPlan ? parseFloat(metadata.custom_price || "0") : null;
  const notes = isCustomPlan ? (metadata.notes || "") : null;

  const maxServicesForProfile = isCustomPlan
    ? maxServices
    : plan === "single"
      ? 1
      : plan === "triple"
        ? 3
        : plan === "full"
          ? 6
          : null;
  
  console.log("Customer:", customerId, "Subscription:", subscriptionId, "Plan:", plan, "Email:", customerEmail);
  console.log("Selected Services:", selectedServices);
  if (isCustomPlan) {
    console.log("Custom plan details - Max Services:", maxServices, "Price:", customPrice, "Notes:", notes);
  }
  
  // Build the metadata object to store
  const storedMetadata = {
    ...metadata,
    ...(isCustomPlan && {
      max_services: maxServices,
      custom_price: customPrice,
      notes: notes,
    }),
  };
  
  // Check if subscription already exists
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, plan")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  
  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("subscriptions")
      .update({
        subscription_status: "active",
        is_active: true,
        plan: plan || existing.plan,
        selected_services: selectedServices.length > 0 ? selectedServices : null,
        onboarding_completed: selectedServices.length > 0,
        metadata: storedMetadata,
      })
      .eq("stripe_subscription_id", subscriptionId);
    
    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
    console.log("Updated existing subscription:", subscriptionId);
  } else {
    // Insert new record
    const { error } = await supabase
      .from("subscriptions")
      .insert({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        email: customerEmail,
        plan: plan,
        subscription_status: "active",
        is_active: true,
        selected_services: selectedServices.length > 0 ? selectedServices : null,
        onboarding_completed: selectedServices.length > 0,
        metadata: storedMetadata,
      });
    
    if (error) {
      console.error("Error inserting subscription:", error);
      throw error;
    }
    console.log("Created new subscription:", subscriptionId);
  }
  
  // Sync to client_profiles (source of truth for the admin dashboard)
  await updateClientProfile(
    customerEmail,
    {
      subscription_status: "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      account_status: "active",
    },
    {
      plan: plan || null,
      selected_services: selectedServices,
      max_services: maxServicesForProfile,
      custom_price: customPrice,
      notes: notes,
      contract_status: "not_signed",
      onboarding_status: selectedServices.length > 0 ? "in_progress" : "not_started",
    }
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_succeeded:", invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  const customerEmail = invoice.customer_email;
  
  if (!subscriptionId) {
    console.log("No subscription ID in invoice, skipping");
    return;
  }
  
  // Get next billing date
  const nextBillingDate = await getNextBillingDate(subscriptionId);
  
  const { error } = await supabase
    .from("subscriptions")
    .update({
      subscription_status: "active",
      is_active: true,
      next_billing_date: nextBillingDate,
    })
    .eq("stripe_subscription_id", subscriptionId);
  
  if (error) {
    console.error("Error updating subscription on payment success:", error);
    // Don't throw - subscription might not exist yet (will be created by checkout.session.completed)
  } else {
    console.log("Subscription marked active:", subscriptionId);
  }
  
  // Sync to client_profiles
  await updateClientProfile(customerEmail, {
    subscription_status: "active",
    account_status: "active",
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed:", invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  const customerEmail = invoice.customer_email;
  
  if (!subscriptionId) {
    console.log("No subscription ID in invoice, skipping");
    return;
  }
  
  const { error } = await supabase
    .from("subscriptions")
    .update({
      subscription_status: "past_due",
    })
    .eq("stripe_subscription_id", subscriptionId);
  
  if (error) {
    console.error("Error updating subscription on payment failure:", error);
  } else {
    console.log("Subscription marked past_due:", subscriptionId);
  }
  
  // Sync to client_profiles
  await updateClientProfile(customerEmail, {
    subscription_status: "past_due",
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing customer.subscription.deleted:", subscription.id);
  
  // Get customer email from Stripe
  let customerEmail: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer && !customer.deleted && 'email' in customer) {
      customerEmail = customer.email;
    }
  } catch (e) {
    console.error("Error fetching customer:", e);
  }
  
  const { error } = await supabase
    .from("subscriptions")
    .update({
      subscription_status: "canceled",
      is_active: false,
    })
    .eq("stripe_subscription_id", subscription.id);
  
  if (error) {
    console.error("Error updating subscription on deletion:", error);
  } else {
    console.log("Subscription canceled:", subscription.id);
  }
  
  // Sync to client_profiles
  await updateClientProfile(customerEmail, {
    subscription_status: "canceled",
    account_status: "suspended",
  });
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    console.error("Missing stripe-signature header");
    await logWebhookEvent("unknown", "no-signature", null, "error", "Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    await logWebhookEvent("unknown", "no-secret", null, "error", "STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }
  
  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
    
    console.log("Received Stripe event:", event.type, event.id);
    
    // Extract customer email for logging
    let customerEmail: string | null = null;
    const eventData = event.data.object as Record<string, unknown>;
    if (eventData.customer_email) {
      customerEmail = eventData.customer_email as string;
    } else if (eventData.customer_details && (eventData.customer_details as Record<string, unknown>).email) {
      customerEmail = (eventData.customer_details as Record<string, unknown>).email as string;
    }
    
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log("Unhandled event type:", event.type);
      }
      
      // Log successful processing
      await logWebhookEvent(event.type, event.id, customerEmail, "success", undefined, { 
        customer_id: eventData.customer,
      });
    } catch (handlerError: unknown) {
      const errorMessage = handlerError instanceof Error ? handlerError.message : "Unknown error";
      console.error("Handler error:", errorMessage);
      await logWebhookEvent(event.type, event.id, customerEmail, "error", errorMessage);
      throw handlerError;
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});
