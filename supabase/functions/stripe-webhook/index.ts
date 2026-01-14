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
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_succeeded:", invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    console.log("No subscription ID in invoice, skipping");
    return;
  }
  
  const { error } = await supabase
    .from("subscriptions")
    .update({
      subscription_status: "active",
      is_active: true,
    })
    .eq("stripe_subscription_id", subscriptionId);
  
  if (error) {
    console.error("Error updating subscription on payment success:", error);
    // Don't throw - subscription might not exist yet (will be created by checkout.session.completed)
  } else {
    console.log("Subscription marked active:", subscriptionId);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed:", invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  
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
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing customer.subscription.deleted:", subscription.id);
  
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
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
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
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
