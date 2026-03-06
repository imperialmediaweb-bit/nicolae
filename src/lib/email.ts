import { Resend } from "resend";
import { getConfig } from "./config";
import { prisma } from "./prisma";

async function getResend(): Promise<Resend | null> {
  const apiKey = await getConfig("RESEND_API_KEY");
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// ==================== EMAIL TEMPLATES ====================

const BRAND = {
  name: "Casa Nicolae",
  color: "#4F46E5",
  logo: "🏠",
};

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:${BRAND.color};padding:24px 32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">${BRAND.logo} ${BRAND.name}</h1>
      </div>
      <!-- Content -->
      <div style="padding:32px;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          ${BRAND.name} &mdash; Grija pentru fiecare copil
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  welcome: (parentName: string, childName: string, planName: string) => ({
    subject: `Bine ai venit in familia ${BRAND.name}! 🎉`,
    html: baseTemplate(`
      <h2 style="color:#1f2937;margin-top:0;">Buna, ${parentName}! 👋</h2>
      <p style="color:#4b5563;line-height:1.6;">
        Contul tau a fost creat cu succes! Acum ai acces la portalul parintilor
        unde poti urmari progresul lui <strong>${childName}</strong>.
      </p>
      <div style="background:#EEF2FF;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:${BRAND.color};font-weight:600;margin:0 0 8px 0;">📦 Pachetul tau: ${planName}</p>
        <p style="color:#6366F1;margin:0;font-size:14px;">Ai acces la toate functiile incluse in pachet.</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">
        Acceseaza portalul tau oricand pentru a vedea:
      </p>
      <ul style="color:#4b5563;line-height:2;">
        <li>📊 Progresul copilului</li>
        <li>📝 Fise si activitati</li>
        <li>💡 Sfaturi personalizate</li>
        <li>📚 Resurse educationale</li>
      </ul>
      <a href="{portalUrl}" style="display:inline-block;background:${BRAND.color};color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px;">
        Acceseaza portalul →
      </a>
    `),
  }),

  expiryWarning: (parentName: string, daysLeft: number, planName: string) => ({
    subject: `⏰ Abonamentul tau ${planName} expira in ${daysLeft} zile`,
    html: baseTemplate(`
      <h2 style="color:#1f2937;margin-top:0;">Salut, ${parentName}!</h2>
      <div style="background:#FEF3C7;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #F59E0B;">
        <p style="color:#92400E;font-weight:600;margin:0 0 8px 0;">⏰ Abonamentul tau expira in ${daysLeft} zile</p>
        <p style="color:#92400E;margin:0;font-size:14px;">
          Pachetul <strong>${planName}</strong> va expira curand. Reinnoieste-l pentru a nu pierde accesul.
        </p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">
        Daca nu reinnoiesti, vei pierde accesul la:
      </p>
      <ul style="color:#4b5563;line-height:2;">
        <li>Progresul detaliat al copilului</li>
        <li>Fisele si activitatile personalizate</li>
        <li>Sfaturile saptamanale</li>
      </ul>
      <a href="{portalUrl}" style="display:inline-block;background:#F59E0B;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px;">
        Reinnoieste acum →
      </a>
    `),
  }),

  expired: (parentName: string, planName: string) => ({
    subject: `❌ Abonamentul tau ${planName} a expirat`,
    html: baseTemplate(`
      <h2 style="color:#1f2937;margin-top:0;">Salut, ${parentName}!</h2>
      <div style="background:#FEE2E2;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #EF4444;">
        <p style="color:#991B1B;font-weight:600;margin:0 0 8px 0;">❌ Abonamentul tau a expirat</p>
        <p style="color:#991B1B;margin:0;font-size:14px;">
          Pachetul <strong>${planName}</strong> nu mai este activ. Accesul la portal a fost restrictionat.
        </p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">
        Ne-ar parea rau sa te pierdem! Reinnoieste abonamentul pentru a continua sa urmaresti progresul copilului tau.
      </p>
      <a href="{portalUrl}" style="display:inline-block;background:#EF4444;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px;">
        Reinnoieste abonamentul →
      </a>
    `),
  }),

  promotional: (parentName: string, title: string, message: string, ctaText?: string) => ({
    subject: title,
    html: baseTemplate(`
      <h2 style="color:#1f2937;margin-top:0;">Salut, ${parentName}! 🌟</h2>
      <div style="color:#4b5563;line-height:1.8;font-size:15px;">
        ${message}
      </div>
      ${ctaText ? `
      <a href="{portalUrl}" style="display:inline-block;background:${BRAND.color};color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:24px;">
        ${ctaText} →
      </a>` : ""}
    `),
  }),

  progressUpdate: (parentName: string, childName: string, summary: string) => ({
    subject: `📊 Actualizare progres: ${childName}`,
    html: baseTemplate(`
      <h2 style="color:#1f2937;margin-top:0;">Salut, ${parentName}!</h2>
      <p style="color:#4b5563;line-height:1.6;">
        Avem vesti noi despre progresul lui <strong>${childName}</strong>:
      </p>
      <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #22C55E;">
        <div style="color:#166534;font-size:14px;line-height:1.8;">
          ${summary}
        </div>
      </div>
      <a href="{portalUrl}" style="display:inline-block;background:#22C55E;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px;">
        Vezi detalii complete →
      </a>
    `),
  }),

  reminder: (parentName: string, message: string) => ({
    subject: `💡 Reminder de la ${BRAND.name}`,
    html: baseTemplate(`
      <h2 style="color:#1f2937;margin-top:0;">Salut, ${parentName}! 💡</h2>
      <div style="color:#4b5563;line-height:1.8;font-size:15px;">
        ${message}
      </div>
      <a href="{portalUrl}" style="display:inline-block;background:${BRAND.color};color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:24px;">
        Acceseaza portalul →
      </a>
    `),
  }),
};

