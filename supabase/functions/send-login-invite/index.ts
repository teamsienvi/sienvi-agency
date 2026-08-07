import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is missing in Edge Function secrets");
    }

    const resend = new Resend(resendApiKey);

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

    const targetEmail = clientEmail.split(/[,;]/)[0].trim().toLowerCase();
    let additionalEmails: string[] = [];

    let clientStatus = {
      subscriptionStatus: "pending_payment",
      contractStatus: "not_signed",
      onboardingStatus: "not_started",
    };

    const { data: profile } = clientId
      ? await supabaseAdmin
          .from("client_profiles")
          .select("subscription_status, contract_status, onboarding_status, notes, plan")
          .eq("id", clientId)
          .maybeSingle()
      : await supabaseAdmin
          .from("client_profiles")
          .select("subscription_status, contract_status, onboarding_status, notes, plan")
          .eq("email", targetEmail)
          .maybeSingle();

    let clientPlan: string | null = null;

    if (profile) {
      clientStatus = {
        subscriptionStatus: profile.subscription_status,
        contractStatus: profile.contract_status,
        onboardingStatus: profile.onboarding_status,
      };
      additionalEmails = parseAdditionalEmails(profile.notes);
      clientPlan = profile.plan || null;
    }

    const isProspect = clientPlan === "prospect";

    const baseUrl = req.headers.get("origin") || "https://sienvi.com";
    let redirectPath = "/dashboard";
    let actionMessage = "Access Dashboard";
    let emailSubject = "Your Login Link";
    let headerTitle = "Access Your Dashboard";
    let emailIntro = "Use the button below to securely access your Sienvi dashboard.";
    let tipText = "";

    // Check if user already exists in auth without fetching all users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase());

    const hasSetPassword = !!existingAuthUser?.user_metadata?.password_set;
    const isNewUser = !existingAuthUser || !hasSetPassword;

    // Prospect-specific overrides — discovery-only flow, no contract or payment
    if (isProspect) {
      if (isNewUser) {
        redirectPath = "/login?setup=password";
        actionMessage = "Set Password & Start Discovery";
        emailSubject = "Welcome — Complete Your Discovery Questionnaire";
        headerTitle = "Let's Learn About Your Business";
        emailIntro = "We'd love to learn more about your business. Set up your password to access our discovery questionnaire — your answers help us understand your needs and craft a tailored proposal.";
        tipText = "After setting your password, you'll complete a short discovery questionnaire about your business.";
      } else {
        redirectPath = clientStatus.onboardingStatus === "completed" ? "/dashboard" : "/onboarding";
        actionMessage = clientStatus.onboardingStatus === "completed" ? "View Dashboard" : "Complete Discovery Questionnaire";
        emailSubject = clientStatus.onboardingStatus === "completed" ? "Your Sienvi Dashboard" : "Complete Your Discovery Questionnaire";
        headerTitle = clientStatus.onboardingStatus === "completed" ? "Your Dashboard" : "Discovery Questionnaire";
        emailIntro = clientStatus.onboardingStatus === "completed"
          ? "Access your Sienvi dashboard to view your discovery responses and any updates from our team."
          : "We'd love to learn more about your business. Complete our discovery questionnaire so we can prepare a tailored proposal for you.";
        tipText = clientStatus.onboardingStatus === "completed"
          ? "Our team is reviewing your responses and will reach out with a tailored proposal."
          : "The questionnaire takes about 15-20 minutes and helps us understand your business needs.";
      }
    } else if (isNewUser) {
      redirectPath = "/login?setup=password";
      actionMessage = "Set Password & Review Contract";
      emailSubject = "Welcome to Sienvi — Set Up Your Account";
      headerTitle = "Welcome to Sienvi";
      emailIntro = "Your account has been created. Set up your password to review your service agreement and activate your workspace.";
      tipText = "After setting your password, you'll review and sign your service agreement.";
    } else if (clientStatus.contractStatus === "not_signed") {
      redirectPath = "/contract";
      actionMessage = "Sign Service Agreement";
      emailSubject = "Sienvi Service Agreement";
      headerTitle = "Review & Sign Agreement";
      emailIntro = "Please review and sign your service agreement to proceed to payment.";
      tipText = "Your next step is to review and sign the service agreement.";
    } else if (clientStatus.subscriptionStatus === "pending_payment") {
      redirectPath = "/checkout-summary";
      actionMessage = "Complete Subscription Payment";
      emailSubject = "Complete Your Subscription";
      headerTitle = "Complete Your Subscription";
      emailIntro = "Agreement signed! Complete your payment to activate your workspace.";
      tipText = "Complete your payment to unlock full workspace features.";
    } else if (clientStatus.contractStatus === "signed" && clientStatus.onboardingStatus !== "completed") {
      redirectPath = "/onboarding";
      actionMessage = "Continue Onboarding";
      tipText = "Complete your onboarding to help us get started on your automations.";
    }

    // Try generating link with preferred type ('invite' for new users, 'magiclink' for existing).
    // If that fails (e.g. user already registered or user not found), fall back to opposite link type.
    let preferredLinkType: "invite" | "magiclink" = !existingAuthUser ? "invite" : "magiclink";
    let linkData: any = null;
    let linkError: any = null;

    const firstAttempt = await supabaseAdmin.auth.admin.generateLink({
      type: preferredLinkType,
      email: targetEmail,
      options: {
        redirectTo: `${baseUrl}${redirectPath}`,
      },
    });

    if (!firstAttempt.error && firstAttempt.data) {
      linkData = firstAttempt.data;
    } else {
      linkError = firstAttempt.error;
      console.warn(`generateLink (${preferredLinkType}) failed: ${linkError?.message || JSON.stringify(linkError)}. Trying fallback...`);
      
      const fallbackLinkType = preferredLinkType === "invite" ? "magiclink" : "invite";
      const fallbackAttempt = await supabaseAdmin.auth.admin.generateLink({
        type: fallbackLinkType,
        email: targetEmail,
        options: {
          redirectTo: `${baseUrl}${redirectPath}`,
        },
      });

      if (!fallbackAttempt.error && fallbackAttempt.data) {
        linkData = fallbackAttempt.data;
        linkError = null;
        console.log(`Fallback generateLink (${fallbackLinkType}) succeeded for ${targetEmail}`);
      } else {
        console.error(`Fallback generateLink (${fallbackLinkType}) also failed:`, fallbackAttempt.error);
        linkError = fallbackAttempt.error || linkError;
      }
    }

    if (linkError || !linkData) {
      const errorDetail = linkError?.message || JSON.stringify(linkError);
      console.error("Error generating login link:", linkError);
      throw new Error(`Failed to generate login link: ${errorDetail}`);
    }

    const loginUrl = linkData.properties?.action_link || "";
    if (!loginUrl) {
      throw new Error("Action link was not returned by Supabase Auth");
    }

    // Generate short code and save to client_profiles notes
    const shortCode = Math.random().toString(36).substring(2, 8);
    const shortUrl = `${baseUrl}/join?c=${shortCode}`;

    if (profile && (clientId || targetEmail)) {
      const existingNotes = profile.notes || "";
      // Remove previous MagicUrl tag if present
      const cleanedNotes = existingNotes.replace(/\[MagicUrl:[^\]]+\]/g, "").trim();
      const updatedNotes = `${cleanedNotes} [MagicUrl:${shortCode}:${redirectPath}]`.trim();

      const query = clientId
        ? supabaseAdmin.from("client_profiles").update({ notes: updatedNotes }).eq("id", clientId)
        : supabaseAdmin.from("client_profiles").update({ notes: updatedNotes }).eq("email", targetEmail);

      await query;
    }

    const displayName = clientName || targetEmail.split("@")[0];
    const recipients = [...new Set([targetEmail, ...additionalEmails])].filter(
      (email) => email && typeof email === "string" && email.includes("@")
    );

    let emailSent = false;
    let emailId = null;
    let emailError = null;

    if (resendApiKey && recipients.length > 0) {
      try {
        const resend = new Resend(resendApiKey);
        const emailResponse = await resend.emails.send({
          from: "Sienvi <info@sienvi.com>",
          to: recipients,
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
                
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">If you didn't request this, you can ignore this email.</p>
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

        const resErr = (emailResponse as any)?.error;
        if (!resErr) {
          emailSent = true;
          emailId = (emailResponse as any)?.data?.id || (emailResponse as any)?.id || null;
        } else {
          emailError = resErr.message || JSON.stringify(resErr);
          console.warn("Resend email delivery skipped (account issue):", emailError);
        }
      } catch (err: any) {
        emailError = err.message || String(err);
        console.warn("Resend email attempt caught error (bypassing email requirement):", emailError);
      }
    }

    console.log("Generated 1-Click Onboarding Link for:", targetEmail, "shortUrl:", shortUrl, "loginUrl:", loginUrl, "emailSent:", emailSent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: emailSent ? "Login invite sent via email" : "1-Click Onboarding Link generated!",
        loginUrl: shortUrl || loginUrl,
        rawUrl: loginUrl,
        shortUrl,
        emailSent,
        emailError,
        emailId,
        redirectPath,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("Error sending login invite:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

