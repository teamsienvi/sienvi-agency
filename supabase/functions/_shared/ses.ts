import { SESClient, SendEmailCommand } from "npm:@aws-sdk/client-ses@3.693.0";

const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  bcc?: string | string[];
  cc?: string | string[];
  replyTo?: string | string[];
  reply_to?: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  data: { id: string } | null;
  error: { message: string } | null;
}

/**
 * Send an email via Amazon SES
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const sesClient = new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined;
    const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined;
    const replyTo = options.replyTo || options.reply_to;
    const replyToAddresses = replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : undefined;

    const from = options.from || "Sienvi <info@sienvi.com>";

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: toAddresses,
        ...(ccAddresses ? { CcAddresses: ccAddresses } : {}),
        ...(bccAddresses ? { BccAddresses: bccAddresses } : {}),
      },
      ...(replyToAddresses ? { ReplyToAddresses: replyToAddresses } : {}),
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
          ...(options.text ? { Text: { Data: options.text, Charset: "UTF-8" } } : {}),
        },
      },
    });

    const response = await sesClient.send(command);
    return { data: { id: response.MessageId || "sent" }, error: null };
  } catch (error: any) {
    console.error("AWS SES send error:", error);
    return { data: null, error: { message: error.message || "Failed to send email via Amazon SES" } };
  }
}
