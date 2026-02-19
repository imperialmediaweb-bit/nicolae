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

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id },
      include: {
        evaluations: {
          orderBy: { date: "desc" },
          include: { evaluator: { select: { name: true, role: true } } },
        },
      },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: "Nu a fost găsit" }, { status: 404 });
    }

    await logAccess(session.id, "view", "beneficiary", id, `Vizualizare: ${beneficiary.code}`);

    return NextResponse.json(beneficiary);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["admin", "asistent", "psiholog"]);
    const { id } = await params;
    const data = await req.json();

    const beneficiary = await prisma.beneficiary.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age ? parseInt(data.age) : undefined,
        sex: data.sex,
        location: data.location,
        hasConsent: data.hasConsent,
        hasFamily: data.hasFamily,
        housingStatus: data.housingStatus,
        familyContactFreq: data.familyContactFreq,
        institutionHistory: data.institutionHistory,
        knownDiseases: data.knownDiseases,
        medication: data.medication,
        disabilities: data.disabilities,
        priorPsychEval: data.priorPsychEval,
      },
    });

    await logAccess(session.id, "edit", "beneficiary", id, `Editare: ${beneficiary.code}`);

    return NextResponse.json(beneficiary);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare la actualizare" }, { status: 500 });
  }
}
