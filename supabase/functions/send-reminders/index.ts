import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Days after account creation to send reminders
const REMINDER_DAYS = [2, 4, 7];

interface ClientProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  plan: string | null;
  subscription_status: string;
  contract_status: string;
  onboarding_status: string;
  created_at: string;
}

interface EmailReminder {
  client_profile_id: string;
  reminder_day: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Allow both cron (no auth) and manual admin invokes
    const authHeader = req.headers.get("Authorization");
    const isManualInvoke = !!authHeader;

    // If manually invoked by admin, verify they have admin role
    if (isManualInvoke) {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
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
      }
    }

    const now = new Date();
    const results: { email: string; day: number; type: string; status: string }[] = [];

    // Fetch all clients who still need to complete contract or onboarding
    // Excludes advertising plan (they skip contract/onboarding)
    const { data: clients, error: clientsError } = await supabase
      .from("client_profiles")
      .select("id, email, first_name, last_name, plan, subscription_status, contract_status, onboarding_status, created_at")
      .eq("subscription_status", "active")
      .neq("plan", "advertising")
      .neq("onboarding_status", "completed");

    if (clientsError) throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    if (!clients || clients.length === 0) {
      console.log("No pending clients found.");
      return new Response(
        JSON.stringify({ success: true, message: "No pending clients", sent: 0, results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${clients.length} pending clients to check.`);

    // Fetch already-sent reminders for these clients
    const clientIds = clients.map((c: ClientProfile) => c.id);
    const { data: sentReminders } = await supabase
      .from("email_reminders")
      .select("client_profile_id, reminder_day")
      .in("client_profile_id", clientIds);

    const sentSet = new Set(
      (sentReminders || []).map((r: EmailReminder) => `${r.client_profile_id}:${r.reminder_day}`)
    );

    // Fetch auth users to check if client exists in auth (for magic link vs invite)
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    let sentCount = 0;

    for (const client of clients as ClientProfile[]) {
      const createdAt = new Date(client.created_at);
      const daysSinceCreation = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (const reminderDay of REMINDER_DAYS) {
        const key = `${client.id}:${reminderDay}`;

        // Only send if:
        // 1. We've passed the reminder day threshold
        // 2. We haven't already sent this reminder
        // 3. Client is at or past the day window (within 1-day window per reminder)
        if (daysSinceCreation < reminderDay) continue;
        if (daysSinceCreation >= reminderDay + 1 && !isManualInvoke) continue; // only send on the exact day (cron) — skip for manual
        if (sentSet.has(key)) continue;

        // Determine what step they're stuck on
        const needsContract = client.contract_status === "not_signed";
        const needsOnboarding = !needsContract && client.onboarding_status !== "completed";

        if (!needsContract && !needsOnboarding) continue;

        const emailType = needsContract ? "contract" : "onboarding";
        const redirectPath = needsContract ? "/contract" : "/onboarding";
        const displayName = client.first_name || client.email.split("@")[0];

        // Check if client exists in auth
        const existingAuthUser = authUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === client.email.toLowerCase()
        );
        const linkType = existingAuthUser ? "magiclink" : "invite";

        // Generate magic link
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: linkType,
          email: client.email,
          options: {
            redirectTo: `https://sienvi.com${redirectPath}`,
          },
        });

        if (linkError) {
          console.error(`Failed to generate link for ${client.email}:`, linkError.message);
          results.push({ email: client.email, day: reminderDay, type: emailType, status: `failed: ${linkError.message}` });
          continue;
        }

        const loginUrl = linkData.properties?.action_link || "";

        // Build email content based on day + type
        const emailContent = buildReminderEmail({
          displayName,
          reminderDay,
          emailType,
          loginUrl,
          contractStatus: client.contract_status,
          onboardingStatus: client.onboarding_status,
        });

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Sienvi <info@sienvi.com>",
          to: [client.email],
          bcc: ["info@sienvi.com"], // Keep team notified
          subject: emailContent.subject,
          html: emailContent.html,
        });

        const resendError = (emailResponse as any).error;
        if (resendError) {
          console.error(`Resend error for ${client.email}:`, resendError);
          results.push({ email: client.email, day: reminderDay, type: emailType, status: `failed: ${resendError.message}` });
          continue;
        }

        // Log to email_reminders to prevent future duplicates
        await supabase.from("email_reminders").insert({
          client_profile_id: client.id,
          reminder_day: reminderDay,
          email_type: emailType,
        });

        sentSet.add(key); // Update local set to prevent double-sending in same run
        sentCount++;
        results.push({ email: client.email, day: reminderDay, type: emailType, status: "sent" });
        console.log(`Sent Day ${reminderDay} ${emailType} reminder to ${client.email}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Email Builder ────────────────────────────────────────────────────────────

function buildReminderEmail(opts: {
  displayName: string;
  reminderDay: number;
  emailType: "contract" | "onboarding";
  loginUrl: string;
  contractStatus: string;
  onboardingStatus: string;
}): { subject: string; html: string } {
  const { displayName, reminderDay, emailType, loginUrl } = opts;

  const isContract = emailType === "contract";
  const isUrgent = reminderDay === 7;

  const accentColor = isContract ? "#667eea" : "#8b5cf6";
  const stepIcon = isContract ? "📋" : "✍️";

  const subjects: Record<string, Record<number, string>> = {
    contract: {
      2: "Quick reminder: your service agreement is waiting",
      4: "Your Sienvi contract is still unsigned",
      7: "Final reminder — please sign your agreement",
    },
    onboarding: {
      2: "One step left: complete your onboarding questions",
      4: "Reminder: your onboarding questionnaire is waiting",
      7: "Last reminder — finish your onboarding to get started",
    },
  };

  const intros: Record<string, Record<number, string>> = {
    contract: {
      2: `We noticed you haven't had a chance to sign your service agreement yet. It only takes a minute — just click below to review and sign.`,
      4: `Your Sienvi service agreement is still waiting for your signature. Once signed, we can move forward with your onboarding and start building your automations.`,
      7: `This is our final reminder that your service agreement hasn't been signed yet. Please take a moment to complete this step so we can get your project started.`,
    },
    onboarding: {
      2: `You're one step away! Your onboarding questionnaire is ready to fill out. It helps our team understand your business so we can build exactly what you need.`,
      4: `Your onboarding questions are still waiting to be completed. This is an important step that helps us personalize your automations and get started right away.`,
      7: `This is our final reminder to complete your onboarding questions. Once done, our team can immediately begin working on your custom automations.`,
    },
  };

  const ctaText = isContract ? "Sign Agreement Now" : "Complete Onboarding";
  const stepLabel = isContract ? "Sign your service agreement" : "Complete your onboarding questionnaire";
  const timeEstimate = isContract ? "Takes less than 5 minutes" : "Takes 15–20 minutes";

  const urgencyBanner = isUrgent
    ? `<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin: 0 0 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">
          ⏰ This is our last automated reminder. If you need help or have questions, please reply to this email.
        </p>
       </div>`
    : "";

  const subject = subjects[emailType][reminderDay] || `Reminder from Sienvi — action needed`;
  const intro = intros[emailType][reminderDay] || "";

  const html = `
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
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 3px solid ${accentColor};">
              <!-- Header -->
              <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <div style="font-size: 32px; margin-bottom: 12px;">${stepIcon}</div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937; letter-spacing: -0.3px;">
                  ${isContract ? "Action Needed: Sign Your Agreement" : "Action Needed: Complete Onboarding"}
                </h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #9ca3af;">Reminder ${reminderDay === 2 ? "1" : reminderDay === 4 ? "2" : "3"} of 3</p>
              </div>

              <!-- Body -->
              <div style="padding: 28px 32px 32px 32px;">
                ${urgencyBanner}

                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Hi ${displayName},</p>

                <p style="margin: 0 0 20px 0; font-size: 15px; color: #6b7280; line-height: 1.7;">
                  ${intro}
                </p>

                <!-- Step Card -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: ${accentColor}; text-transform: uppercase; letter-spacing: 0.5px;">Next Step</p>
                  <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${stepLabel}</p>
                  <p style="margin: 0; font-size: 13px; color: #9ca3af;">${timeEstimate}</p>
                </div>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 8px 0 8px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: ${accentColor}; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        ${ctaText} →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                  This link is valid for 24 hours. If you have any trouble, contact us at <a href="mailto:info@sienvi.com" style="color: ${accentColor}; text-decoration: none;">info@sienvi.com</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                Questions? Contact <a href="mailto:info@sienvi.com" style="color: ${accentColor}; text-decoration: none;">info@sienvi.com</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">
                © 2025 Sienvi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