// ==================== SEND EMAIL ====================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  template: string;
  parentId?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = await getResend();
  if (!resend) {
    console.error("[Email] No RESEND_API_KEY configured");
    return { success: false, error: "RESEND_API_KEY nu este configurat" };
  }

  const fromEmail = (await getConfig("RESEND_FROM_EMAIL")) || "noreply@casanicolae.ro";
  const fromName = (await getConfig("RESEND_FROM_NAME")) || BRAND.name;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      await prisma.emailLog.create({
        data: {
          to: opts.to,
          subject: opts.subject,
          template: opts.template,
          status: "failed",
          error: error.message,
          parentId: opts.parentId,
        },
      });
      return { success: false, error: error.message };
    }

    await prisma.emailLog.create({
      data: {
        to: opts.to,
        subject: opts.subject,
        template: opts.template,
        status: "sent",
        resendId: data?.id,
        parentId: opts.parentId,
      },
    });

    console.log(`[Email] Sent "${opts.template}" to ${opts.to} (${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception:", errorMsg);
    await prisma.emailLog.create({
      data: {
        to: opts.to,
        subject: opts.subject,
        template: opts.template,
        status: "failed",
        error: errorMsg,
        parentId: opts.parentId,
      },
    });
    return { success: false, error: errorMsg };
  }
}

// ==================== BULK SEND ====================

export async function sendBulkEmail(
  parentIds: string[],
  template: string,
  customSubject?: string,
  customMessage?: string,
  ctaText?: string
): Promise<{ sent: number; failed: number }> {
  const parents = await prisma.parent.findMany({
    where: { id: { in: parentIds }, active: true },
    include: { beneficiary: true, subscription: { include: { plan: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const parent of parents) {
    const parentName = parent.firstName;
    const childName = parent.beneficiary
      ? `${parent.beneficiary.firstName} ${parent.beneficiary.lastName}`
      : "copilul";

    let emailData: { subject: string; html: string };

    switch (template) {
      case "promotional":
        emailData = emailTemplates.promotional(
          parentName,
          customSubject || "Noutati de la Casa Nicolae",
          customMessage || "",
          ctaText
        );
        break;
      case "reminder":
        emailData = emailTemplates.reminder(parentName, customMessage || "");
        break;
      case "progress_update":
        emailData = emailTemplates.progressUpdate(parentName, childName, customMessage || "");
        break;
      default:
        emailData = emailTemplates.promotional(parentName, customSubject || "Mesaj", customMessage || "");
    }

    if (customSubject) emailData.subject = customSubject;

    const result = await sendEmail({
      to: parent.email,
      subject: emailData.subject,
      html: emailData.html,
      template,
      parentId: parent.id,
    });

    if (result.success) sent++;
    else failed++;
  }

  return { sent, failed };
}
