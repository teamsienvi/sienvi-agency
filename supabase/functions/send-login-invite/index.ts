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
    let emailIntro = "Your account has been created! Click the button below to access your dashboard:";

    // First-time users should set up their password
    // Check if user already exists in auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === clientEmail.toLowerCase());
    const isNewUser = !existingAuthUser;

    if (isNewUser) {
      // New user - redirect to set password
      redirectPath = "/login?setup=password";
      actionMessage = "Set Your Password";
      emailSubject = "Welcome to Sienvi - Set Up Your Account";
      emailIntro = "Your client account has been created! Click the button below to set your password and access your dashboard:";
    } else if (clientStatus.subscriptionStatus === "pending_payment") {
      redirectPath = "/dashboard";
      actionMessage = "View Payment Status";
    } else if (clientStatus.subscriptionStatus === "active" && clientStatus.contractStatus === "not_signed") {
      redirectPath = "/contract";
      actionMessage = "Sign Your Contract";
    } else if (clientStatus.contractStatus === "signed" && clientStatus.onboardingStatus !== "completed") {
      redirectPath = "/onboarding";
      actionMessage = "Complete Onboarding";
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

    // Send email via Resend
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
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Sienvi</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${displayName},</p>
            
            <p style="font-size: 16px;">${emailIntro}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                ${actionMessage}
              </a>
            </div>
            
            ${isNewUser ? `
            <p style="font-size: 14px; color: #666; background: #e8f4f8; padding: 15px; border-radius: 8px;">
              <strong>Tip:</strong> After clicking the link, you'll be able to set a password for easier future logins.
            </p>
            ` : ""}
            
            <p style="font-size: 14px; color: #666;">This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; margin: 0;">
              Need help? Reply to this email or contact us at teamsienvi@gmail.com
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2015 Sienvi. All rights reserved.</p>
          </div>
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
