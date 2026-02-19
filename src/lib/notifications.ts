/**
 * Notification Service - Casa Nicolae
 *
 * Supports:
 * - In-app notifications (active)
 * - Browser push notifications (active)
 * - SMS via Twilio (ready for future integration)
 *
 * To enable Twilio SMS, add these env variables:
 *   TWILIO_ACCOUNT_SID=your_sid
 *   TWILIO_AUTH_TOKEN=your_token
 *   TWILIO_PHONE_NUMBER=+40xxxxxxxxxx
 *   NOTIFICATION_PHONES=+40712345678,+40723456789
 */

export type NotificationChannel = "in_app" | "push" | "sms";

export interface NotificationPayload {
  title: string;
  body: string;
  severity: "critical" | "warning" | "info";
  url?: string;
  tag?: string;
}

// Check which notification channels are available
export function getAvailableChannels(): NotificationChannel[] {
  const channels: NotificationChannel[] = ["in_app", "push"];

  if (isTwilioConfigured()) {
    channels.push("sms");
  }

  return channels;
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER &&
    process.env.NOTIFICATION_PHONES
  );
}

// Send SMS via Twilio (for future use)
export async function sendSMS(body: string): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.log("Twilio not configured, skipping SMS");
    return false;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
  const toNumbers = process.env.NOTIFICATION_PHONES!.split(",").map((n) => n.trim());

  const results = await Promise.allSettled(
    toNumbers.map(async (to) => {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: body,
          }).toString(),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error(`SMS failed to ${to}:`, err);
        return false;
      }
      return true;
    })
  );

  return results.some((r) => r.status === "fulfilled" && r.value === true);
}

// Send notification through all available channels
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const channels = getAvailableChannels();

  // SMS only for critical alerts
  if (channels.includes("sms") && payload.severity === "critical") {
    await sendSMS(`[URGENT] Casa Nicolae: ${payload.title} - ${payload.body}`);
  }
}
