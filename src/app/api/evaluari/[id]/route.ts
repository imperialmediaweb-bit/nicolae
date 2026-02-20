import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAccess } from "@/lib/auth";
import { generateAIReport } from "@/lib/ai-engine";

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
      return NextResponse.json({ error: "Nota negăsită" }, { status: 404 });
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["admin", "asistent", "psiholog"]);
    const { id } = await params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { beneficiary: true },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Nota negăsită" }, { status: 404 });
    }

    const b = evaluation.beneficiary;
    const aiReport = await generateAIReport({
      beneficiary: {
        firstName: b.firstName,
        lastName: b.lastName,
        age: b.age,
        sex: b.sex,
        location: b.location,
        hasFamily: b.hasFamily,
        housingStatus: b.housingStatus,
        familyContactFreq: b.familyContactFreq,
        institutionHistory: b.institutionHistory,
        knownDiseases: b.knownDiseases,
        medication: b.medication,
        disabilities: b.disabilities,
        priorPsychEval: b.priorPsychEval,
      },
      evaluation: {
        communicationLevel: evaluation.communicationLevel,
        stressReaction: evaluation.stressReaction,
        sociability: evaluation.sociability,
        autonomy: evaluation.autonomy,
        sleepQuality: evaluation.sleepQuality,
        appetite: evaluation.appetite,
        sadness: evaluation.sadness,
        anxiety: evaluation.anxiety,
        anger: evaluation.anger,
        apathy: evaluation.apathy,
        hope: evaluation.hope,
        observations: evaluation.observations,
      },
    });

    await prisma.evaluation.update({
      where: { id },
      data: {
        aiReport: JSON.stringify(aiReport),
        aiGeneratedAt: new Date(),
      },
    });

    await logAccess(session.id, "update", "evaluation", id, "Regenerare raport AI");

    return NextResponse.json({ success: true, report: aiReport });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "NO_API_KEY") {
      return NextResponse.json({ error: "Nicio cheie API configurată. Mergi la Admin → Setări pentru a adăuga o cheie." }, { status: 400 });
    }
    console.error("Regenerate error:", error);
    return NextResponse.json({ error: "Eroare la regenerare" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["admin", "asistent", "psiholog"]);
    const { id } = await params;

    const evaluation = await prisma.evaluation.findUnique({ where: { id } });

    if (!evaluation) {
      return NextResponse.json({ error: "Nota negăsită" }, { status: 404 });
    }

    await prisma.evaluation.delete({ where: { id } });

    await logAccess(session.id, "delete", "evaluation", id, "Ștergere evaluare");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Eroare la ștergere" }, { status: 500 });
  }
}
