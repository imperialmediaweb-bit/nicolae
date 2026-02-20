import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    // Check if already seeded
    const existingAdmin = await prisma.user.findUnique({
      where: { username: "admin" },
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "Deja populat" });
    }

    const adminPassword = await hashPassword("admin123");
    const userPassword = await hashPassword("user123");

    await prisma.user.create({
      data: {
        username: "admin",
        password: adminPassword,
        name: "Administrator",
        role: "admin",
      },
    });

    await prisma.user.create({
      data: {
        username: "utilizator",
        password: userPassword,
        name: "Utilizator General",
        role: "asistent",
      },
    });

    const categories = [
      { name: "Cardio", description: "Medicamente cardiovasculare", icon: "Heart", color: "#EF4444" },
      { name: "Diabet", description: "Medicamente pentru diabet", icon: "Droplets", color: "#8B5CF6" },
      { name: "Gastro", description: "Medicamente gastrointestinale", icon: "Pill", color: "#F59E0B" },
      { name: "Respirator", description: "Medicamente respiratorii", icon: "Wind", color: "#06B6D4" },
      { name: "Neuro", description: "Medicamente neurologice", icon: "Brain", color: "#EC4899" },
      { name: "Psihiatric", description: "Medicamente psihiatrice", icon: "Shield", color: "#6366F1" },
      { name: "Antibiotice", description: "Antibiotice si antimicrobiene", icon: "Zap", color: "#10B981" },
      { name: "Durere", description: "Analgezice si antiinflamatoare", icon: "Flame", color: "#F97316" },
      { name: "Alergii", description: "Antihistaminice si antialergice", icon: "Flower", color: "#A855F7" },
      { name: "Dermato", description: "Medicamente dermatologice", icon: "Sun", color: "#FBBF24" },
      { name: "Vitamine", description: "Vitamine si suplimente", icon: "Star", color: "#22C55E" },
      { name: "Altele", description: "Alte medicamente", icon: "Package", color: "#6B7280" },
    ];

    for (const cat of categories) {
      await prisma.medicationCategory.create({ data: cat });
    }

    return NextResponse.json({
      message: "Seed completat!",
      accounts: [
        "admin / admin123 (Administrator - acces complet, setari, useri)",
        "utilizator / user123 (Utilizator General - beneficiari, note, farmacie)",
      ],
    });
  } catch (error) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Eroare la seed", details: message }, { status: 500 });
  }
}
