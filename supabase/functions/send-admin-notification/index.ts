import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin emails to notify
const ADMIN_EMAILS = ["teamsienvi@gmail.com", "sienvifba@gmail.com", "info@sienvi.com"];

// Event types that trigger admin notifications
type NotificationEvent = 
  | "payment_completed"
  | "contract_signed"
  | "onboarding_completed"
  | "new_signup"
  | "subscription_canceled";

interface AdminNotificationRequest {
  event: NotificationEvent;
  clientEmail: string;
  clientName?: string;
  plan?: string;
  amount?: number;
  selectedServices?: string[];
  additionalInfo?: Record<string, string>;
}

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

const planLabels: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Automation",
  full: "Full Automation Suite",
  custom: "Custom Plan",
  amazon: "Amazon Design Package",
  advertising: "Advertising Package",
};

// Email configurations for each event type
const eventConfig: Record<NotificationEvent, { subject: string; emoji: string; title: string; color: string }> = {
  payment_completed: {
    subject: "💰 Payment Received",
    emoji: "💰",
    title: "New Payment Received",
    color: "#10b981",
  },
  contract_signed: {
    subject: "📝 Contract Signed",
    emoji: "📝",
    title: "Contract Signed",
    color: "#3b82f6",
  },
  onboarding_completed: {
    subject: "🎉 Onboarding Completed",
    emoji: "🎉",
    title: "Onboarding Completed",
    color: "#8b5cf6",
  },
  new_signup: {
    subject: "🆕 New Client Signup",
    emoji: "🆕",
    title: "New Client Signup",
    color: "#f59e0b",
  },
  subscription_canceled: {
    subject: "⚠️ Subscription Canceled",
    emoji: "⚠️",
    title: "Subscription Canceled",
    color: "#ef4444",
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      event, 
      clientEmail, 
      clientName, 
      plan, 
      amount, 
      selectedServices,
      additionalInfo 
    }: AdminNotificationRequest = await req.json();

    if (!event || !clientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event and clientEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = eventConfig[event];
    if (!config) {
      return new Response(
        JSON.stringify({ error: "Invalid event type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const displayName = clientName || clientEmail.split("@")[0];
    const planLabel = plan ? (planLabels[plan] || plan) : "N/A";
    const formattedAmount = amount ? `$${amount.toLocaleString()}` : "N/A";
    
    // Format services list
    const servicesHtml = selectedServices && selectedServices.length > 0
      ? selectedServices.map(s => `<li style="padding: 4px 0; color: #374151;">${serviceLabels[s] || s}</li>`).join("")
      : "<li style=\"color: #9ca3af;\">No services selected</li>";

    // Build additional info section
    let additionalInfoHtml = "";
    if (additionalInfo && Object.keys(additionalInfo).length > 0) {
      additionalInfoHtml = `
        <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Additional Details</h4>
          ${Object.entries(additionalInfo).map(([key, value]) => `
            <p style="margin: 8px 0; font-size: 14px;"><strong>${key}:</strong> ${value}</p>
          `).join("")}
        </div>
      `;
    }

    const timestamp = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

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
          <!-- Header -->
          <tr>
            <td style="background: ${config.color}; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <span style="font-size: 32px;">${config.emoji}</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">${config.title}</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">
                ${timestamp}
              </p>
              
              <!-- Client Info Card -->
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
                </table>
              </div>
              
              <!-- Services -->
              ${selectedServices && selectedServices.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Selected Services</h4>
                <ul style="margin: 0; padding: 0 0 0 20px; list-style: disc;">
                  ${servicesHtml}
                </ul>
              </div>
              ` : ""}
              
              ${additionalInfoHtml}
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="https://sienvi-agency-landing-page.lovable.app/admin/clients" style="display: inline-block; background: ${config.color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View in Admin Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification from Sienvi Admin System
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #d1d5db;">
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
    `;

    console.log(`Sending admin notification for event: ${event}, client: ${clientEmail}`);

    // Send to all admin emails in a single API call to prevent rate limiting
    const { data, error } = await resend.emails.send({
      from: "Sienvi Admin <info@sienvi.com>",
      to: ADMIN_EMAILS,
      subject: `${config.subject} - ${displayName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Admin notification failed:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to send admin notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin notifications sent successfully to:", ADMIN_EMAILS);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        recipients: ADMIN_EMAILS 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending admin notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
