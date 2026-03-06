import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["admin"]);

    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        parent: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
