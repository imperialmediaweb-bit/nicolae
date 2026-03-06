import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";

// GET - Cron job: trimite notificari automate
// Apeleaza-l zilnic cu un cron sau din Railway cron
export async function GET() {
  try {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    let sent = 0;
    let failed = 0;

    // 1. Abonamente care expira in 7 zile (warning)
    const expiringSoon = await prisma.subscription.findMany({
      where: {
        status: "active",
        endDate: { gte: in3days, lte: in7days },
      },
      include: { parent: true, plan: true },
    });

    for (const sub of expiringSoon) {
      // Check if we already sent this warning
      const alreadySent = await prisma.emailLog.findFirst({
        where: {
          parentId: sub.parentId,
          template: "expiry_warning",
          createdAt: { gte: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        },
      });

      if (alreadySent) continue;

      const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const emailData = emailTemplates.expiryWarning(sub.parent.firstName, daysLeft, sub.plan.displayName);

      const result = await sendEmail({
        to: sub.parent.email,
        subject: emailData.subject,
        html: emailData.html,
        template: "expiry_warning",
        parentId: sub.parentId,
      });

      if (result.success) sent++;
      else failed++;
    }

    // 2. Abonamente expirate azi (expired notification)
    const justExpired = await prisma.subscription.findMany({
      where: {
        status: "active",
        endDate: { lte: now },
      },
      include: { parent: true, plan: true },
    });

    for (const sub of justExpired) {
      // Mark as expired
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "expired" },
      });

      const emailData = emailTemplates.expired(sub.parent.firstName, sub.plan.displayName);

      const result = await sendEmail({
        to: sub.parent.email,
        subject: emailData.subject,
        html: emailData.html,
        template: "expired",
        parentId: sub.parentId,
      });

      if (result.success) sent++;
      else failed++;
    }

    console.log(`[Auto-Notify] Done: ${sent} sent, ${failed} failed`);
    return NextResponse.json({ sent, failed, expiringSoon: expiringSoon.length, justExpired: justExpired.length });
  } catch (err) {
    console.error("[Auto-Notify] Error:", err);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
