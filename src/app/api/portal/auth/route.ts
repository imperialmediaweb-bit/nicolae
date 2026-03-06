import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParentPassword, encodeParentSession, getParentSession } from "@/lib/parent-auth";

// POST - Login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email si parola sunt obligatorii" }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({ where: { email } });
    if (!parent || !parent.active) {
      return NextResponse.json({ error: "Credentiale invalide" }, { status: 401 });
    }

    const valid = await verifyParentPassword(password, parent.password);
    if (!valid) {
      return NextResponse.json({ error: "Credentiale invalide" }, { status: 401 });
    }

    const session = {
      id: parent.id,
      email: parent.email,
      firstName: parent.firstName,
      lastName: parent.lastName,
    };

    const token = encodeParentSession(session);
    const response = NextResponse.json({ success: true, user: session });

    response.cookies.set("parent_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 zile
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}

// GET - Check session
export async function GET() {
  try {
    const session = await getParentSession();
    if (!session) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
}

// DELETE - Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("parent_session", "", { maxAge: 0, path: "/" });
  return response;
}
