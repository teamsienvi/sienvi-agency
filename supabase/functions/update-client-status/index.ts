import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Admin emails to notify
const ADMIN_EMAILS = ["teamsienvi@gmail.com", "sienvifba@gmail.com", "info@sienvi.com"];

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

// Send contract signed email to client
async function sendContractSignedClientEmail(email: string, name: string | null, signedAt: string) {
  try {
    const displayName = name || email.split("@")[0];
    const signDate = new Date(signedAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dashboardUrl = "https://sienvi-agency-landing-page.lovable.app/dashboard";

    console.log("Sending contract signed email to client:", email);

    await resend.emails.send({
      from: "Sienvi <info@sienvi.com>",
      to: [email],
      subject: "Agreement Signed",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 3px solid #10b981;">
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <div style="width: 48px; height: 48px; background: #10b981; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 20px; line-height: 48px;">✓</span>
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">Agreement Signed</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Your service agreement is now active</p>
              </div>
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Thank you for signing the Sienvi service agreement. Your contract is now in effect and we're ready for the next step.
                </p>
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 13px; color: #6b7280;">Status</span>
                    <span style="font-size: 13px; font-weight: 500; color: #10b981;">Signed & Active</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="font-size: 13px; color: #6b7280;">Signed on</span>
                    <span style="font-size: 13px; font-weight: 500; color: #1f2937;">${signDate}</span>
                  </div>
                </div>
                <p style="margin: 24px 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Your next step</p>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                  Complete your onboarding questionnaires so our team can start building your custom automations.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 16px 0 8px 0;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                        Start Onboarding
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                Questions? Contact <a href="mailto:teamsienvi@gmail.com" style="color: #667eea; text-decoration: none;">teamsienvi@gmail.com</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">© 2015 Sienvi. All rights reserved.</p>
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
    console.log("Contract signed email sent to client successfully");
  } catch (error) {
    console.error("Failed to send contract signed email to client:", error);
  }
}

// Send contract signed admin notification
async function sendContractSignedAdminEmail(clientEmail: string, clientName: string | null, plan: string | null, signedAt: string) {
  try {
    const displayName = clientName || clientEmail.split("@")[0];
    const planLabel = plan ? (planLabels[plan] || plan) : "N/A";
    const timestamp = new Date(signedAt).toLocaleString("en-US", {
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
          <tr>
            <td style="background: #3b82f6; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <span style="font-size: 32px;">📝</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Contract Signed</h1>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">${timestamp}</p>
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
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
                </table>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="https://sienvi-agency-landing-page.lovable.app/admin/clients" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in Admin Dashboard</a>
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

    console.log("Sending contract signed notification to admins");

    const { data, error } = await resend.emails.send({
      from: "Sienvi Admin <info@sienvi.com>",
      to: ADMIN_EMAILS,
      subject: `📝 Contract Signed - ${displayName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send contract signed admin notification:", error);
    } else {
      console.log("Contract signed admin notifications sent:", data);
    }
  } catch (error) {
    console.error("Failed to send contract signed admin notification:", error);
  }
}

// Send onboarding complete email to client
async function sendOnboardingCompleteClientEmail(email: string, name: string | null, selectedServices: string[]) {
  try {
    const displayName = name || email.split("@")[0];
    const dashboardUrl = "https://sienvi-agency-landing-page.lovable.app/dashboard";
    
    // Filter and format services for display
    const regularServices = selectedServices.filter(s => !s.startsWith("channel-"));
    const channels = selectedServices.filter(s => s.startsWith("channel-"));
    
    const servicesHtml = regularServices.map(s => `
      <div style="display: flex; align-items: center; padding: 6px 0;">
        <span style="color: #10b981; font-size: 14px; margin-right: 10px;">✓</span>
        <span style="font-size: 14px; color: #1f2937;">${serviceLabels[s] || s}</span>
      </div>
    `).join('');
    
    const channelsHtml = channels.length > 0 ? `
      <div style="display: flex; align-items: center; padding: 6px 0;">
        <span style="color: #10b981; font-size: 14px; margin-right: 10px;">✓</span>
        <span style="font-size: 14px; color: #1f2937;">Advertising: ${channels.map(s => serviceLabels[s] || s.replace("channel-", "")).join(", ")}</span>
      </div>
    ` : '';

    console.log("Sending onboarding complete email to client:", email);

    await resend.emails.send({
      from: "Sienvi <info@sienvi.com>",
      to: [email],
      subject: "Onboarding Complete",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 3px solid #667eea;">
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <div style="width: 48px; height: 48px; background: #667eea; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 20px; line-height: 48px;">🎉</span>
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">You're All Set!</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Onboarding successfully completed</p>
              </div>
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Congratulations! You've completed all onboarding steps. Our team is now reviewing your information and will begin building your custom automations.
                </p>
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                  <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your journey</p>
                  <div style="display: flex; align-items: center; padding: 6px 0;">
                    <div style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 11px;">✓</span>
                    </div>
                    <span style="font-size: 14px; color: #9ca3af; text-decoration: line-through;">Payment completed</span>
                  </div>
                  <div style="display: flex; align-items: center; padding: 6px 0;">
                    <div style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 11px;">✓</span>
                    </div>
                    <span style="font-size: 14px; color: #9ca3af; text-decoration: line-through;">Contract signed</span>
                  </div>
                  <div style="display: flex; align-items: center; padding: 6px 0;">
                    <div style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 11px;">✓</span>
                    </div>
                    <span style="font-size: 14px; color: #9ca3af; text-decoration: line-through;">Onboarding complete</span>
                  </div>
                  <div style="display: flex; align-items: center; padding: 6px 0;">
                    <div style="width: 20px; height: 20px; background: #667eea; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 11px;">→</span>
                    </div>
                    <span style="font-size: 14px; color: #1f2937; font-weight: 500;">We're building your automations</span>
                  </div>
                </div>
                ${(servicesHtml || channelsHtml) ? `
                <p style="margin: 24px 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Services we're building</p>
                <div style="margin: 0 0 20px 0;">
                  ${servicesHtml}
                  ${channelsHtml}
                </div>
                ` : ''}
                <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 20px 0 0 0;">
                  <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    Our team will review your questionnaire responses and begin building your automation workflows. Expect to hear from us within 2-3 business days.
                  </p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 24px 0 8px 0;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                        View Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                Questions? Contact <a href="mailto:teamsienvi@gmail.com" style="color: #667eea; text-decoration: none;">teamsienvi@gmail.com</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">© 2015 Sienvi. All rights reserved.</p>
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
    console.log("Onboarding complete email sent to client successfully");
  } catch (error) {
    console.error("Failed to send onboarding complete email to client:", error);
  }
}

// Format a section of onboarding form data into an HTML table
function formatSection(title: string, data: Record<string, any> | null | undefined): string {
  if (!data) return '';
  const skip = new Set(['id', 'client_profile_id', 'created_at', 'updated_at', 'completed_at']);
  const rows = Object.entries(data)
    .filter(([key, val]) => !skip.has(key) && val !== null && val !== undefined && val !== '' && val !== false)
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      let value = '';
      if (Array.isArray(val)) {
        value = val.length > 0 ? val.join(', ') : 'None';
      } else if (val === true) {
        value = 'Yes';
      } else if (typeof val === 'object') {
        try { value = `<pre style="margin:0;font-size:11px;white-space:pre-wrap">${JSON.stringify(val, null, 2)}</pre>`; } catch { value = String(val); }
      } else {
        value = String(val).replace(/\n/g, '<br>');
      }
      return `<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;width:38%;border-bottom:1px solid #f1f5f9;vertical-align:top">${label}</td><td style="padding:8px 12px;font-size:13px;color:#1f2937;border-bottom:1px solid #f1f5f9;vertical-align:top">${value}</td></tr>`;
    });
  if (rows.length === 0) return '';
  return `<div style="margin-bottom:24px"><h3 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#ffffff;background:#667eea;padding:10px 14px;border-radius:6px 6px 0 0">${title}</h3><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden">${rows.join('')}</table></div>`;
}

// Send onboarding complete admin notification
async function sendOnboardingCompleteAdminEmail(clientEmail: string, clientName: string | null, plan: string | null, selectedServices: string[], onboardingData?: { goals?: any; avatars?: any; questionnaire?: any; advertising?: any; amazon?: any }) {
  try {
    const displayName = clientName || clientEmail.split("@")[0];
    const planLabel = plan ? (planLabels[plan] || plan) : "N/A";
    const timestamp = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Format services for display
    const regularServices = selectedServices.filter(s => !s.startsWith("channel-"));
    const channels = selectedServices.filter(s => s.startsWith("channel-"));
    
    const servicesHtml = regularServices.map(s => 
      `<li style="padding: 4px 0; color: #374151;">${serviceLabels[s] || s}</li>`
    ).join("");
    
    const channelsHtml = channels.length > 0
      ? channels.map(s => serviceLabels[s] || s.replace("channel-", "")).join(", ")
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
            <td style="background: #8b5cf6; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <span style="font-size: 32px;">🎉</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Onboarding Completed</h1>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">${timestamp}</p>
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #8b5cf6;">
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
                  ${channelsHtml ? `
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Channels:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937;">${channelsHtml}</span></td>
                  </tr>
                  ` : ""}
                </table>
              </div>
              ${regularServices.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Selected Services</h4>
                <ul style="margin: 0; padding: 0 0 0 20px; list-style: disc;">${servicesHtml}</ul>
              </div>
              ` : ""}
              <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 500;">
                  ✅ This client is ready for service delivery. All questionnaires have been completed.
                </p>
              </div>

              ${onboardingData ? `
              <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #1f2937;">📋 Onboarding Responses</h3>
              ${formatSection('Goal Sheet', onboardingData.goals)}
              ${formatSection('Avatar Profile', onboardingData.avatars)}
              ${formatSection('General Questionnaire', onboardingData.questionnaire)}
              ${formatSection('Advertising Questionnaire', onboardingData.advertising)}
              ${formatSection('Amazon Questionnaire', onboardingData.amazon)}
              ` : ''}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="https://sienvi.com/admin/clients" style="display: inline-block; background: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
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

    console.log("Sending onboarding complete notification to admins");

    const { data, error } = await resend.emails.send({
      from: "Sienvi Admin <info@sienvi.com>",
      to: ADMIN_EMAILS,
      subject: `🎉 Onboarding Completed - ${displayName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send onboarding complete admin notification:", error);
    } else {
      console.log("Onboarding complete admin notifications sent:", data);
    }
  } catch (error) {
    console.error("Failed to send onboarding complete admin notification:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, clientId } = await req.json();

    // Get the client profile
    let profileQuery = supabaseAdmin.from("client_profiles").select("*");
    
    // If clientId is provided (admin action), use that; otherwise use current user
    if (clientId) {
      // Check if user is admin
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required to update other clients" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      profileQuery = profileQuery.eq("id", clientId);
    } else {
      profileQuery = profileQuery.eq("user_id", user.id);
    }

    const { data: profile, error: profileError } = await profileQuery.single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Client profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updateData: Record<string, unknown> = {};
    const signedAt = new Date().toISOString();

    switch (action) {
      case "sign_contract":
        if (profile.subscription_status !== "active") {
          return new Response(
            JSON.stringify({ error: "Payment must be completed before signing contract" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = {
          contract_status: "signed",
          contract_signed_at: signedAt,
        };
        break;

      case "start_onboarding":
        if (profile.contract_status !== "signed") {
          return new Response(
            JSON.stringify({ error: "Contract must be signed before starting onboarding" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = {
          onboarding_status: "in_progress",
        };
        break;

      case "complete_onboarding":
        if (profile.onboarding_status === "not_started") {
          return new Response(
            JSON.stringify({ error: "Onboarding must be started first" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = {
          onboarding_status: "completed",
          onboarding_completed_at: new Date().toISOString(),
          account_status: "active",
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const { error: updateError } = await supabaseAdmin
      .from("client_profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (updateError) {
      throw updateError;
    }

    // Send email notifications based on action
    const clientName = profile.first_name 
      ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
      : null;

    if (action === "sign_contract" && profile.email) {
      // Send both client and admin emails for contract signing
      await Promise.all([
        sendContractSignedClientEmail(profile.email, clientName, signedAt),
        sendContractSignedAdminEmail(profile.email, clientName, profile.plan, signedAt),
      ]);
    }

    if (action === "complete_onboarding" && profile.email) {
      // Fetch all onboarding form responses to include in admin email
      const [goalsRes, avatarsRes, questionnaireRes, advertisingRes, amazonRes] = await Promise.all([
        supabaseAdmin.from("onboarding_goals").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabaseAdmin.from("onboarding_avatars").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabaseAdmin.from("onboarding_questionnaire").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabaseAdmin.from("onboarding_advertising").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabaseAdmin.from("onboarding_amazon").select("*").eq("client_profile_id", profile.id).maybeSingle(),
      ]);
      const onboardingData = {
        goals: goalsRes.data,
        avatars: avatarsRes.data,
        questionnaire: questionnaireRes.data,
        advertising: advertisingRes.data,
        amazon: amazonRes.data,
      };
      // Send both client and admin emails for onboarding completion
      await Promise.all([
        sendOnboardingCompleteClientEmail(profile.email, clientName, profile.selected_services || []),
        sendOnboardingCompleteAdminEmail(profile.email, clientName, profile.plan, profile.selected_services || [], onboardingData),
      ]);
    }

    return new Response(
      JSON.stringify({ success: true, action }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in update-client-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});