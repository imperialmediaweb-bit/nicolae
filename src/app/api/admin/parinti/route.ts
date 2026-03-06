import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hashParentPassword } from "@/lib/parent-auth";
import { sendEmail, emailTemplates } from "@/lib/email";

// GET - Lista parinti
export async function GET() {
  try {
    await requireAuth(["admin"]);

    const parents = await prisma.parent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        beneficiary: { select: { firstName: true, lastName: true, code: true } },
        subscription: { include: { plan: true } },
      },
    });

    return NextResponse.json(parents);
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

// POST - Creaza parinte nou
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await req.json();
    const { email, password, firstName, lastName, phone, beneficiaryId, planId, subscriptionMonths } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Campuri obligatorii lipsesc" }, { status: 400 });
    }

    const existing = await prisma.parent.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email deja inregistrat" }, { status: 409 });
    }

    const hashedPassword = await hashParentPassword(password);

    const parent = await prisma.parent.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        beneficiaryId: beneficiaryId || null,
      },
    });

    // Create subscription if plan selected
    if (planId) {
      const months = subscriptionMonths || 1;
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      await prisma.subscription.create({
        data: {
          parentId: parent.id,
          planId,
          endDate,
          status: "active",
        },
      });
    }

    // Send welcome email
    const plan = planId ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } }) : null;
    const child = beneficiaryId
      ? await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } })
      : null;

    const welcomeEmail = emailTemplates.welcome(
      firstName,
      child ? `${child.firstName} ${child.lastName}` : "copilul",
      plan?.displayName || "Standard"
    );

    await sendEmail({
      to: email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      template: "welcome",
      parentId: parent.id,
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    console.error("[Admin Parinti]", err);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
