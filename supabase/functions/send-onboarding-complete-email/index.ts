import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  "lead-gen": "Lead Generation Automation",
  "email-marketing": "Email Marketing Automation",
  "social-media": "Social Media Automation",
  "crm": "CRM Integration",
  "analytics": "Analytics & Reporting",
  "custom-workflows": "Custom Workflows",
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

    const displayName = customerName || customerEmail.split("@")[0];
    const dashboardUrl = "https://sienvi-agency-landing-page.lovable.app/dashboard";
    
    // Build services list
    const servicesHtml = selectedServices && selectedServices.length > 0 
      ? selectedServices.map(s => `
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 32px;">
              <span style="color: #10b981; font-size: 16px;">✓</span>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 15px;">${serviceLabels[s] || s}</td>
          </tr>
        `).join('')
      : '';

    console.log("Sending onboarding complete email to:", customerEmail);

    const emailResponse = await resend.emails.send({
      from: "Sienvi <noreply@sienvi.com>",
      to: [customerEmail],
      subject: "🎉 Onboarding Complete - Let's Get Started!",
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
              <!-- Celebration Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">You're All Set!</h1>
                <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Onboarding successfully completed</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 48px;">
                <p style="margin: 0 0 24px 0; font-size: 17px; color: #374151;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 28px 0; font-size: 17px; color: #374151;">
                  Congratulations! You've completed all the onboarding steps. Our team is now reviewing your information and will begin building your custom automations.
                </p>
                
                <!-- Status Card -->
                <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 24px; margin: 28px 0; border-left: 4px solid #9333ea;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="font-size: 13px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Journey</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; vertical-align: top; width: 32px;"><span style="color: #10b981; font-size: 16px;">✓</span></td>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 15px; text-decoration: line-through;">Payment completed</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; vertical-align: top;"><span style="color: #10b981; font-size: 16px;">✓</span></td>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 15px; text-decoration: line-through;">Contract signed</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; vertical-align: top;"><span style="color: #10b981; font-size: 16px;">✓</span></td>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 15px; text-decoration: line-through;">Onboarding complete</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; vertical-align: top;"><span style="color: #667eea; font-size: 16px;">→</span></td>
                            <td style="padding: 8px 0; color: #374151; font-size: 15px; font-weight: 600;">We're building your automations!</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                
                ${servicesHtml ? `
                <!-- Selected Services -->
                <h3 style="margin: 36px 0 20px 0; font-size: 18px; font-weight: 700; color: #1f2937;">Services We're Building For You</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  ${servicesHtml}
                </table>
                ` : ''}
                
                <!-- What Happens Next -->
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 28px 0;">
                  <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #1e40af;">What happens next?</h4>
                  <p style="margin: 0; font-size: 14px; color: #3b82f6; line-height: 1.6;">
                    Our team will review your questionnaire responses and begin building your custom automation workflows. You'll receive updates via email as we make progress. Expect to hear from us within 2-3 business days.
                  </p>
                </div>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 28px 0;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 56px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);">
                        View Your Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #9ca3af;">
                Need help? Contact us at
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
