import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSmtpConfigured } from "@/lib/mailer";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    configured: isSmtpConfigured(),
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    from: process.env.SMTP_FROM || null,
    secure: process.env.SMTP_SECURE === "true",
    recipients: (process.env.FROTA_NOTIFICATION_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
  });
}
