import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Simple token-based auth using cookies
export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export function decodeSession(token: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function requireAuth(
  allowedRoles?: string[]
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Neautorizat");
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("Acces interzis");
  }
  return session;
}

export async function logAccess(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
) {
  await prisma.accessLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      details,
    },
  });
}
