import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParentAuth, getParentSubscription, getPlanFeatures } from "@/lib/parent-auth";

export async function GET() {
  try {
    const session = await requireParentAuth();

    const parent = await prisma.parent.findUnique({
      where: { id: session.id },
      include: {
        beneficiary: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Cont negasit" }, { status: 404 });
    }

    const subscription = await getParentSubscription(session.id);
    const features = subscription?.plan ? getPlanFeatures(subscription.plan) : [];

    // Get progress notes if parent has a child linked
    let progressNotes: { id: string; title: string; content: string; category: string; createdAt: Date }[] = [];
    let recentEvaluations: { id: string; date: Date; communicationLevel: string; sociability: string; autonomy: string; observations: string | null }[] = [];

    if (parent.beneficiaryId) {
      progressNotes = await prisma.progressNote.findMany({
        where: { beneficiaryId: parent.beneficiaryId, isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      if (features.includes("evaluari")) {
        recentEvaluations = await prisma.evaluation.findMany({
          where: { beneficiaryId: parent.beneficiaryId },
          orderBy: { date: "desc" },
          take: 5,
          select: {
            id: true,
            date: true,
            communicationLevel: true,
            sociability: true,
            autonomy: true,
            observations: true,
          },
        });
      }
    }

    return NextResponse.json({
      parent: {
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
      },
      child: parent.beneficiary
        ? {
            firstName: parent.beneficiary.firstName,
            lastName: parent.beneficiary.lastName,
            age: parent.beneficiary.age,
            location: parent.beneficiary.location,
          }
        : null,
      subscription: subscription
        ? {
            planName: subscription.plan.displayName,
            planColor: subscription.plan.color,
            status: subscription.status,
            isActive: subscription.isActive,
            daysLeft: subscription.daysLeft,
            endDate: subscription.endDate,
            features,
          }
        : null,
      progressNotes,
      recentEvaluations,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("[Portal Dashboard]", err);
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}
