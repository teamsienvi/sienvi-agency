import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendEmail } from "../_shared/ses-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const serviceLabels: Record<string, string> = {
  "social-media-suite": "Social Media Suite",
  "custom-website": "Custom Website Development",
  "seo-aeo": "SEO/AEO Package",
  "custom-lms": "Custom LMS Package",
  "custom-ai-assistant": "Custom AI Assistant",
  "custom-gpt": "Custom GPT Integration",
  "custom-data-dashboard": "Custom Data Dashboard",
  "ecommerce-operations": "E-Commerce Operations",
  "custom-tool": "Custom Tool Development",
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

function parseAdditionalEmails(notes: string | null | undefined): string[] {
  if (!notes) return [];
  const match = notes.match(/\[Additional\s+Emails:\s*([^\]]+)\]/i);
  if (match && match[1]) {
    return match[1]
      .split(/[,;]/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
  }
  return [];
}

interface ClientSubWithProfile {
  id: string;
  client_profile_id: string;
  label: string;
  plan: string;
  selected_services: string[];
  monthly_amount: number;
  billing_day: number | null;
  next_billing_date: string | null;
  subscription_status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  client_profile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    account_status: string;
    subscription_status: string;
    notes: string | null;
    contract_details: any | null;
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function buildInvoiceEmailHtml(params: {
  reminderType: "upcoming_3_days" | "due_today" | "overdue_15_days";
  displayName: string;
  subscriptionLabel: string;
  amount: number;
  dueDateStr: string;
  services: string[];
  stripeSubscriptionId?: string | null;
}): { subject: string; html: string } {
  const { reminderType, displayName, subscriptionLabel, amount, dueDateStr, services, stripeSubscriptionId } = params;

  const formattedAmount = `$${amount.toLocaleString()}`;
  const portalUrl = "https://sienvi.com/dashboard";

  const servicesHtml = services.length > 0
    ? services.map(s => `<li style="padding: 4px 0; color: #374151;">${serviceLabels[s] || s}</li>`).join("")
    : `<li style="padding: 4px 0; color: #374151;">${subscriptionLabel}</li>`;

  if (reminderType === "upcoming_3_days") {
    return {
      subject: `🗓️ Upcoming Invoice Preview - ${subscriptionLabel} (${formattedAmount})`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: #3b82f6; padding: 28px; text-align: center; color: #ffffff;">
              <span style="font-size: 36px;">🗓️</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Upcoming Subscription Invoice</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Scheduled for processing in 3 days</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">Hi <strong>${displayName}</strong>,</p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
                This is a friendly reminder that your upcoming monthly subscription invoice for <strong>${subscriptionLabel}</strong> is scheduled to be automatically processed in <strong>3 days</strong> on <strong>${dueDateStr}</strong>.
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Subscription:</td>
                    <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${subscriptionLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Scheduled Date:</td>
                    <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${dueDateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Amount Due:</td>
                    <td style="padding: 6px 0; text-align: right; color: #3b82f6; font-weight: 700; font-size: 18px;">${formattedAmount}/mo</td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Included Services</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  ${servicesHtml}
                </ul>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 13px; color: #1e40af;">
                  <strong>💡 Auto-Pay:</strong> No action is required if your payment method is active. You can manage your account and invoices anytime in the dashboard.
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">View Client Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">Questions? Contact us anytime at info@sienvi.com</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">© 2015 Sienvi. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };
  }

  if (reminderType === "due_today") {
    return {
      subject: `💳 Invoice Due Today - ${subscriptionLabel} (${formattedAmount})`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: #6366f1; padding: 28px; text-align: center; color: #ffffff;">
              <span style="font-size: 36px;">💳</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Invoice Due Today</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Monthly Subscription Processing</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">Hi <strong>${displayName}</strong>,</p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
                Your monthly subscription invoice for <strong>${subscriptionLabel}</strong> is due today, <strong>${dueDateStr}</strong>, and will be processed via your payment method on file.
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Subscription:</td>
                    <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${subscriptionLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Billing Date:</td>
                    <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">Today (${dueDateStr})</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Amount Due:</td>
                    <td style="padding: 6px 0; text-align: right; color: #6366f1; font-weight: 700; font-size: 18px;">${formattedAmount}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom: 28px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Services in Plan</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  ${servicesHtml}
                </ul>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">Access Account Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">Thank you for partnering with Sienvi!</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">© 2015 Sienvi. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };
  }

  // Overdue (15 Days Past Due)
  return {
    subject: `🚨 Action Required: Invoice 15 Days Overdue - ${subscriptionLabel} (${formattedAmount})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: #dc2626; padding: 28px; text-align: center; color: #ffffff;">
              <span style="font-size: 36px;">🚨</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Payment Overdue - Action Required</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">15 Days Past Due</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">Hi <strong>${displayName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563;">
                We are reaching out because your monthly subscription payment for <strong>${subscriptionLabel}</strong> from <strong>${dueDateStr}</strong> is now <strong>15 days overdue</strong>.
              </p>

              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #dc2626;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #991b1b; font-size: 14px;">Subscription:</td>
                    <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${subscriptionLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #991b1b; font-size: 14px;">Original Due Date:</td>
                    <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${dueDateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #991b1b; font-size: 14px;">Overdue Amount:</td>
                    <td style="padding: 6px 0; text-align: right; color: #dc2626; font-weight: 700; font-size: 18px;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #991b1b; font-size: 14px;">Status:</td>
                    <td style="padding: 6px 0; text-align: right;"><span style="background: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">Past Due</span></td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563;">
                To ensure uninterrupted service delivery for your active automations, please update your payment method or complete payment as soon as possible.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${portalUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">Update Payment Method in Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">If you have already arranged payment, please disregard this notice or contact info@sienvi.com</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">© 2015 Sienvi. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    console.log(`[Invoice Reminders] Running check on ${formatDate(now)}`);

    // Fetch all client subscriptions along with profile data
    const { data: clientSubs, error: subsError } = await supabase
      .from("client_subscriptions")
      .select(`
        id,
        client_profile_id,
        label,
        plan,
        selected_services,
        monthly_amount,
        billing_day,
        next_billing_date,
        subscription_status,
        stripe_subscription_id,
        stripe_customer_id,
        client_profile:client_profiles(
          id,
          email,
          first_name,
          last_name,
          account_status,
          subscription_status,
          notes,
          contract_details
        )
      `);

    if (subsError) {
      throw new Error(`Error fetching client subscriptions: ${subsError.message}`);
    }

    // Fetch existing sent reminders to avoid duplicate sends
    const { data: sentReminders } = await supabase
      .from("invoice_reminders")
      .select("client_profile_id, reminder_type, due_date");

    const sentMap = new Set<string>();
    for (const r of sentReminders || []) {
      sentMap.add(`${r.client_profile_id}:${r.reminder_type}:${r.due_date}`);
    }

    const results: Array<{
      client: string;
      subscription: string;
      type: string;
      dueDate: string;
      status: string;
      messageId?: string;
    }> = [];

    for (const sub of (clientSubs as unknown as ClientSubWithProfile[])) {
      const profile = sub.client_profile;
      if (!profile || !profile.email) continue;

      const monthlyAmount = sub.monthly_amount || 0;
      if (monthlyAmount <= 0) continue;

      // Determine the billing day of month (e.g. 15, 24, 28, 10, etc.)
      let billingDay = sub.billing_day;
      if (!billingDay && sub.next_billing_date) {
        const d = new Date(sub.next_billing_date);
        if (!isNaN(d.getTime())) billingDay = d.getDate();
      }
      if (!billingDay) billingDay = 1; // default to 1st if unspecified

      // 1. Calculate the upcoming due date for this current month or next
      let targetDueDate = new Date(currentYear, currentMonth, billingDay);
      // If billingDay has already passed this month, the upcoming billing date is next month
      if (targetDueDate.getTime() < now.setHours(0,0,0,0)) {
        targetDueDate = new Date(currentYear, currentMonth + 1, billingDay);
      }

      // Calculate days until upcoming due date
      const msPerDay = 1000 * 60 * 60 * 24;
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntilDue = Math.round((targetDueDate.getTime() - todayDateOnly.getTime()) / msPerDay);

      // 2. Also calculate the past due date (for checking overdue 15 days)
      const pastDueDate = new Date(currentYear, currentMonth, billingDay);
      // If billingDay is in the future this month, the previous billing cycle was last month
      if (pastDueDate.getTime() > todayDateOnly.getTime()) {
        pastDueDate.setMonth(pastDueDate.getMonth() - 1);
      }
      const daysPastDue = Math.round((todayDateOnly.getTime() - pastDueDate.getTime()) / msPerDay);

      const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        profile.contract_details?.clientLegalName ||
        profile.email.split("@")[0];

      const primaryEmail = profile.email.toLowerCase().trim();
      const additionalEmails = parseAdditionalEmails(profile.notes);
      const recipients = [...new Set([primaryEmail, ...additionalEmails])];

      // === REMINDER CHECK 1: 3 Days Prior ===
      if (daysUntilDue === 3) {
        const dueDateIso = targetDueDate.toISOString().split("T")[0];
        const dedupeKey = `${profile.id}:upcoming_3_days:${dueDateIso}`;

        // TEST STATUS FIRST: must be active
        if (sub.subscription_status === "active" && !sentMap.has(dedupeKey)) {
          console.log(`[Reminder: 3 Days Prior] Triggering for ${profile.email} - ${sub.label}`);

          const { subject, html } = buildInvoiceEmailHtml({
            reminderType: "upcoming_3_days",
            displayName,
            subscriptionLabel: sub.label,
            amount: monthlyAmount,
            dueDateStr: formatDate(targetDueDate),
            services: sub.selected_services || [],
            stripeSubscriptionId: sub.stripe_subscription_id,
          });

          const sendRes = await sendEmail({
            from: "Sienvi Billing <info@sienvi.com>",
            to: recipients,
            bcc: ["teamsienvi@gmail.com", "info@sienvi.com"],
            subject,
            html,
          });

          if (!sendRes.error) {
            await supabase.from("invoice_reminders").insert({
              client_profile_id: profile.id,
              client_subscription_id: sub.id,
              stripe_subscription_id: sub.stripe_subscription_id,
              reminder_type: "upcoming_3_days",
              due_date: dueDateIso,
              amount: monthlyAmount,
              recipient_email: primaryEmail,
              status: "sent",
            });
            sentMap.add(dedupeKey);
            results.push({
              client: profile.email,
              subscription: sub.label,
              type: "upcoming_3_days",
              dueDate: dueDateIso,
              status: "sent",
              messageId: sendRes.data?.id,
            });
          }
        }
      }

      // === REMINDER CHECK 2: On The Day ===
      if (daysUntilDue === 0) {
        const dueDateIso = targetDueDate.toISOString().split("T")[0];
        const dedupeKey = `${profile.id}:due_today:${dueDateIso}`;

        // TEST STATUS FIRST: must be active
        if (sub.subscription_status === "active" && !sentMap.has(dedupeKey)) {
          console.log(`[Reminder: Due Today] Triggering for ${profile.email} - ${sub.label}`);

          const { subject, html } = buildInvoiceEmailHtml({
            reminderType: "due_today",
            displayName,
            subscriptionLabel: sub.label,
            amount: monthlyAmount,
            dueDateStr: formatDate(targetDueDate),
            services: sub.selected_services || [],
            stripeSubscriptionId: sub.stripe_subscription_id,
          });

          const sendRes = await sendEmail({
            from: "Sienvi Billing <info@sienvi.com>",
            to: recipients,
            bcc: ["teamsienvi@gmail.com", "info@sienvi.com"],
            subject,
            html,
          });

          if (!sendRes.error) {
            await supabase.from("invoice_reminders").insert({
              client_profile_id: profile.id,
              client_subscription_id: sub.id,
              stripe_subscription_id: sub.stripe_subscription_id,
              reminder_type: "due_today",
              due_date: dueDateIso,
              amount: monthlyAmount,
              recipient_email: primaryEmail,
              status: "sent",
            });
            sentMap.add(dedupeKey);
            results.push({
              client: profile.email,
              subscription: sub.label,
              type: "due_today",
              dueDate: dueDateIso,
              status: "sent",
              messageId: sendRes.data?.id,
            });
          }
        }
      }

      // === REMINDER CHECK 3: 15 Days Overdue (If NOT Paid Yet) ===
      if (daysPastDue === 15) {
        const pastDueDateIso = pastDueDate.toISOString().split("T")[0];
        const dedupeKey = `${profile.id}:overdue_15_days:${pastDueDateIso}`;

        // STRICT STATUS TEST: Must be past_due / unpaid. If active or paid, DO NOT SEND!
        const isPastDue = sub.subscription_status === "past_due" || profile.subscription_status === "past_due";

        if (isPastDue && !sentMap.has(dedupeKey)) {
          console.log(`[Reminder: 15 Days Overdue] Triggering for ${profile.email} - ${sub.label}`);

          const { subject, html } = buildInvoiceEmailHtml({
            reminderType: "overdue_15_days",
            displayName,
            subscriptionLabel: sub.label,
            amount: monthlyAmount,
            dueDateStr: formatDate(pastDueDate),
            services: sub.selected_services || [],
            stripeSubscriptionId: sub.stripe_subscription_id,
          });

          const sendRes = await sendEmail({
            from: "Sienvi Billing <info@sienvi.com>",
            to: recipients,
            bcc: ["teamsienvi@gmail.com", "info@sienvi.com"],
            subject,
            html,
          });

          if (!sendRes.error) {
            await supabase.from("invoice_reminders").insert({
              client_profile_id: profile.id,
              client_subscription_id: sub.id,
              stripe_subscription_id: sub.stripe_subscription_id,
              reminder_type: "overdue_15_days",
              due_date: pastDueDateIso,
              amount: monthlyAmount,
              recipient_email: primaryEmail,
              status: "sent",
            });
            sentMap.add(dedupeKey);
            results.push({
              client: profile.email,
              subscription: sub.label,
              type: "overdue_15_days",
              dueDate: pastDueDateIso,
              status: "sent",
              messageId: sendRes.data?.id,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkedAt: now.toISOString(),
        dispatchedCount: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
