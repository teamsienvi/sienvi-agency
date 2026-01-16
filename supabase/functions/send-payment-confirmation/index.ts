import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  customerEmail: string;
  customerName?: string;
  plan: string;
  amount: number;
  dashboardUrl?: string;
}

const planLabels: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Automation",
  full: "Full Automation Suite",
  custom: "Custom Plan",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, plan, amount, dashboardUrl }: PaymentConfirmationRequest = await req.json();

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const displayName = customerName || customerEmail.split("@")[0];
    const planLabel = planLabels[plan] || plan || "Sienvi Subscription";
    const formattedAmount = amount ? `$${(amount / 100).toLocaleString()}` : "N/A";
    const loginUrl = dashboardUrl || "https://sienvi-agency-landing-page.lovable.app/login";

    console.log("Sending payment confirmation to:", customerEmail, "Plan:", planLabel, "Amount:", formattedAmount);

    const emailResponse = await resend.emails.send({
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
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #667eea;">Sienvi</h1>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Success Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">✓</span>
                </div>
                <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Payment Successful!</h2>
                <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Thank you for your subscription</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 40px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; color: #1f2937;">
                  Great news! Your payment has been processed successfully. Welcome to the Sienvi family! 🚀
                </p>
                
                <!-- Payment Details Card -->
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
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">Plan</span>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${planLabel}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">Amount</span>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <span style="color: #10b981; font-size: 18px; font-weight: 700;">${formattedAmount}/month</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">Status</span>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <span style="background: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">Active</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Next Steps -->
                <h3 style="margin: 32px 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">What's Next?</h3>
                
                <div style="margin: 0 0 24px 0;">
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #10b981; border-radius: 50%; margin-right: 12px; text-align: center; line-height: 28px;">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 600;">✓</span>
                    </div>
                    <span style="font-size: 15px; color: #9ca3af; padding-top: 4px; text-decoration: line-through;">Complete payment</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #667eea; border-radius: 50%; margin-right: 12px; text-align: center; line-height: 28px;">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 600;">2</span>
                    </div>
                    <span style="font-size: 15px; color: #1f2937; padding-top: 4px;">Sign the service agreement</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #667eea; border-radius: 50%; margin-right: 12px; text-align: center; line-height: 28px;">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 600;">3</span>
                    </div>
                    <span style="font-size: 15px; color: #1f2937; padding-top: 4px;">Complete your onboarding questionnaires</span>
                  </div>
                  <div style="display: flex; align-items: flex-start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #667eea; border-radius: 50%; margin-right: 12px; text-align: center; line-height: 28px;">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 600;">4</span>
                    </div>
                    <span style="font-size: 15px; color: #1f2937; padding-top: 4px;">We start building your automations!</span>
                  </div>
                </div>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 24px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- Info Box -->
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>💡 Tip:</strong> Log in to your dashboard to sign your contract and complete onboarding. Our team will start working on your automations as soon as you're done!
                  </p>
                </div>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9ca3af;">
                Questions? Reply to this email or contact us at
              </p>
              <a href="mailto:teamsienvi@gmail.com" style="color: #667eea; text-decoration: none; font-size: 14px;">teamsienvi@gmail.com</a>
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Sienvi. All rights reserved.
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

    console.log("Payment confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment confirmation email sent",
        emailId: emailResponse.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending payment confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
