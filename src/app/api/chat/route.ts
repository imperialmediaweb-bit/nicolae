import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { callAI } from "@/lib/ai-engine";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { message } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Mesajul este obligatoriu" }, { status: 400 });
    }

    // Build context from database for smarter answers
    const [beneficiaryCount, evaluationCount, medicationStats] = await Promise.all([
      prisma.beneficiary.count({ where: { active: true } }),
      prisma.evaluation.count(),
      prisma.medication.findMany({
        where: { active: true },
        select: { name: true, stock: true, minStock: true, unit: true, expiryDate: true },
      }),
    ]);

    const lowStock = medicationStats.filter((m) => m.stock <= m.minStock);
    const now = new Date();
    const expiringSoon = medicationStats.filter((m) => {
      if (!m.expiryDate) return false;
      const days = Math.ceil((m.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 30 && days > 0;
    });

    const systemPrompt = `Ești asistentul AI al centrului social "Casa Nicolae" care găzduiește persoane vulnerabile.
Rolul tău: ajuți personalul (asistenți sociali, psihologi, farmaciști, administratori) cu informații și sfaturi.

CONTEXT ACTUAL:
- ${beneficiaryCount} beneficiari activi în sistem
- ${evaluationCount} evaluări psihosociale realizate
- ${medicationStats.length} medicamente în farmacie
- ${lowStock.length} medicamente cu stoc scăzut${lowStock.length > 0 ? ": " + lowStock.map((m) => `${m.name} (${m.stock}/${m.minStock} ${m.unit})`).join(", ") : ""}
- ${expiringSoon.length} medicamente expiră în 30 zile${expiringSoon.length > 0 ? ": " + expiringSoon.map((m) => m.name).join(", ") : ""}

Utilizator curent: ${session.name} (${session.role})

REGULI:
- Răspunde în limba română
- Fii scurt, practic și la obiect
- Pentru întrebări medicale, recomandă consultarea unui medic
- NU pune diagnostice
- Poți da sfaturi despre comunicare cu beneficiari, tehnici de de-escaladare, gestionare stres
- Poți ajuta cu informații despre medicamente (dozaj, interacțiuni, stocare)
- Poți ajuta cu proceduri administrative și bune practici în asistență socială
- Dacă ești întrebat despre stocul farmaciei, folosește datele din context`;

    const response = await callAI(systemPrompt, message);

    return NextResponse.json({ response });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "NO_API_KEY") {
      return NextResponse.json({
        response: "Nu este configurată nicio cheie API. Mergi la Setări (din meniul de admin) și adaugă cheia Anthropic sau Gemini.",
        noApiKey: true,
      });
    }
    if (error instanceof Error && (error.message.includes("API_ERROR") || error.message === "ALL_PROVIDERS_FAILED")) {
      return NextResponse.json({
        response: "Cheia API este configurată, dar apelul a eșuat. Verifică dacă cheia este validă și are credit suficient, sau încearcă din nou.",
      });
    }
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Eroare la procesare" }, { status: 500 });
  }
}
