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
  full: "Full Automation",
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
    const planLabel = planLabels[plan] || plan;
    const planPrice = price || planPrices[plan] || 0;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Sienvi <noreply@sienvi.com>",
      to: [clientEmail],
      subject: "Complete Your Sienvi Subscription",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Complete Your Subscription</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${displayName},</p>
            
            <p style="font-size: 16px;">You're one step away from unlocking the full power of Sienvi automation for your business.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">Your Plan Details</h3>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Plan:</strong> ${planLabel}</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Monthly Investment:</strong> $${planPrice.toLocaleString()}/month</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${checkoutUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">
                Complete Payment
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">This secure checkout is powered by Stripe. Your payment information is safe and encrypted.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <h3 style="margin: 0 0 15px 0;">What happens next?</h3>
            <ol style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Complete your secure payment</li>
              <li style="margin-bottom: 8px;">Sign the service agreement</li>
              <li style="margin-bottom: 8px;">Complete your onboarding questionnaires</li>
              <li style="margin-bottom: 8px;">Our team gets to work on your automation!</li>
            </ol>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; margin: 0;">
              Questions? Reply to this email or contact us at teamsienvi@gmail.com
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2015 Sienvi. All rights reserved.</p>
          </div>
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
