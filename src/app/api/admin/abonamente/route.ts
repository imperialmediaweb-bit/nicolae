import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET - Lista planuri abonament
export async function GET() {
  try {
    await requireAuth(["admin"]);
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
