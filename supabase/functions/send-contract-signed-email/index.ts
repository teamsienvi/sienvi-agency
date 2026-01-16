import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractSignedEmailRequest {
  customerEmail: string;
  customerName?: string;
  signedAt?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, signedAt }: ContractSignedEmailRequest = await req.json();

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const displayName = customerName || customerEmail.split("@")[0];
    const signDate = signedAt ? new Date(signedAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dashboardUrl = "https://sienvi-agency-landing-page.lovable.app/dashboard";

    console.log("Sending contract signed confirmation to:", customerEmail);

    const emailResponse = await resend.emails.send({
      from: "Sienvi <noreply@sienvi.com>",
      to: [customerEmail],
      subject: "✅ Contract Signed Successfully - Sienvi",
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
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Contract Signed!</h1>
                <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Your service agreement is now active</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 48px;">
                <p style="margin: 0 0 24px 0; font-size: 17px; color: #374151;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 28px 0; font-size: 17px; color: #374151;">
                  Thank you for signing the Sienvi service agreement. Your contract has been successfully processed and is now in effect.
                </p>
                
                <!-- Contract Details Card -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; margin: 28px 0; border-left: 4px solid #10b981;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 16px;">
                        <span style="font-size: 13px; color: #059669; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Contract Details</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 10px 0;">
                              <span style="color: #6b7280; font-size: 15px;">Status</span>
                            </td>
                            <td align="right" style="padding: 10px 0;">
                              <span style="background: #10b981; color: #ffffff; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">Signed & Active</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <span style="color: #6b7280; font-size: 15px;">Signed On</span>
                            </td>
                            <td align="right" style="padding: 10px 0;">
                              <span style="color: #1f2937; font-size: 15px; font-weight: 600;">${signDate}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Next Step -->
                <h3 style="margin: 36px 0 20px 0; font-size: 18px; font-weight: 700; color: #1f2937;">Your Next Step</h3>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">
                  Complete your onboarding questionnaires so our team can start building your custom automations. This typically takes about 15-20 minutes.
                </p>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 28px 0;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 56px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35); transition: all 0.2s;">
                        Start Onboarding
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

    console.log("Contract signed email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contract signed email sent",
        emailId: emailResponse.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending contract signed email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
