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
  advertising: "Advertising",
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

    const primaryEmail = clientEmail.split(/[,;]/)[0].trim().toLowerCase();
    let additionalEmails: string[] = [];

    const { data: profile } = clientId
      ? await supabaseAdmin
          .from("client_profiles")
          .select("notes")
          .eq("id", clientId)
          .maybeSingle()
      : await supabaseAdmin
          .from("client_profiles")
          .select("notes")
          .eq("email", primaryEmail)
          .maybeSingle();

    if (profile?.notes) {
      additionalEmails = parseAdditionalEmails(profile.notes);
    }

    const displayName = clientName || primaryEmail.split("@")[0];
    const planLabel = planLabels[plan] || plan || "Sienvi Plan";
    const planPrice = price || planPrices[plan] || 0;

    const recipients = [...new Set([primaryEmail, ...additionalEmails])];

    const emailResponse = await resend.emails.send({
      from: "Sienvi <info@sienvi.com>",
      to: recipients,
      subject: "Complete Your Subscription",
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
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">Complete Your Subscription</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">You're one step away from getting started</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Thank you for choosing Sienvi. Complete your payment below to activate your subscription and begin your automation journey.
                </p>
                
                <!-- Plan Details -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 13px; color: #6b7280; padding: 8px 0;" align="left">Plan</td>
                      <td style="font-size: 13px; font-weight: 500; color: #1f2937; padding: 8px 0;" align="right">${planLabel}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="border-top: 1px solid #e2e8f0;"></td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #6b7280; padding: 8px 0;" align="left">Monthly</td>
                      <td style="font-size: 13px; font-weight: 600; color: #667eea; padding: 8px 0;" align="right">$${planPrice.toLocaleString()}/mo</td>
                    </tr>
                  </table>
                </div>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 24px 0 8px 0;">
                      <a href="${checkoutUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                        Complete Payment
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- Tip -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 20px 0 0 0;">
                  <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    Your payment is securely processed by Stripe. After completing payment, you'll sign your service agreement and complete onboarding.
                  </p>
                </div>
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

    console.log("Checkout email sent to:", recipients, "Response:", emailResponse);

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
