import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { requireAdmin } from "../_shared/require-admin.ts";
import { sendEmail } from "../_shared/ses-client.ts";

const INTERNAL_CC_EMAILS = [
  "teamsienvi@gmail.com",
  "info@sienvi.com",
  "sienvifba@gmail.com",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const denied = await requireAdmin(req, corsHeaders);
    if (denied) return denied;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.json();
    const { action, targetCustomerId, subscriptionId, paymentMethodId, fromCustomerId, toCustomerId } = body;

    if (action === "check-subs") {
      const subs = await stripe.subscriptions.list({ customer: targetCustomerId, limit: 100 });
      const pms = await stripe.paymentMethods.list({ customer: targetCustomerId, type: "card" });
      const customer = await stripe.customers.retrieve(targetCustomerId);
      return new Response(JSON.stringify({ 
        customer: {
          id: targetCustomerId,
          default_source: (customer as any).default_source,
          invoice_settings_default_pm: (customer as any).invoice_settings?.default_payment_method,
        },
        paymentMethods: pms.data.map(pm => ({
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          exp: `${pm.card?.exp_month}/${pm.card?.exp_year}`,
        })),
        subscriptions: subs.data.map(s => ({
          id: s.id,
          status: s.status,
          default_payment_method: s.default_payment_method,
          items: s.items.data.map(i => ({
            priceId: i.price.id,
            amount: i.price.unit_amount,
            interval: i.price.recurring?.interval,
          })),
          current_period_end: new Date(s.current_period_end * 1000).toISOString(),
          trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
        })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "attach-pm") {
      // Attach a payment method from one customer to another
      const pms = await stripe.paymentMethods.list({ customer: fromCustomerId, type: "card" });
      const results = [];
      for (const pm of pms.data) {
        try {
          await stripe.paymentMethods.detach(pm.id);
          await stripe.paymentMethods.attach(pm.id, { customer: toCustomerId });
          results.push({ id: pm.id, last4: pm.card?.last4, status: "moved" });
        } catch (e: any) {
          results.push({ id: pm.id, last4: pm.card?.last4, status: "error", error: e.message });
        }
      }
      return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "set-sub-pm") {
      // Set default payment method on a subscription
      const updated = await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      });
      return new Response(JSON.stringify({ 
        success: true, 
        subscriptionId,
        default_payment_method: updated.default_payment_method,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "set-trial-end") {
      const { trialEnd } = body;
      const updated = await stripe.subscriptions.update(subscriptionId, {
        trial_end: trialEnd,
        proration_behavior: "none",
      });
      return new Response(JSON.stringify({ 
        success: true, 
        subscriptionId,
        trial_end: updated.trial_end ? new Date(updated.trial_end * 1000).toISOString() : null,
        status: updated.status,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create-one-time-invoice") {
      const {
        clientId,
        clientEmail,
        clientName,
        companyName,
        serviceId,
        title,
        subtitle,
        description,
        amount,
        regularFee,
        daysUntilDue = 7,
        scopeHighlights = [],
        deliverables = [],
        proposalUrl,
        proposalName,
        sendEmailToClient = true,
      } = body;

      if (!targetCustomerId || !clientId || !amount || !description) {
        return new Response(
          JSON.stringify({ error: "targetCustomerId, clientId, amount, and description are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );

      // 1. Create a standalone draft invoice (excluding any unrelated pending items)
      const draftInvoice = await stripe.invoices.create({
        customer: targetCustomerId,
        collection_method: "send_invoice",
        days_until_due: daysUntilDue,
        pending_invoice_items_behavior: "exclude",
        description: title || description,
        metadata: {
          client_id: clientId,
          service_id: serviceId || "custom-one-time",
          is_one_time: "true",
          ...(proposalUrl ? { proposal_url: proposalUrl } : {}),
        },
      });

      // 2. Attach the one-time line item directly to this invoice
      await stripe.invoiceItems.create({
        customer: targetCustomerId,
        invoice: draftInvoice.id,
        amount: Math.round(Number(amount) * 100),
        currency: "usd",
        description,
      });

      // 3. Finalize invoice to generate permanent hosted_invoice_url and PDF
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(draftInvoice.id);
      const hostedInvoiceUrl = finalizedInvoice.hosted_invoice_url;
      const invoicePdfUrl = finalizedInvoice.invoice_pdf;
      const dueDateIso = finalizedInvoice.due_date
        ? new Date(finalizedInvoice.due_date * 1000).toISOString()
        : new Date(Date.now() + daysUntilDue * 86400000).toISOString();

      // 4. Record in public.client_one_time_payments
      const { data: otpRow, error: otpErr } = await supabaseAdmin
        .from("client_one_time_payments")
        .insert({
          client_profile_id: clientId,
          service_id: serviceId || "app-testing-pilot",
          description: title || description,
          amount: Number(amount),
          currency: "usd",
          status: finalizedInvoice.status || "open",
          stripe_invoice_id: finalizedInvoice.id,
          stripe_customer_id: targetCustomerId,
          hosted_invoice_url: hostedInvoiceUrl,
          due_date: dueDateIso,
        })
        .select()
        .single();

      if (otpErr) {
        console.error("Failed to insert client_one_time_payments row:", otpErr);
      }

      // 5. Send branded payment link email via Amazon SES if requested
      let emailResult: any = null;
      if (sendEmailToClient && clientEmail && hostedInvoiceUrl) {
        const displayName = clientName || "there";
        const displayTitle = title || description;
        const displaySubtitle = subtitle || "Billionaire Beta Tester — A SIENVI Testing Program";
        const formattedAmount = `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const formattedDueDate = new Date(dueDateIso).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        const highlightsHtml = Array.isArray(scopeHighlights) && scopeHighlights.length > 0
          ? `
            <div style="margin: 20px 0; padding: 16px 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #475569;">Program Scope & Highlights</p>
              <ul style="margin: 0; padding: 0 0 0 18px; color: #334155; font-size: 13px; line-height: 1.6;">
                ${scopeHighlights.map((item: string) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}
              </ul>
            </div>`
          : "";

        const deliverablesHtml = Array.isArray(deliverables) && deliverables.length > 0
          ? `
            <div style="margin: 20px 0; padding: 16px 20px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #166534;">What ${companyName || "You"} Receive</p>
              <ul style="margin: 0; padding: 0 0 0 18px; color: #1e293b; font-size: 13px; line-height: 1.6;">
                ${deliverables.map((item: string) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}
              </ul>
            </div>`
          : "";

        const proposalLinkHtml = proposalUrl
          ? `
            <div style="margin-top: 14px; text-align: center;">
              <a href="${proposalUrl}" style="font-size: 13px; color: #2563eb; text-decoration: underline; font-weight: 500;">
                📄 View Approved Proposal: ${proposalName || displayTitle} (PDF)
              </a>
            </div>`
          : "";

        const emailSendRes = await sendEmail({
          from: "Sienvi <info@sienvi.com>",
          to: [clientEmail],
          cc: INTERNAL_CC_EMAILS,
          subject: `Payment Link: ${displayTitle} (${formattedAmount} USD)`,
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
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border-top: 4px solid #166534;">
              <!-- Header -->
              <div style="padding: 32px 32px 22px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #166534;">${displaySubtitle}</p>
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">${displayTitle}</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">Prepared for ${displayName}${companyName ? ` · ${companyName}` : ""}</p>
              </div>

              <!-- Body -->
              <div style="padding: 28px 32px 32px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b;">Hi ${displayName},</p>

                <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                  Here is your separate payment link for the <strong>${displayTitle}</strong> based on the approved proposal. This is a standalone one-time payment and does not affect your existing recurring subscriptions.
                </p>

                <!-- Invoice Summary Box -->
                <div style="background: #f8fafc; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 13px; color: #64748b; padding: 6px 0;" align="left">Program / Engagement</td>
                      <td style="font-size: 13px; font-weight: 600; color: #0f172a; padding: 6px 0;" align="right">${displayTitle}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #64748b; padding: 6px 0;" align="left">Billing Type</td>
                      <td style="font-size: 13px; font-weight: 500; color: #334155; padding: 6px 0;" align="right">One-Time Partner Pilot Fee${regularFee ? ` <span style="color:#94a3b8;text-decoration:line-through;margin-left:4px;">$${Number(regularFee).toLocaleString()}</span>` : ""}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #64748b; padding: 6px 0;" align="left">Due Date</td>
                      <td style="font-size: 13px; font-weight: 500; color: #334155; padding: 6px 0;" align="right">${formattedDueDate}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;"></td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; font-weight: 600; color: #0f172a; padding: 6px 0;" align="left">Total Amount Due</td>
                      <td style="font-size: 18px; font-weight: 700; color: #166534; padding: 6px 0;" align="right">${formattedAmount} USD</td>
                    </tr>
                  </table>
                </div>

                ${highlightsHtml}
                ${deliverablesHtml}

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 20px 0 8px 0;">
                      <a href="${hostedInvoiceUrl}" style="display: inline-block; background: #166534; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                        Complete Payment (${formattedAmount} USD) →
                      </a>
                    </td>
                  </tr>
                </table>

                ${proposalLinkHtml}

                <!-- Security Note -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 24px 0 0 0;">
                  <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                    Your payment is securely processed by Stripe. You can pay using your card on file or a new payment method, and download your PDF invoice & receipt directly from the payment page.
                  </p>
                </div>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #94a3b8;">
                Questions? Contact <a href="mailto:info@sienvi.com" style="color: #166534; text-decoration: none;">info@sienvi.com</a> or <a href="mailto:teamsienvi@gmail.com" style="color: #166534; text-decoration: none;">teamsienvi@gmail.com</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
                © 2015–2026 Sienvi Agency. All rights reserved.
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

        emailResult = emailSendRes;
      }

      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: finalizedInvoice.id,
          invoiceNumber: finalizedInvoice.number,
          status: finalizedInvoice.status,
          amount: Number(amount),
          hostedInvoiceUrl,
          invoicePdfUrl,
          dueDate: dueDateIso,
          oneTimePaymentRecord: otpRow,
          emailResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
