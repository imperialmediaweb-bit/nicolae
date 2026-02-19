import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAccess } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["admin", "farmacist", "asistent"]);
    const { id } = await params;
    const { action, quantity, reason } = await req.json();

    if (!action || !quantity) {
      return NextResponse.json(
        { error: "Acțiunea și cantitatea sunt obligatorii" },
        { status: 400 }
      );
    }

    const medication = await prisma.medication.findUnique({ where: { id } });
    if (!medication) {
      return NextResponse.json({ error: "Medicament negăsit" }, { status: 404 });
    }

    let newStock = medication.stock;
    if (action === "adaugare") {
      newStock += parseInt(quantity);
    } else if (action === "eliberare") {
      newStock -= parseInt(quantity);
      if (newStock < 0) {
        return NextResponse.json(
          { error: "Stoc insuficient" },
          { status: 400 }
        );
      }
    } else if (action === "ajustare") {
      newStock = parseInt(quantity);
    }

    await prisma.medication.update({
      where: { id },
      data: { stock: newStock },
    });

    await prisma.medicationLog.create({
      data: {
        action,
        quantity: parseInt(quantity),
        reason,
        medicationId: id,
        userId: session.id,
      },
    });

    await logAccess(
      session.id,
      "edit",
      "medication",
      id,
      `Stock ${action}: ${quantity} ${medication.unit} - ${medication.name}`
    );

    return NextResponse.json({ success: true, newStock });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare la actualizare stoc" }, { status: 500 });
  }
}
