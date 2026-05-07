import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginInviteRequest {
  clientId: string;
  clientEmail: string;
  clientName?: string;
}

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

    const { clientId, clientEmail, clientName }: LoginInviteRequest = await req.json();

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ error: "Client email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let clientStatus = {
      subscriptionStatus: "pending_payment",
      contractStatus: "not_signed",
      onboardingStatus: "not_started",
    };

    if (clientId) {
      const { data: profile } = await supabaseAdmin
        .from("client_profiles")
        .select("subscription_status, contract_status, onboarding_status")
        .eq("id", clientId)
        .single();

      if (profile) {
        clientStatus = {
          subscriptionStatus: profile.subscription_status,
          contractStatus: profile.contract_status,
          onboardingStatus: profile.onboarding_status,
        };
      }
    }

    const baseUrl = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";
    let redirectPath = "/dashboard";
    let actionMessage = "Access Dashboard";
    let emailSubject = "Your Login Link";
    let headerTitle = "Access Your Dashboard";
    let emailIntro = "Use the button below to securely access your Sienvi dashboard.";
    let tipText = "";

    // Check if user already exists in auth without fetching all users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === clientEmail.toLowerCase());
    const isNewUser = !existingAuthUser;

    if (isNewUser) {
      redirectPath = "/login?setup=password";
      actionMessage = "Set Your Password";
      emailSubject = "Welcome to Sienvi";
      headerTitle = "Welcome to Sienvi";
      emailIntro = "Your account has been created. Set up your password to get started.";
      tipText = "After clicking the link, you'll create a password for easier future logins.";
    } else if (clientStatus.subscriptionStatus === "pending_payment") {
      tipText = "Complete your payment to unlock all features.";
    } else if (clientStatus.subscriptionStatus === "active" && clientStatus.contractStatus === "not_signed") {
      redirectPath = "/contract";
      actionMessage = "Sign Agreement";
      tipText = "Your next step is to review and sign the service agreement.";
    } else if (clientStatus.contractStatus === "signed" && clientStatus.onboardingStatus !== "completed") {
      redirectPath = "/onboarding";
      actionMessage = "Continue Setup";
      tipText = "Complete your onboarding to help us get started on your automations.";
    }

    // Use 'invite' for brand new users (creates auth account), 'magiclink' for existing
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: isNewUser ? "invite" : "magiclink",
      email: clientEmail,
      options: {
        redirectTo: `${baseUrl}${redirectPath}`,
      },
    });

    if (linkError) {
      console.error("Error generating magic link:", linkError);
      throw new Error("Failed to generate login link");
    }

    const loginUrl = linkData.properties?.action_link || "";
    const displayName = clientName || clientEmail.split("@")[0];

    const emailResponse = await resend.emails.send({
      from: "Sienvi <info@sienvi.com>",
      to: [clientEmail],
      subject: emailSubject,
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
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">${headerTitle}</h1>
              </div>
              
              <!-- Body -->
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  ${emailIntro}
                </p>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 24px 0 8px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                        ${actionMessage}
                      </a>
                    </td>
                  </tr>
                </table>
                
                ${tipText ? `
                <!-- Tip -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 20px 0 0 0;">
                  <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    ${tipText}
                  </p>
                </div>
                ` : ''}
                
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
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

    // Resend v2 returns { data, error } — check for failure
    const resendError = (emailResponse as any).error;
    if (resendError) {
      console.error("Resend rejected the email:", JSON.stringify(resendError));
      throw new Error(`Email delivery failed: ${resendError.message || JSON.stringify(resendError)}`);
    }

    const emailId = (emailResponse as any).data?.id || (emailResponse as any).id || null;

    console.log("Login invite sent to:", clientEmail, "emailId:", emailId, "Redirect:", redirectPath);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Login invite sent successfully",
        emailId,
        redirectPath,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending login invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
