import { SESClient, SendEmailCommand } from "npm:@aws-sdk/client-ses@3.693.0";

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResponse {
  data: { id: string } | null;
  error: { message: string } | null;
}

/**
 * Normalizes email address to use the verified SES sender email while preserving display name.
 */
function resolveFromAddress(customFrom?: string): string {
  const defaultSenderEmail = Deno.env.get("AWS_SES_FROM_EMAIL") || "sender@sienvi.com";
  
  if (!customFrom) {
    return `Sienvi <${defaultSenderEmail}>`;
  }

  // If customFrom contains a display name like "Sienvi Admin <info@sienvi.com>"
  const match = customFrom.match(/^([^<]+)<([^>]+)>$/);
  if (match) {
    const displayName = match[1].trim();
    return `${displayName} <${defaultSenderEmail}>`;
  }

  // If customFrom is just an email, use default display name
  if (customFrom.includes("@") && !customFrom.includes("<")) {
    return `Sienvi <${defaultSenderEmail}>`;
  }

  return customFrom;
}

/**
 * Returns an instance of SESClient configured via Supabase Edge Function Secrets.
 */
export function getSesClient(): SESClient {
  const region = Deno.env.get("AWS_REGION") || "us-east-1";
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials missing. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Supabase secrets.");
  }

  return new SESClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Sends an email via Amazon SES.
 * Provides a standardized response matching { data: { id }, error: null }.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    const client = getSesClient();

    const toAddresses = (Array.isArray(options.to) ? options.to : [options.to])
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes("@"));

    if (toAddresses.length === 0) {
      return {
        data: null,
        error: { message: "No valid recipient email address provided." },
      };
    }

    const bccAddresses = options.bcc
      ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc])
          .map(e => e.trim().toLowerCase())
          .filter(e => e.length > 0 && e.includes("@"))
      : undefined;

    const replyToAddresses = options.replyTo
      ? (Array.isArray(options.replyTo) ? options.replyTo : [options.replyTo])
          .map(e => e.trim().toLowerCase())
          .filter(e => e.length > 0 && e.includes("@"))
      : undefined;

    const source = resolveFromAddress(options.from);
    const configurationSetName = Deno.env.get("AWS_SES_CONFIGURATION_SET") || undefined;

    const command = new SendEmailCommand({
      Source: source,
      Destination: {
        ToAddresses: toAddresses,
        BccAddresses: bccAddresses && bccAddresses.length > 0 ? bccAddresses : undefined,
      },
      ReplyToAddresses: replyToAddresses && replyToAddresses.length > 0 ? replyToAddresses : undefined,
      ConfigurationSetName: configurationSetName,
      Message: {
        Subject: {
          Data: options.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: "UTF-8",
          },
          ...(options.text
            ? {
                Text: {
                  Data: options.text,
                  Charset: "UTF-8",
                },
              }
            : {}),
        },
      },
    });

    const response = await client.send(command);

    console.log(`[Amazon SES] Email sent successfully. MessageId: ${response.MessageId} to ${toAddresses.join(", ")}`);

    return {
      data: { id: response.MessageId || "ses_sent" },
      error: null,
    };
  } catch (err: any) {
    console.error("[Amazon SES] Send failure:", err);
    return {
      data: null,
      error: { message: err?.message || "Failed to send email via Amazon SES" },
    };
  }
}
