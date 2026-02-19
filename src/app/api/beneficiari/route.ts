import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAccess } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();

    const beneficiari = await prisma.beneficiary.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        evaluations: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    await logAccess(session.id, "view", "beneficiary", undefined, "Listare beneficiari");

    return NextResponse.json(beneficiari);
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

    const beneficiary = await prisma.beneficiary.create({
      data: {
        code: data.code,
        firstName: data.firstName,
        lastName: data.lastName,
        age: parseInt(data.age),
        sex: data.sex,
        location: data.location,
        hasConsent: data.hasConsent || false,
        hasFamily: data.hasFamily || "nu",
        housingStatus: data.housingStatus || "centru",
        familyContactFreq: data.familyContactFreq,
        institutionHistory: data.institutionHistory,
        knownDiseases: data.knownDiseases,
        medication: data.medication,
        disabilities: data.disabilities,
        priorPsychEval: data.priorPsychEval || "nu",
      },
    });

    await logAccess(
      session.id,
      "create",
      "beneficiary",
      beneficiary.id,
      `Creare beneficiar: ${beneficiary.code}`
    );

    return NextResponse.json(beneficiary, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("Create beneficiary error:", error);
    return NextResponse.json({ error: "Eroare la creare" }, { status: 500 });
  }
}
