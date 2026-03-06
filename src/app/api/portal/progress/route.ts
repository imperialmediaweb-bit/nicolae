import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST - Adauga nota de progres (staff/admin)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin", "psiholog", "asistent"]);

    const { beneficiaryId, title, content, category, isPublic } = await req.json();

    if (!beneficiaryId || !title || !content) {
      return NextResponse.json({ error: "Campuri obligatorii lipsesc" }, { status: 400 });
    }

    const note = await prisma.progressNote.create({
      data: {
        beneficiaryId,
        title,
        content,
        category: category || "general",
        isPublic: isPublic !== false,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

// GET - Lista note progres pentru un beneficiar
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const beneficiaryId = req.nextUrl.searchParams.get("beneficiaryId");
    if (!beneficiaryId) {
      return NextResponse.json({ error: "beneficiaryId obligatoriu" }, { status: 400 });
    }

    const notes = await prisma.progressNote.findMany({
      where: { beneficiaryId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
