import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getConfig, setConfig, deleteConfig } from "@/lib/config";

const ALLOWED_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "NOTIFICATION_PHONES",
];

function maskKey(value: string): string {
  if (value.length <= 8) return "****";
  return value.slice(0, 6) + "..." + value.slice(-4);
}

export async function GET() {
  try {
    await requireAuth(["admin"]);

    const configs: Record<string, { configured: boolean; masked: string }> = {};

    for (const key of ALLOWED_KEYS) {
      const value = await getConfig(key);
      const isSet = !!(value && !value.includes("your-") && !value.includes("YOUR_"));
      configs[key] = {
        configured: isSet,
        masked: isSet ? maskKey(value!) : "",
      };
    }

    return NextResponse.json(configs);
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Acces interzis") {
      return NextResponse.json({ error: "Doar adminul poate accesa setarile" }, { status: 403 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { key, value } = await req.json();

    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: "Cheie nevalidă" }, { status: 400 });
    }

    if (!value || value.trim() === "") {
      await deleteConfig(key);
      return NextResponse.json({ success: true, action: "deleted" });
    }

    await setConfig(key, value.trim());
    return NextResponse.json({ success: true, action: "saved", masked: maskKey(value.trim()) });
  } catch (error) {
    if (error instanceof Error && error.message === "Neautorizat") {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Acces interzis") {
      return NextResponse.json({ error: "Doar adminul" }, { status: 403 });
    }
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
