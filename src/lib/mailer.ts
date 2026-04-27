/**
 * Thin email wrapper. Uses Resend when RESEND_API_KEY + MAIL_FROM are set;
 * otherwise logs to the server console so local dev never blocks on missing
 * mail credentials.
 */

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendMail(args: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.log("[mailer] no RESEND_API_KEY/MAIL_FROM, would have sent:", {
      to: args.to,
      subject: args.subject,
      text: args.text,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`);
  }
}
