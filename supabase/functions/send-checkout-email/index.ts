import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutEmailRequest {
  clientId: string;
  clientEmail: string;
  clientName?: string;
  checkoutUrl: string;
  plan: string;
  price?: number;
}

const planLabels: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Automation",
  full: "Full Automation Suite",
  custom: "Custom Plan",
};

const planPrices: Record<string, number> = {
  single: 888,
  triple: 2398.20,
  full: 3996,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { clientId, clientEmail, clientName, checkoutUrl, plan, price }: CheckoutEmailRequest = await req.json();

    if (!clientEmail || !checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "Client email and checkout URL are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const displayName = clientName || clientEmail.split("@")[0];
    const planLabel = planLabels[plan] || plan || "Sienvi Plan";
    const planPrice = price || planPrices[plan] || 0;

    const emailResponse = await resend.emails.send({
      from: "Sienvi <noreply@sienvi.com>",
      to: [clientEmail],
      subject: "Complete Your Sienvi Subscription 🚀",
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
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Complete Your Subscription</h1>
                <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">You're one step away from automation</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 48px;">
                <p style="margin: 0 0 24px 0; font-size: 17px; color: #374151;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 28px 0; font-size: 17px; color: #374151;">
                  Thank you for choosing Sienvi! Complete your secure payment below to unlock the full power of automation for your business.
                </p>
                
                <!-- Plan Details Card -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; margin: 28px 0; border: 1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Plan</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="font-size: 20px; font-weight: 700; color: #1e293b;">${planLabel}</span>
                            </td>
                            <td align="right">
                              <span style="font-size: 24px; font-weight: 800; color: #667eea;">$${planPrice.toLocaleString()}<span style="font-size: 14px; font-weight: 500; color: #94a3b8;">/mo</span></span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 28px 0;">
                      <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 56px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);">
                        Complete Payment
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- Security Note -->
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    🔒 Secure checkout powered by Stripe. Your payment information is encrypted and protected.
                  </p>
                </div>
                
                <!-- What Happens Next -->
                <h3 style="margin: 36px 0 20px 0; font-size: 18px; font-weight: 700; color: #1e293b;">What happens next?</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 40px;">
                      <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 13px; font-weight: 600;">1</div>
                    </td>
                    <td style="padding: 10px 0; color: #374151; font-size: 15px;">Complete your secure payment</td>
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

    console.log("Checkout email sent to:", clientEmail, "Response:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Checkout email sent successfully",
        emailId: emailResponse.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending checkout email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
