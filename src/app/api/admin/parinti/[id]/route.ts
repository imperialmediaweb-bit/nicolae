import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hashParentPassword } from "@/lib/parent-auth";

// PATCH - Update parinte
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.beneficiaryId !== undefined) updateData.beneficiaryId = body.beneficiaryId || null;
    if (body.password) updateData.password = await hashParentPassword(body.password);

    const parent = await prisma.parent.update({
      where: { id },
      data: updateData,
    });

    // Update subscription if provided
    if (body.planId || body.subscriptionMonths || body.subscriptionStatus) {
      const existingSub = await prisma.subscription.findUnique({ where: { parentId: id } });

      if (existingSub) {
        const subUpdate: Record<string, unknown> = {};
        if (body.planId) subUpdate.planId = body.planId;
        if (body.subscriptionStatus) subUpdate.status = body.subscriptionStatus;
        if (body.subscriptionMonths) {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + body.subscriptionMonths);
          subUpdate.endDate = endDate;
          subUpdate.status = "active";
        }
        await prisma.subscription.update({ where: { parentId: id }, data: subUpdate });
      } else if (body.planId) {
        const months = body.subscriptionMonths || 1;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        await prisma.subscription.create({
          data: { parentId: id, planId: body.planId, endDate, status: "active" },
        });
      }
    }

    return NextResponse.json(parent);
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("[Admin Parinti PATCH]", err);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

// DELETE - Sterge parinte
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;

    // Delete subscription first
    await prisma.subscription.deleteMany({ where: { parentId: id } });
    await prisma.emailLog.deleteMany({ where: { parentId: id } });
    await prisma.parent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
