import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();

    const categories = await prisma.medicationCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { medications: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin", "farmacist"]);
    const data = await req.json();

    const category = await prisma.medicationCategory.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color || "#3B82F6",
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare la creare categorie" }, { status: 500 });
  }
}
