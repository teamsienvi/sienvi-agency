import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendEmail } from "../_shared/ses-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Send contract signed email to client or co-signers
async function sendContractSignedClientEmail(
  email: string,
  name: string | null,
  signedAt: string,
  isFullySigned: boolean,
  signers?: any[],
  justSignedName?: string
) {
  try {
    const displayName = name || email.split("@")[0];
    const signDate = new Date(signedAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dashboardUrl = "https://sienvi.com/dashboard";
    const contractUrl = "https://sienvi.com/contract";

    const subject = isFullySigned 
      ? "🎉 Agreement Fully Signed & Active" 
      : `Signature Received - Agreement Awaiting Final Co-Signature`;

    console.log(`Sending contract ${isFullySigned ? 'fully signed' : 'partially signed'} email to client:`, email);

    await sendEmail({
      from: "Sienvi <info@sienvi.com>",
      to: [email],
      subject: subject,
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
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 3px solid ${isFullySigned ? '#10b981' : '#3b82f6'};">
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <table align="center" cellpadding="0" cellspacing="0" width="48" height="48" style="border-collapse: collapse; margin: 0 auto 16px auto;">
                  <tr>
                    <td align="center" valign="middle" style="width: 48px; height: 48px; background: ${isFullySigned ? '#10b981' : '#3b82f6'}; border-radius: 50%; color: #ffffff; font-size: 20px; line-height: 48px; text-align: center; vertical-align: middle;">
                      ${isFullySigned ? '✓' : '✍️'}
                    </td>
                  </tr>
                </table>
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">
                  ${isFullySigned ? 'Agreement Fully Executed' : 'Signature Confirmed'}
                </h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                  ${isFullySigned ? 'Your service agreement is now active' : 'Awaiting final co-founder signature'}
                </p>
              </div>
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  ${isFullySigned 
                    ? "Thank you for executing the Sienvi service agreement. All required signatures have been completed and your contract is now officially in effect."
                    : `${justSignedName || 'A signature'} has been successfully recorded on the service agreement. The agreement will become fully active once all co-signers have signed.`}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #f1f5f9; border-radius: 8px; margin: 20px 0; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                          <td align="left" style="font-size: 13px; color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                            Status
                          </td>
                          <td align="right" style="font-size: 13px; font-weight: 600; color: ${isFullySigned ? '#10b981' : '#f59e0b'}; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                            ${isFullySigned ? 'Signed & Active (All Co-Signers)' : 'Partially Signed (Awaiting Co-Signer)'}
                          </td>
                        </tr>
                        <tr>
                          <td align="left" style="font-size: 13px; color: #6b7280; padding: 8px 0;">
                            Last Signed on
                          </td>
                          <td align="right" style="font-size: 13px; font-weight: 500; color: #1f2937; padding: 8px 0;">
                            ${signDate}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Your next step</p>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                  ${isFullySigned 
                    ? "Complete your onboarding questionnaires so our team can start building your custom automations."
                    : "You can monitor the live signing status in your dashboard."}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 16px 0 8px 0;">
                      <a href="${isFullySigned ? dashboardUrl : contractUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                        ${isFullySigned ? 'Start Onboarding' : 'View Agreement Status'}
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

// Send invitation to pending co-signer when their partner signs first
async function sendPendingCoSignerEmail(pendingEmail: string, pendingName: string | null, signedByName: string, companyName: string) {
  try {
    const displayName = pendingName || pendingEmail.split("@")[0];
    const contractUrl = "https://sienvi.com/contract";

    console.log(`Sending pending co-signer invitation to ${pendingEmail}`);

    await sendEmail({
      from: "Sienvi <info@sienvi.com>",
      to: [pendingEmail],
      subject: `✍️ Action Required: ${signedByName} has signed the Sienvi Service Agreement for ${companyName}`,
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
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 3px solid #3b82f6;">
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <table align="center" cellpadding="0" cellspacing="0" width="48" height="48" style="border-collapse: collapse; margin: 0 auto 16px auto;">
                  <tr>
                    <td align="center" valign="middle" style="width: 48px; height: 48px; background: #3b82f6; border-radius: 50%; color: #ffffff; font-size: 20px; line-height: 48px; text-align: center; vertical-align: middle;">
                      ✍️
                    </td>
                  </tr>
                </table>
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">
                  Co-Signature Requested
                </h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                  Service Agreement for ${companyName}
                </p>
              </div>
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  <strong>${signedByName}</strong> has reviewed and signed the Sienvi Service Agreement on behalf of <strong>${companyName}</strong>.
                </p>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Please review the agreement and add your digital signature to finalize execution and unlock your team's workspace and onboarding questionnaires.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 16px 0 8px 0;">
                      <a href="${contractUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        Review & Sign Agreement
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
    console.log("Pending co-signer email sent successfully");
  } catch (error) {
    console.error("Failed to send pending co-signer email:", error);
  }
}

// Send contract signed admin notification (supports 1 of 2 partial signature and full execution)
async function sendContractSignedAdminEmail(
  clientEmail: string,
  clientName: string | null,
  plan: string | null,
  signedAt: string,
  signature?: string,
  contractDetails?: any,
  isFullySigned: boolean = true,
  signers?: any[]
) {
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

    const hasDualSigners = signers && signers.length > 1;
    const signedCount = signers ? signers.filter((s: any) => s.status === "signed").length : 1;
    const totalCount = signers ? signers.length : 1;

    const subject = isFullySigned
      ? `🎉 Contract Fully Executed (${totalCount}/${totalCount}) - ${displayName}`
      : `📝 Contract Partially Signed (${signedCount}/${totalCount}) - ${displayName}`;

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
            <td style="background: ${isFullySigned ? '#10b981' : '#3b82f6'}; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <span style="font-size: 32px;">${isFullySigned ? '🎉' : '📝'}</span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                ${isFullySigned ? 'Contract Fully Executed' : `Contract Partially Signed (${signedCount}/${totalCount})`}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">${timestamp}</p>
              
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${isFullySigned ? '#10b981' : '#f59e0b'};">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">Co-Signer Execution Status</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Account / Client:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937; font-weight: 600;">${displayName}</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Status:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="color: ${isFullySigned ? '#10b981' : '#f59e0b'}; font-weight: 700;">
                        ${isFullySigned ? '✅ Fully Signed & Active' : `⏳ Partially Signed (${signedCount}/${totalCount} Signatures)`}
                      </span>
                    </td>
                  </tr>
                  ${hasDualSigners ? `
                  <tr>
                    <td colspan="2" style="padding-top: 12px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0;">
                        ${signers.map((s: any) => `
                          <tr>
                            <td style="padding: 8px 0; font-size: 13px;">
                              <strong>${s.name || s.email}</strong> (${s.title || 'Co-Founder'})
                            </td>
                            <td style="padding: 8px 0; text-align: right; font-size: 13px;">
                              ${s.status === 'signed' 
                                ? `<span style="color: #10b981; font-weight: 600;">✓ Signed: <em style="font-family: 'Courier New', monospace;">"${s.signature}"</em></span>`
                                : `<span style="color: #f59e0b; font-weight: 600;">⏳ Awaiting Signature</span>`}
                            </td>
                          </tr>
                        `).join('')}
                      </table>
                    </td>
                  </tr>
                  ` : signature ? `
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Digital Signature:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937; font-family: 'Courier New', Courier, monospace; font-weight: bold; font-style: italic;">${signature}</span></td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Email:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><a href="mailto:${clientEmail}" style="color: #667eea; text-decoration: none;">${clientEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong style="color: #6b7280;">Plan / Model:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><span style="color: #1f2937; font-weight: 600;">${contractDetails?.pricingModel === 'commission' ? 'Commission-Based (Performance Share)' : planLabel}</span></td>
                  </tr>
                </table>
              </div>

              ${formatContractDetails(contractDetails)}
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="https://sienvi.com/admin/clients" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in Admin Dashboard</a>
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

    console.log(`Sending contract ${isFullySigned ? 'fully signed' : 'partially signed'} notification to admins`);

    const { data, error } = await sendEmail({
      from: "Sienvi Admin <info@sienvi.com>",
      to: ADMIN_EMAILS,
      subject: subject,
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

    console.log("Sending contract signed notification to admins");

    const { data, error } = await sendEmail({
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
    const dashboardUrl = "https://sienvi.com/dashboard";
    
    // Filter and format services for display
    const regularServices = selectedServices.filter(s => !s.startsWith("channel-"));
    const channels = selectedServices.filter(s => s.startsWith("channel-"));
    
    const servicesHtml = regularServices.map(s => `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; width: 20px; vertical-align: middle;">
            <span style="color: #10b981; font-size: 14px;">✓</span>
          </td>
          <td align="left" style="padding: 6px 0 6px 10px; font-size: 14px; color: #1f2937; vertical-align: middle;">
            ${serviceLabels[s] || s}
          </td>
        </tr>
      </table>
    `).join('');
    
    const channelsHtml = channels.length > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; width: 20px; vertical-align: middle;">
            <span style="color: #10b981; font-size: 14px;">✓</span>
          </td>
          <td align="left" style="padding: 6px 0 6px 10px; font-size: 14px; color: #1f2937; vertical-align: middle;">
            Advertising: ${channels.map(s => serviceLabels[s] || s.replace("channel-", "")).join(", ")}
          </td>
        </tr>
      </table>
    ` : '';

    console.log("Sending onboarding complete email to client:", email);

    await sendEmail({
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
                <table align="center" cellpadding="0" cellspacing="0" width="48" height="48" style="border-collapse: collapse; margin: 0 auto 16px auto;">
                  <tr>
                    <td align="center" valign="middle" style="width: 48px; height: 48px; background: #667eea; border-radius: 50%; color: #ffffff; font-size: 20px; line-height: 48px; text-align: center; vertical-align: middle;">
                      🎉
                    </td>
                  </tr>
                </table>
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">You're All Set!</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Onboarding successfully completed</p>
              </div>
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Congratulations! You've completed all onboarding steps. Our team is now reviewing your information and will begin building your custom automations.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #f1f5f9; border-radius: 8px; margin: 20px 0; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your journey</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; width: 20px; vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" width="20" height="20" style="border-collapse: collapse;">
                              <tr>
                                <td align="center" valign="middle" style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; color: #ffffff; font-size: 11px; font-family: sans-serif; font-weight: 500; line-height: 20px; text-align: center;">
                                  ✓
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="left" style="padding: 6px 0 6px 12px; font-size: 14px; color: #9ca3af; text-decoration: line-through; vertical-align: middle;">
                            Payment completed
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; width: 20px; vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" width="20" height="20" style="border-collapse: collapse;">
                              <tr>
                                <td align="center" valign="middle" style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; color: #ffffff; font-size: 11px; font-family: sans-serif; font-weight: 500; line-height: 20px; text-align: center;">
                                  ✓
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="left" style="padding: 6px 0 6px 12px; font-size: 14px; color: #9ca3af; text-decoration: line-through; vertical-align: middle;">
                            Contract signed
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; width: 20px; vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" width="20" height="20" style="border-collapse: collapse;">
                              <tr>
                                <td align="center" valign="middle" style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; color: #ffffff; font-size: 11px; font-family: sans-serif; font-weight: 500; line-height: 20px; text-align: center;">
                                  ✓
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="left" style="padding: 6px 0 6px 12px; font-size: 14px; color: #9ca3af; text-decoration: line-through; vertical-align: middle;">
                            Onboarding complete
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; width: 20px; vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" width="20" height="20" style="border-collapse: collapse;">
                              <tr>
                                <td align="center" valign="middle" style="width: 20px; height: 20px; background: #667eea; border-radius: 50%; color: #ffffff; font-size: 11px; font-family: sans-serif; font-weight: 500; line-height: 20px; text-align: center;">
                                  →
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="left" style="padding: 6px 0 6px 12px; font-size: 14px; color: #1f2937; font-weight: 500; vertical-align: middle;">
                            We're building your automations
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
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

    const { data, error } = await sendEmail({
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

    const { action, clientId, signature, contractDetails, signerEmail, signerName, signerTitle } = await req.json();
    const userEmail = user.email?.toLowerCase() || "";

    // Get the client profile
    let profile: any = null;
    
    // If clientId is provided (admin action or authorized co-signer), check access
    if (clientId) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      
      const isAdmin = !!roleData;
      if (isAdmin) {
        const { data: p } = await supabaseAdmin.from("client_profiles").select("*").eq("id", clientId).maybeSingle();
        profile = p;
      } else {
        const { data: p } = await supabaseAdmin.from("client_profiles").select("*").eq("id", clientId).maybeSingle();
        if (p) {
          const cd = p.contract_details || {};
          const signers = cd.signers || [];
          const linked = cd.linkedClientEmails || [];
          const isAuthorized = signers.some((s: any) => s.email?.toLowerCase() === userEmail) ||
                               linked.some((e: string) => e.toLowerCase() === userEmail) ||
                               p.user_id === user.id ||
                               p.email?.toLowerCase() === userEmail;
          if (isAuthorized) {
            profile = p;
          }
        }
      }
    }

    if (!profile) {
      // Find by user_id
      const { data: pByUid } = await supabaseAdmin.from("client_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (pByUid) {
        profile = pByUid;
      } else {
        // Find by email
        const { data: pByEmail } = await supabaseAdmin.from("client_profiles").select("*").eq("email", userEmail).maybeSingle();
        if (pByEmail) {
          profile = pByEmail;
        } else {
          // Find by shared profile where user is a co-signer
          const { data: allP } = await supabaseAdmin.from("client_profiles").select("*");
          profile = (allP || []).find((p: any) => {
            const cd = p.contract_details || {};
            const signers = cd.signers || [];
            const linked = cd.linkedClientEmails || [];
            return signers.some((s: any) => s.email?.toLowerCase() === userEmail) ||
                   linked.some((e: string) => e.toLowerCase() === userEmail) ||
                   (p.notes || "").toLowerCase().includes(userEmail);
          });
        }
      }
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Client profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updateData: Record<string, unknown> = {};
    const signedAt = new Date().toISOString();
    let isFullyExecuted = false;
    let isPartiallyExecuted = false;
    let allSignerEmails: string[] = [profile.email];

    switch (action) {
      case "sign_contract": {
        const existingDetails = profile.contract_details || {};
        const incomingDetails = contractDetails || {};
        const mergedDetails = { ...existingDetails, ...incomingDetails };

        let signers = mergedDetails.signers || existingDetails.signers || [];
        
        // Auto-detect In the Dome co-signers if needed
        const isDome = profile.email === "jordan@jordanellams.com" || 
                       userEmail === "jordan@jordanellams.com" || 
                       userEmail === "michaelrrwilson@gmail.com" ||
                       mergedDetails.uploadedContractName?.includes("IN THE DOME") ||
                       mergedDetails.uploadedProposalName?.includes("IN THE DOME");

        if (isDome && (!signers || signers.length === 0)) {
          signers = [
            {
              email: "jordan@jordanellams.com",
              name: "Jordan Ellams",
              title: "Co-Founder / Principal",
              signature: profile.contract_signature || null,
              signedAt: profile.contract_signed_at || null,
              status: profile.contract_signature ? "signed" : "pending"
            },
            {
              email: "michaelrrwilson@gmail.com",
              name: "Michael Wilson",
              title: "Co-Founder / Principal",
              signature: null,
              signedAt: null,
              status: "pending"
            }
          ];
        }

        const effectiveSignerEmail = (signerEmail || userEmail).toLowerCase();
        let activeSignerUpdated = false;

        if (signers && signers.length > 0) {
          signers = signers.map((s: any) => {
            const matchesEmail = s.email?.toLowerCase() === effectiveSignerEmail ||
              (effectiveSignerEmail.includes("jordan") && s.email?.toLowerCase().includes("jordan")) ||
              (effectiveSignerEmail.includes("michael") && s.email?.toLowerCase().includes("michael"));

            if (matchesEmail) {
              activeSignerUpdated = true;
              return {
                ...s,
                signature: signature ? signature.trim() : s.signature,
                title: signerTitle || s.title || "Co-Founder / Principal",
                signedAt: signedAt,
                status: "signed"
              };
            }
            return s;
          });

          if (!activeSignerUpdated && signature) {
            signers.push({
              email: effectiveSignerEmail,
              name: signerName || effectiveSignerEmail.split("@")[0],
              title: signerTitle || "Authorized Signatory",
              signature: signature.trim(),
              signedAt: signedAt,
              status: "signed"
            });
          }
        }

        const allSigned = signers.length > 0 ? signers.every((s: any) => s.status === "signed") : true;
        const anySigned = signers.length > 0 ? signers.some((s: any) => s.status === "signed") : true;
        isFullyExecuted = allSigned;
        isPartiallyExecuted = anySigned && !allSigned;

        const combinedSignature = signers.length > 0 
          ? signers.filter((s: any) => s.signature).map((s: any) => s.signature).join(" & ")
          : (signature || "");

        mergedDetails.signers = signers;
        mergedDetails.isDualSignature = signers.length > 1;
        if (signers.length > 0) {
          allSignerEmails = signers.map((s: any) => s.email).filter(Boolean);
        }

        updateData = {
          contract_status: allSigned ? "signed" : (anySigned ? "partially_signed" : "not_signed"),
          contract_signed_at: allSigned ? signedAt : profile.contract_signed_at,
          contract_signature: combinedSignature,
          contract_details: mergedDetails,
        };
        break;
      }

      case "start_onboarding":
        const isDiscovery = profile.plan === "discovery" || profile.plan === "prospect" || profile.plan === "custom-lms" || (profile.selected_services || []).includes("custom-tool");
        if (profile.contract_status !== "signed" && !isDiscovery) {
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

    if (action === "sign_contract") {
      const mergedDetails = (updateData.contract_details as any) || contractDetails || {};
      const currentSigners: any[] = mergedDetails.signers || [];
      const companyName = profile.entity_name || (mergedDetails.uploadedContractName?.includes("IN THE DOME") ? "In the Dome" : "Sienvi Agency");
      
      const activeSignerObj = currentSigners.find((s: any) => s.email?.toLowerCase() === effectiveSignerEmail);
      const activeSignerName = signerName || activeSignerObj?.name || (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim() : null) || effectiveSignerEmail.split("@")[0];

      // 1. Send Admin Notification (clarifying 1/2 partial or 2/2 full execution)
      await sendContractSignedAdminEmail(
        profile.email,
        profile.client_name || clientName,
        profile.plan,
        signedAt,
        (updateData.contract_signature as string) || signature,
        mergedDetails,
        isFullyExecuted,
        currentSigners
      );

      // 2. Client & Co-Signer Notifications
      if (isFullyExecuted) {
        // Send Full Execution Confirmation to all co-signers
        for (const signer of currentSigners) {
          if (signer.email) {
            await sendContractSignedClientEmail(signer.email, signer.name, signedAt, true, currentSigners, activeSignerName);
          }
        }
      } else if (isPartiallyExecuted) {
        // Send confirmation to the signer who just signed
        await sendContractSignedClientEmail(effectiveSignerEmail, activeSignerName, signedAt, false, currentSigners, activeSignerName);

        // Send alert to the co-signer whose signature is still pending
        const pendingSigners = currentSigners.filter((s: any) => s.status !== "signed" && s.email?.toLowerCase() !== effectiveSignerEmail);
        for (const pending of pendingSigners) {
          if (pending.email) {
            await sendPendingCoSignerEmail(pending.email, pending.name, activeSignerName, companyName);
          }
        }
      }
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

      let questionnaireData = questionnaireRes.data;
      if (questionnaireData && questionnaireData.additional_notes) {
        try {
          const parsed = JSON.parse(questionnaireData.additional_notes);
          if (parsed && typeof parsed === "object") {
            questionnaireData = { ...questionnaireData, ...parsed };
            // Remove raw JSON from additional_notes to avoid printing a raw JSON block in the email
            delete questionnaireData.additional_notes;
          }
        } catch (e) {
          // not JSON, keep as is
        }
      }

      let advertisingData = advertisingRes.data;
      if (advertisingData && advertisingData.additional_notes) {
        try {
          const parsed = JSON.parse(advertisingData.additional_notes);
          if (parsed && typeof parsed === "object") {
            advertisingData = { ...advertisingData, ...parsed };
            delete advertisingData.additional_notes;
          }
        } catch (e) {
          // not JSON, keep as is
        }
      }

      const onboardingData = {
        goals: goalsRes.data,
        avatars: avatarsRes.data,
        questionnaire: questionnaireData,
        advertising: advertisingData,
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