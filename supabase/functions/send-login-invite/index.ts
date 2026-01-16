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

    const { clientId, clientEmail, clientName }: LoginInviteRequest = await req.json();

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ error: "Client email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client profile to check their status
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

    // Determine redirect URL based on client status
    const baseUrl = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";
    let redirectPath = "/dashboard";
    let actionMessage = "Access Your Dashboard";
    let emailSubject = "Welcome to Sienvi - Your Login Link";
    let headerTitle = "Welcome to Sienvi";
    let headerSubtitle = "Your login link is ready";
    let emailIntro = "Your account has been created! Click the button below to access your dashboard:";
    let statusNote = "";

    // First-time users should set up their password
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === clientEmail.toLowerCase());
    const isNewUser = !existingAuthUser;

    if (isNewUser) {
      redirectPath = "/login?setup=password";
      actionMessage = "Set Your Password";
      emailSubject = "Welcome to Sienvi - Set Up Your Account";
      headerTitle = "Welcome to Sienvi";
      headerSubtitle = "Let's set up your account";
      emailIntro = "Your client account has been created! Click the button below to set your password and access your dashboard:";
      statusNote = "After clicking the link, you'll be able to set a password for easier future logins.";
    } else if (clientStatus.subscriptionStatus === "pending_payment") {
      redirectPath = "/dashboard";
      actionMessage = "View Payment Status";
      statusNote = "Complete your payment to unlock all features.";
    } else if (clientStatus.subscriptionStatus === "active" && clientStatus.contractStatus === "not_signed") {
      redirectPath = "/contract";
      actionMessage = "Sign Your Contract";
      headerSubtitle = "Your next step awaits";
      statusNote = "Your next step is to review and sign the service agreement.";
    } else if (clientStatus.contractStatus === "signed" && clientStatus.onboardingStatus !== "completed") {
      redirectPath = "/onboarding";
      actionMessage = "Complete Onboarding";
      headerSubtitle = "Almost there!";
      statusNote = "Complete your onboarding questionnaires so we can get started.";
    }

    // Generate a magic link for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
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
      from: "Sienvi <noreply@sienvi.com>",
      to: [clientEmail],
      subject: emailSubject,
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
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${headerTitle}</h1>
                <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">${headerSubtitle}</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 48px;">
                <p style="margin: 0 0 24px 0; font-size: 17px; color: #374151;">Hi ${displayName},</p>
                
                <p style="margin: 0 0 28px 0; font-size: 17px; color: #374151;">
                  ${emailIntro}
                </p>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 28px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 56px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);">
                        ${actionMessage}
                      </a>
                    </td>
                  </tr>
                </table>
                
                ${statusNote ? `
                <!-- Status Note -->
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>💡 Tip:</strong> ${statusNote}
                  </p>
                </div>
                ` : ""}
                
                <!-- Expiry Note -->
                <p style="font-size: 14px; color: #94a3b8; margin-top: 28px; text-align: center;">
                  This link will expire in 24 hours. If you didn't request this, please ignore this email.
                </p>
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

    console.log("Login invite sent to:", clientEmail, "Response:", emailResponse, "Redirect:", redirectPath);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Login invite sent successfully",
        emailId: emailResponse.id,
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
