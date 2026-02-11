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

// Admin emails to notify
const ADMIN_EMAILS = ["teamsienvi@gmail.com", "sienvifba@gmail.com"];

// Plan labels for emails
const planLabels: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Automation",
  full: "Full Automation Suite",
  custom: "Custom Plan",
  amazon: "Amazon Design Package",
  advertising: "Advertising Package",
};

// Map price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  // Live price IDs
  "price_1SzlcmDnw1azoLSpefO3ANVU": "single",
  "price_1SzlcmDnw1azoLSpfA06Dtiu": "triple",
  "price_1SzlcnDnw1azoLSpQA6jwghB": "full",
  "price_1SzlchDnw1azoLSpQUJfYRrN": "amazon",
  "price_1SzlciDnw1azoLSpMrBXt4xU": "advertising",
  "price_1SzlciDnw1azoLSptoIxpDxu": "advertising",
  "price_1SzlciDnw1azoLSpLxadTvOl": "advertising",
  "price_1SzlciDnw1azoLSpFXm6SG8H": "advertising",
  "price_1SzlcjDnw1azoLSpn6OEzyq6": "advertising",
  "price_1SzlcjDnw1azoLSpa3SQYqLL": "advertising",
  "price_1SzlcjDnw1azoLSp4rdCJZwY": "advertising",
};

