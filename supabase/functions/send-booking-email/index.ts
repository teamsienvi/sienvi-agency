import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: BookingEmailRequest = await req.json();

    // Send notification email to team (internal, simple format is fine)
    const emailResponse = await resend.emails.send({
      from: "Sienvi Website <noreply@sienvi.com>",
      to: ["teamsienvi@gmail.com", "sienvifba@gmail.com"],
      subject: `Strategy Call Request from ${name}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 3px solid #667eea;">
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937;">New Strategy Call Request</h1>
              </div>
              
              <div style="padding: 28px 32px 32px 32px;">
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px 0;">
                  <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Name</span>
                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #1f2937; font-weight: 500;">${name}</p>
                  </div>
                  <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #1f2937;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
                  </div>
                  <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Phone</span>
                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #1f2937;">${phone || "Not provided"}</p>
                  </div>
                  <div style="padding: 8px 0;">
                    <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Message</span>
                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #1f2937; line-height: 1.5;">${message}</p>
                  </div>
                </div>
                
                <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                  Submitted from the Sienvi website contact form
                </p>
              </div>
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
