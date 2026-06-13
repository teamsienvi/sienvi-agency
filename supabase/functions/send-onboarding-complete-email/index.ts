import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingCompleteEmailRequest {
  customerEmail: string;
  customerName?: string;
  selectedServices?: string[];
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, selectedServices }: OnboardingCompleteEmailRequest = await req.json();

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const primaryEmail = customerEmail.split(/[,;]/)[0].trim().toLowerCase();
    let additionalEmails: string[] = [];

    // Query client profile to get notes
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from("client_profiles")
      .select("notes")
      .eq("email", primaryEmail)
      .maybeSingle();

    if (profile?.notes) {
      additionalEmails = parseAdditionalEmails(profile.notes);
    }

    const displayName = customerName || primaryEmail.split("@")[0];
    const dashboardUrl = "https://sienvi-agency-landing-page.lovable.app/dashboard";
    
    const servicesHtml = selectedServices && selectedServices.length > 0 
      ? selectedServices.map(s => `
          <div style="display: flex; align-items: center; padding: 6px 0;">
            <span style="color: #10b981; font-size: 14px; margin-right: 10px;">✓</span>
            <span style="font-size: 14px; color: #1f2937;">${serviceLabels[s] || s}</span>
          </div>
        `).join('')
      : '';

    const recipients = [...new Set([primaryEmail, ...additionalEmails])];

    console.log("Sending onboarding complete email to:", recipients);

    const emailResponse = await resend.emails.send({
      from: "Sienvi <info@sienvi.com>",
      to: recipients,
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
              <!-- Header -->
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <div style="width: 48px; height: 48px; background: #667eea; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 20px; line-height: 48px;">✓</span>
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">You're All Set</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Onboarding successfully completed</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Congratulations! You've completed all onboarding steps. Our team is now reviewing your information and will begin building your custom automations.
                </p>
                
                <!-- Progress Summary -->
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
                
                ${servicesHtml ? `
                <!-- Selected Services -->
                <p style="margin: 24px 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Services we're building</p>
                <div style="margin: 0 0 20px 0;">
                  ${servicesHtml}
                </div>
                ` : ''}
                
                <!-- What's Next -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 20px 0 0 0;">
                  <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    Our team will review your questionnaire responses and begin building your automation workflows. Expect to hear from us within 2-3 business days.
                  </p>
                </div>
                
                <!-- CTA Button -->
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
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                Questions? Contact <a href="mailto:teamsienvi@gmail.com" style="color: #667eea; text-decoration: none;">teamsienvi@gmail.com</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
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

    console.log("Onboarding complete email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Onboarding complete email sent",
        emailId: emailResponse.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending onboarding complete email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
