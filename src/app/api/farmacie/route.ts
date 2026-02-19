import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAccess } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();

    const medications = await prisma.medication.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        category: true,
      },
    });

    await logAccess(session.id, "view", "medication", undefined, "Listare medicamente");

    return NextResponse.json(medications);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["admin", "farmacist"]);
    const data = await req.json();

    const medication = await prisma.medication.create({
      data: {
        name: data.name,
        description: data.description,
        dosage: data.dosage,
        stock: parseInt(data.stock) || 0,
        minStock: parseInt(data.minStock) || 5,
        unit: data.unit || "cutii",
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes,
        categoryId: data.categoryId,
      },
      include: { category: true },
    });

    // Log the addition
    await prisma.medicationLog.create({
      data: {
        action: "adaugare",
        quantity: medication.stock,
        reason: "Adăugare medicament nou",
        medicationId: medication.id,
        userId: session.id,
      },
    });

    await logAccess(
      session.id,
      "create",
      "medication",
      medication.id,
      `Medicament nou: ${medication.name}`
    );

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("Create medication error:", error);
    return NextResponse.json({ error: "Eroare la adăugare" }, { status: 500 });
  }
}
