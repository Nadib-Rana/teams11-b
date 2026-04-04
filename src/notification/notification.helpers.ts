import type {
  NotificationTemplateContext,
  TwilioClient,
  TwilioFactory,
} from "./notification.types";

export function renderNotificationTemplate(
  subject: string,
  body: string,
  context: NotificationTemplateContext = {},
) {
  let renderedSubject = subject;
  let renderedBody = body;

  for (const [key, value] of Object.entries(context)) {
    const safeValue =
      value === null || value === undefined ? "" : String(value);
    const regex = new RegExp(`{{${key}}}`, "g");
    renderedSubject = renderedSubject.replace(regex, safeValue);
    renderedBody = renderedBody.replace(regex, safeValue);
  }

  return { subject: renderedSubject, body: renderedBody };
}

export async function getTwilioClient(): Promise<TwilioClient> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio SMS cannot be sent because TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not configured.",
    );
  }

  const twilioModule = await import("twilio");
  const twilioFactory = (twilioModule.default ?? twilioModule) as TwilioFactory;
  return twilioFactory(accountSid, authToken);
}

export async function sendSmsViaTwilio(userPhone: string, message: string) {
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioFrom) {
    throw new Error(
      "Twilio SMS cannot be sent because TWILIO_PHONE_NUMBER is not configured.",
    );
  }

  const twilioClient = await getTwilioClient();

  await twilioClient.messages.create({
    body: message,
    from: twilioFrom,
    to: userPhone,
  });
}
