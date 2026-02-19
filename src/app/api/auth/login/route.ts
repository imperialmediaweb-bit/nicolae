import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, encodeSession, logAccess } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username și parola sunt obligatorii" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Credențiale invalide" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credențiale invalide" },
        { status: 401 }
      );
    }

    const sessionData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = encodeSession(sessionData);

    await logAccess(user.id, "login", "auth", undefined, "Login reușit");

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 ore
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Eroare internă" },
      { status: 500 }
    );
  }
}
