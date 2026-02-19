import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAccess } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        beneficiary: true,
        evaluator: { select: { name: true, role: true } },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluare negăsită" }, { status: 404 });
    }

    await logAccess(session.id, "view", "evaluation", id);

    return NextResponse.json(evaluation);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
