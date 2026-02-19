import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendNotification, isTwilioConfigured } from "@/lib/notifications";

export interface Notification {
  id: string;
  type: "stoc_scazut" | "stoc_zero" | "expirat" | "expira_curand";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  medicationId: string;
  medicationName: string;
  category: string;
  createdAt: string;
}

export async function GET() {
  try {
    await requireAuth();

    const medications = await prisma.medication.findMany({
      where: { active: true },
      include: { category: true },
    });

    const now = new Date();
    const notifications: Notification[] = [];

    for (const med of medications) {
      // Stock zero
      if (med.stock === 0) {
        notifications.push({
          id: `zero-${med.id}`,
          type: "stoc_zero",
          severity: "critical",
          title: "Stoc ZERO",
          message: `${med.name} nu mai are stoc deloc! Necesita reaprovizionare urgenta.`,
          medicationId: med.id,
          medicationName: med.name,
          category: med.category.name,
          createdAt: now.toISOString(),
        });
      }
      // Low stock (but not zero)
      else if (med.stock <= med.minStock) {
        notifications.push({
          id: `low-${med.id}`,
          type: "stoc_scazut",
          severity: "warning",
          title: "Stoc scazut",
          message: `${med.name}: ${med.stock} ${med.unit} (minim: ${med.minStock}). Trebuie reaprovizionat.`,
          medicationId: med.id,
          medicationName: med.name,
          category: med.category.name,
          createdAt: now.toISOString(),
        });
      }

      // Expired
      if (med.expiryDate) {
        const daysUntilExpiry = Math.ceil(
          (med.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          notifications.push({
            id: `expired-${med.id}`,
            type: "expirat",
            severity: "critical",
            title: "Medicament EXPIRAT",
            message: `${med.name} a expirat acum ${Math.abs(daysUntilExpiry)} zile! Trebuie retras imediat.`,
            medicationId: med.id,
            medicationName: med.name,
            category: med.category.name,
            createdAt: now.toISOString(),
          });
        } else if (daysUntilExpiry <= 30) {
          notifications.push({
            id: `expiring-${med.id}`,
            type: "expira_curand",
            severity: "warning",
            title: "Expira curand",
            message: `${med.name} expira in ${daysUntilExpiry} zile (${med.expiryDate.toLocaleDateString("ro-RO")}). Foloseste cu prioritate.`,
            medicationId: med.id,
            medicationName: med.name,
            category: med.category.name,
            createdAt: now.toISOString(),
          });
        }
      }
    }

    // Sort: critical first, then warning
    notifications.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const criticalNotifs = notifications.filter((n) => n.severity === "critical");

    // Send SMS for critical alerts if Twilio is configured
    if (criticalNotifs.length > 0) {
      sendNotification({
        title: "Alerta Farmacie",
        body: criticalNotifs.map((n) => n.message).join(" | "),
        severity: "critical",
        url: "/farmacie",
      }).catch(() => {}); // Fire and forget
    }

    return NextResponse.json({
      notifications,
      count: notifications.length,
      critical: criticalNotifs.length,
      smsEnabled: isTwilioConfigured(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
