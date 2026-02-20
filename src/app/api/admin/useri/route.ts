import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hashPassword, logAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all users (admin only)
export async function GET() {
  try {
    const session = await requireAuth(["admin"]);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    await logAccess(session.id, "view", "users", undefined, "Lista utilizatori");

    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Acces interzis") {
      return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

// POST create new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["admin"]);

    const { username, name, password, role } = await req.json();

    if (!username || !name || !password || !role) {
      return NextResponse.json({ error: "Toate campurile sunt obligatorii" }, { status: 400 });
    }

    const validRoles = ["admin", "asistent", "psiholog", "farmacist"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Rol invalid" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Parola trebuie sa aiba minim 6 caractere" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username-ul exista deja" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, name, password: hashedPassword, role },
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    });

    await logAccess(session.id, "edit", "users", user.id, `User creat: ${username} (${role})`);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Acces interzis") {
      return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
    }
    return NextResponse.json({ error: "Eroare la creare" }, { status: 500 });
  }
}

// PATCH update user (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(["admin"]);

    const { id, name, role, active, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID lipsa" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) {
      const validRoles = ["admin", "asistent", "psiholog", "farmacist"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Rol invalid" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (active !== undefined) updateData.active = active;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Parola trebuie sa aiba minim 6 caractere" }, { status: 400 });
      }
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    });

    await logAccess(session.id, "edit", "users", id, `User modificat: ${user.username}`);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Acces interzis") {
      return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
    }
    return NextResponse.json({ error: "Eroare la actualizare" }, { status: 500 });
  }
}
