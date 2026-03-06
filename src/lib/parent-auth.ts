import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export interface ParentSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function encodeParentSession(parent: ParentSession): string {
  return Buffer.from(JSON.stringify({ ...parent, type: "parent" })).toString("base64");
}

export function decodeParentSession(token: string): ParentSession | null {
  try {
    const data = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (data.type !== "parent") return null;
    return data;
  } catch {
    return null;
  }
}

export async function getParentSession(): Promise<ParentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("parent_session")?.value;
  if (!token) return null;
  return decodeParentSession(token);
}

export async function requireParentAuth(): Promise<ParentSession> {
  const session = await getParentSession();
  if (!session) throw new Error("Neautorizat");
  return session;
}

export async function hashParentPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyParentPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// Check subscription status
export async function getParentSubscription(parentId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { parentId },
    include: { plan: true },
  });
  if (!sub) return null;

  const now = new Date();
  const isActive = sub.status === "active" && sub.endDate > now;
  const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    ...sub,
    isActive,
    daysLeft: Math.max(0, daysLeft),
  };
}

// Get plan features as array
export function getPlanFeatures(plan: { features: string; name: string }): string[] {
  try {
    return JSON.parse(plan.features);
  } catch {
    return [];
  }
}

// Check if parent has access to a feature
export async function hasFeatureAccess(parentId: string, feature: string): Promise<boolean> {
  const sub = await getParentSubscription(parentId);
  if (!sub || !sub.isActive) return false;
  const features = getPlanFeatures(sub.plan);
  return features.includes(feature);
}
