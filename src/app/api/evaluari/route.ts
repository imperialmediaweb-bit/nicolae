import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAccess } from "@/lib/auth";
import { generateAIReport } from "@/lib/ai-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const beneficiaryId = searchParams.get("beneficiaryId");

    const where = beneficiaryId ? { beneficiaryId } : {};

    const evaluari = await prisma.evaluation.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        beneficiary: { select: { firstName: true, lastName: true, code: true } },
        evaluator: { select: { name: true, role: true } },
      },
    });

    await logAccess(session.id, "view", "evaluation", undefined, "Listare evaluări");

    return NextResponse.json(evaluari);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["admin", "asistent", "psiholog"]);
    const data = await req.json();

    // Get beneficiary data for AI
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: data.beneficiaryId },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: "Beneficiar negăsit" }, { status: 404 });
    }

    // Count existing evaluations for versioning
    const existingCount = await prisma.evaluation.count({
      where: { beneficiaryId: data.beneficiaryId },
    });

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        beneficiaryId: data.beneficiaryId,
        evaluatorId: session.id,
        version: existingCount + 1,
        communicationLevel: data.communicationLevel || "mediu",
        stressReaction: data.stressReaction || "calm",
        sociability: data.sociability || "sociabil",
        autonomy: data.autonomy || "partial",
        sleepQuality: data.sleepQuality || "bun",
        appetite: data.appetite || "normal",
        sadness: data.sadness || false,
        anxiety: data.anxiety || false,
        anger: data.anger || false,
        apathy: data.apathy || false,
        hope: data.hope || false,
        observations: data.observations,
      },
    });

    // Generate AI report
    try {
      const aiReport = await generateAIReport({
        beneficiary: {
          firstName: beneficiary.firstName,
          lastName: beneficiary.lastName,
          age: beneficiary.age,
          sex: beneficiary.sex,
          location: beneficiary.location,
          hasFamily: beneficiary.hasFamily,
          housingStatus: beneficiary.housingStatus,
          familyContactFreq: beneficiary.familyContactFreq,
          institutionHistory: beneficiary.institutionHistory,
          knownDiseases: beneficiary.knownDiseases,
          medication: beneficiary.medication,
          disabilities: beneficiary.disabilities,
          priorPsychEval: beneficiary.priorPsychEval,
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
        where: { id: evaluation.id },
        data: {
          aiReport: JSON.stringify(aiReport),
          aiGeneratedAt: new Date(),
        },
      });
    } catch (aiError) {
      console.error("AI generation error:", aiError);
    }

    await logAccess(
      session.id,
      "create",
      "evaluation",
      evaluation.id,
      `Notă orientativă nouă pentru ${beneficiary.code}`
    );

    const result = await prisma.evaluation.findUnique({
      where: { id: evaluation.id },
      include: {
        beneficiary: true,
        evaluator: { select: { name: true, role: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("Create evaluation error:", error);
    return NextResponse.json({ error: "Eroare la creare nota orientativa" }, { status: 500 });
  }
}
