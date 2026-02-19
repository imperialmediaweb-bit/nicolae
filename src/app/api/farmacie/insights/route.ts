import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generatePharmacyInsights } from "@/lib/ai-engine";

export async function GET() {
  try {
    await requireAuth();

    const medications = await prisma.medication.findMany({
      where: { active: true },
      include: {
        category: true,
        logs: {
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    });

    const medsForAnalysis = medications.map((m) => ({
      name: m.name,
      stock: m.stock,
      minStock: m.minStock,
      unit: m.unit,
      expiryDate: m.expiryDate ? m.expiryDate.toISOString() : null,
      category: m.category.name,
      logs: m.logs.map((l) => ({
        action: l.action,
        quantity: l.quantity,
        date: l.date.toISOString(),
      })),
    }));

    const insights = await generatePharmacyInsights(medsForAnalysis);

    return NextResponse.json(insights);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("Pharmacy insights error:", error);
    return NextResponse.json({ error: "Eroare la generare insights" }, { status: 500 });
  }
}
