import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Plan labels for emails
const planLabels: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Automation",
  full: "Full Automation Suite",
  custom: "Custom Plan",
};

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

async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string | undefined,
  plan: string,
  amountTotal: number
) {
  try {
    const displayName = customerName || customerEmail.split("@")[0];
    const planLabel = planLabels[plan] || plan || "Sienvi Subscription";
    const formattedAmount = amountTotal ? `$${(amountTotal / 100).toLocaleString()}` : "N/A";
    const loginUrl = "https://sienvi-agency-landing-page.lovable.app/login";

    console.log("Sending payment confirmation email to:", customerEmail);

    await resend.emails.send({
      from: "Sienvi <noreply@sienvi.com>",
      to: [customerEmail],
      subject: "🎉 Payment Confirmed - Welcome to Sienvi!",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #667eea;">Sienvi</h1>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">✓</div>
                <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Payment Successful!</h2>
                <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Thank you for your subscription</p>
              </div>
              
              <div style="padding: 32px 40px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; color: #1f2937;">
                  Great news! Your payment has been processed successfully. Welcome to the Sienvi family! 🚀
                </p>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Payment Receipt</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Plan</span></td>
                            <td align="right" style="padding: 8px 0;"><span style="color: #1f2937; font-size: 14px; font-weight: 600;">${planLabel}</span></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Amount</span></td>
                            <td align="right" style="padding: 8px 0;"><span style="color: #10b981; font-size: 18px; font-weight: 700;">${formattedAmount}/month</span></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Status</span></td>
                            <td align="right" style="padding: 8px 0;"><span style="background: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">Active</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <h3 style="margin: 32px 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">What's Next?</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top; width: 40px;"><div style="width: 28px; height: 28px; background: #10b981; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 14px;">✓</div></td>
                    <td style="padding: 8px 0; color: #9ca3af; text-decoration: line-through;">Complete payment</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;"><div style="width: 28px; height: 28px; background: #667eea; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 14px;">2</div></td>
                    <td style="padding: 8px 0; color: #1f2937;">Sign the service agreement</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;"><div style="width: 28px; height: 28px; background: #667eea; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 14px;">3</div></td>
                    <td style="padding: 8px 0; color: #1f2937;">Complete your onboarding questionnaires</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;"><div style="width: 28px; height: 28px; background: #667eea; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 14px;">4</div></td>
                    <td style="padding: 8px 0; color: #1f2937;">We start building your automations!</td>
                  </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 24px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>💡 Tip:</strong> Log in to your dashboard to sign your contract and complete onboarding.
                  </p>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9ca3af;">Questions? Contact us at</p>
              <a href="mailto:teamsienvi@gmail.com" style="color: #667eea; text-decoration: none; font-size: 14px;">teamsienvi@gmail.com</a>
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Sienvi. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Payment confirmation email sent successfully to:", customerEmail);
  } catch (emailError) {
    console.error("Failed to send payment confirmation email:", emailError);
    // Don't throw - we don't want email failure to break the webhook
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed:", session.id);
  
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName = session.customer_details?.name || undefined;
  const metadata = session.metadata || {};
  const amountTotal = session.amount_total || 0;
  
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

  // Send payment confirmation email
  if (customerEmail) {
    await sendPaymentConfirmationEmail(customerEmail, customerName, plan || "subscription", amountTotal);
  }
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