// Service labels for display
const serviceLabels: Record<string, string> = {
  "social-media-suite": "Social Media Suite",
  "custom-website": "Custom Website Development",
  "seo-aeo": "SEO/AEO Package",
  "custom-lms": "Custom LMS Package",
  "custom-ai-assistant": "Custom AI Assistant",
  "amazon-design": "Amazon Design Package",
  "advertising-package": "Advertising Package",
  "channel-amazon": "Amazon Ads",
  "channel-google": "Google Ads",
  "channel-meta": "Meta Ads",
  "channel-tiktok": "TikTok Ads",
  "channel-youtube": "YouTube Ads",
  "channel-reddit": "Reddit Ads",
  "channel-linkedin": "LinkedIn Ads",
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

// Send admin notification for important events
async function sendAdminNotification(
  event: string,
  clientEmail: string,
  clientName: string | undefined,
  plan: string | undefined,
  amount: number | undefined,
  selectedServices: string[]
) {
  try {
    const displayName = clientName || clientEmail.split("@")[0];
    
    // Determine plan label with special handling for Amazon and Advertising
    let planLabel = plan ? (planLabels[plan] || plan) : "N/A";
    const channelCount = selectedServices.filter(s => s.startsWith("channel-")).length;
    
    if (plan === "amazon" || selectedServices.includes("amazon-design")) {
      planLabel = "Amazon Design Package";
    } else if (plan === "advertising" || selectedServices.includes("advertising-package")) {
      planLabel = channelCount ? `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})` : "Advertising Package";
    }
    
    const formattedAmount = amount ? `$${(amount / 100).toLocaleString()}` : "N/A";
    
    const eventConfig: Record<string, { subject: string; emoji: string; title: string; color: string }> = {
      payment_completed: {
        subject: "💰 Payment Received",
        emoji: "💰",
        title: "New Payment Received",
        color: "#10b981",
      },
      subscription_canceled: {
        subject: "⚠️ Subscription Canceled",
        emoji: "⚠️",
        title: "Subscription Canceled",
        color: "#ef4444",
      },
    };

    const config = eventConfig[event];
    if (!config) return;

    const timestamp = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Format services and channels for display
    const regularServices = selectedServices.filter(s => !s.startsWith("channel-"));
    const channels = selectedServices.filter(s => s.startsWith("channel-"));
    
    const servicesHtml = regularServices.length > 0
      ? regularServices.map(s => `<li style="padding: 4px 0; color: #374151;">${serviceLabels[s] || s}</li>`).join("")
      : "";
    
    const channelsHtml = channels.length > 0
      ? channels.map(s => serviceLabels[s] || s.replace("channel-", "").charAt(0).toUpperCase() + s.replace("channel-", "").slice(1)).join(", ")
      : null;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background: ${config.color}; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <span style="font-size: 32px;">${config.emoji}</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">${config.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">${timestamp}</p>
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${config.color};">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">Client Information</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Name:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937;">${displayName}</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Email:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><a href="mailto:${clientEmail}" style="color: #667eea; text-decoration: none;">${clientEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Plan:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937; font-weight: 600;">${planLabel}</span></td>
                  </tr>
                  ${amount ? `
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: ${config.color}; font-weight: 700;">${formattedAmount}/mo</span></td>
                  </tr>
                  ` : ""}
                  \${channelsHtml ? \`
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Channels:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937;">\${channelsHtml}</span></td>
                  </tr>
                  \` : ""}
                </table>
              </div>
              \${regularServices && regularServices.length > 0 ? \`
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Selected Services</h4>
                <ul style="margin: 0; padding: 0 0 0 20px; list-style: disc;">\${servicesHtml}</ul>
              </div>
              \` : ""}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="https://sienvi-agency-landing-page.lovable.app/admin/clients" style="display: inline-block; background: ${config.color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in Admin Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated notification from Sienvi Admin System</p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #d1d5db;">© 2015 Sienvi. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log(`Sending admin notification for event: ${event}, client: ${clientEmail}`);

    const emailPromises = ADMIN_EMAILS.map(adminEmail => 
      resend.emails.send({
        from: "Sienvi Admin <noreply@sienvi.com>",
        to: [adminEmail],
        subject: `${config.subject} - ${displayName}`,
        html: emailHtml,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === "fulfilled").length;
    console.log(`Admin notifications sent: ${successCount}/${ADMIN_EMAILS.length}`);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
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
  amountTotal: number,
  selectedServices?: string[],
  channelCount?: number
) {
  try {
    const displayName = customerName || customerEmail.split("@")[0];
    
    // Determine plan label with special handling for Amazon and Advertising
    let planLabel = planLabels[plan] || plan || "Sienvi Subscription";
    if (plan === "amazon" || selectedServices?.includes("amazon-design")) {
      planLabel = "Amazon Design Package";
    } else if (plan === "advertising" || selectedServices?.includes("advertising-package")) {
      planLabel = channelCount ? `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})` : "Advertising Package";
    }
    
    const formattedAmount = amountTotal ? `$${(amountTotal / 100).toLocaleString()}` : "N/A";
    const loginUrl = "https://sienvi-agency-landing-page.lovable.app/login";

    // Build channels list for advertising
    const channelsHtml = selectedServices && selectedServices.length > 0
      ? selectedServices
          .filter(s => s.startsWith("channel-"))
          .map(s => serviceLabels[s] || s.replace("channel-", "").charAt(0).toUpperCase() + s.replace("channel-", "").slice(1))
          .join(", ")
      : null;

    console.log("Sending payment confirmation email to:", customerEmail, "Plan:", planLabel);

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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 24px; border-radius: 8px;">
                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">SIENVI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Success Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                <div style="width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 36px; line-height: 72px;">✓</span>
                </div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Payment Successful!</h1>
                <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Welcome to the Sienvi family</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 48px;">
                <p style="margin: 0 0 24px 0; font-size: 17px; color: #374151;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 28px 0; font-size: 17px; color: #374151;">
                  Great news! Your payment has been processed successfully. We're thrilled to have you on board! 🚀
                </p>
                
                <!-- Receipt Card -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; margin: 28px 0; border-left: 4px solid #10b981;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 16px;">
                        <span style="font-size: 13px; color: #059669; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Payment Receipt</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 10px 0;"><span style="color: #6b7280; font-size: 15px;">Plan</span></td>
                            <td align="right" style="padding: 10px 0;"><span style="color: #1f2937; font-size: 15px; font-weight: 600;">\${planLabel}</span></td>
                          </tr>
                          \${channelsHtml ? \`
                          <tr>
                            <td style="padding: 10px 0;"><span style="color: #6b7280; font-size: 15px;">Channels</span></td>
                            <td align="right" style="padding: 10px 0;"><span style="color: #1f2937; font-size: 14px; font-weight: 500;">\${channelsHtml}</span></td>
                          </tr>
                          \` : ""}
                          <tr>
                            <td style="padding: 10px 0;"><span style="color: #6b7280; font-size: 15px;">Amount</span></td>
                            <td align="right" style="padding: 10px 0;"><span style="color: #10b981; font-size: 20px; font-weight: 700;">\${formattedAmount}/mo</span></td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;"><span style="color: #6b7280; font-size: 15px;">Status</span></td>
                            <td align="right" style="padding: 10px 0;"><span style="background: #10b981; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">Active</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Next Steps -->
                <h3 style="margin: 36px 0 20px 0; font-size: 18px; font-weight: 700; color: #1f2937;">What's Next?</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 40px;">
                      <div style="width: 28px; height: 28px; background: #10b981; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 14px;">✓</div>
                    </td>
                    <td style="padding: 10px 0; color: #9ca3af; font-size: 15px; text-decoration: line-through;">Complete payment</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 13px; font-weight: 600;">2</div>
                    </td>
                    <td style="padding: 10px 0; color: #374151; font-size: 15px;">Sign the service agreement</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 13px; font-weight: 600;">3</div>
                    </td>
                    <td style="padding: 10px 0; color: #374151; font-size: 15px;">Complete onboarding questionnaires</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 13px; font-weight: 600;">4</div>
                    </td>
                    <td style="padding: 10px 0; color: #374151; font-size: 15px;">We start building your automations!</td>
                  </tr>
                </table>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 28px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 56px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- Tip -->
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>💡 Tip:</strong> Log in to your dashboard to sign your contract and complete onboarding so we can start building!
                  </p>
                </div>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #9ca3af;">
                Questions? Contact us at
              </p>
              <a href="mailto:teamsienvi@gmail.com" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500;">teamsienvi@gmail.com</a>
              <p style="margin: 32px 0 0 0; font-size: 13px; color: #d1d5db;">
                © 2015 Sienvi. All rights reserved.
              </p>
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

  // Send payment confirmation email with full details
  if (customerEmail) {
    // Calculate channel count for advertising plans
    const channelCount = selectedServices.filter(s => s.startsWith("channel-")).length;
    
    await sendPaymentConfirmationEmail(
      customerEmail, 
      customerName, 
      plan || "subscription", 
      amountTotal,
      selectedServices,
      channelCount > 0 ? channelCount : undefined
    );
    
    // Send admin notification
    await sendAdminNotification("payment_completed", customerEmail, customerName, plan || undefined, amountTotal, selectedServices);
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
