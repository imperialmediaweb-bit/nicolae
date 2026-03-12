import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// Helper: get Monday of the week for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET - Get meal plan for a week
export async function GET(req: NextRequest) {
  // This route is accessible both by admin and portal parents
  const weekParam = req.nextUrl.searchParams.get("week");
  const weekStart = weekParam ? getWeekStart(new Date(weekParam)) : getWeekStart(new Date());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const meals = await prisma.mealPlan.findMany({
    where: {
      weekStart: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
  });

  return NextResponse.json({ weekStart: weekStart.toISOString(), meals });
}

// POST - Add/update meal (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { id, weekStart: weekStartStr, dayOfWeek, mealType, title, description, ingredients, calories, notes, prepNotes } = await req.json();

    if (dayOfWeek === undefined || !mealType || !title) {
      return NextResponse.json({ error: "Campuri obligatorii: dayOfWeek, mealType, title" }, { status: 400 });
    }

    const weekStart = getWeekStart(new Date(weekStartStr || new Date()));

    if (id) {
      // Update existing
      const meal = await prisma.mealPlan.update({
        where: { id },
        data: { dayOfWeek, mealType, title, description: description || "", ingredients, calories: calories ? parseInt(calories) : null, notes, prepNotes, weekStart },
      });
      return NextResponse.json(meal);
    }

    // Create new
    const meal = await prisma.mealPlan.create({
      data: { weekStart, dayOfWeek, mealType, title, description: description || "", ingredients, calories: calories ? parseInt(calories) : null, notes, prepNotes },
    });
    return NextResponse.json(meal, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("[Retetar]", err);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

// DELETE - Remove meal (admin only)
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID obligatoriu" }, { status: 400 });
    await prisma.mealPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
