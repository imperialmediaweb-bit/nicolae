import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendBulkEmail } from "@/lib/email";

// POST - Trimite email (admin)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { parentIds, template, subject, message, ctaText } = await req.json();

    if (!parentIds?.length) {
      return NextResponse.json({ error: "Selecteaza cel putin un parinte" }, { status: 400 });
    }

    const result = await sendBulkEmail(parentIds, template || "promotional", subject, message, ctaText);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("[Email Send]", err);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
