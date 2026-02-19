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

    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        category: true,
        logs: {
          orderBy: { date: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!medication) {
      return NextResponse.json({ error: "Medicament negăsit" }, { status: 404 });
    }

    await logAccess(session.id, "view", "medication", id);

    return NextResponse.json(medication);
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
    const session = await requireAuth(["admin", "farmacist"]);
    const { id } = await params;
    const data = await req.json();

    const medication = await prisma.medication.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        dosage: data.dosage,
        minStock: data.minStock ? parseInt(data.minStock) : undefined,
        unit: data.unit,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        notes: data.notes,
        categoryId: data.categoryId,
      },
      include: { category: true },
    });

    await logAccess(session.id, "edit", "medication", id, `Editare: ${medication.name}`);

    return NextResponse.json(medication);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare la actualizare" }, { status: 500 });
  }
}
