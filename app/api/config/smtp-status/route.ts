import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSmtpConfig } from "@/lib/mailer";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getSmtpConfig();

  return NextResponse.json({
    configured: config !== null,
    host: config?.host ?? null,
    port: config ? String(config.port) : null,
    from: config?.from ?? null,
    secure: config?.secure ?? false,
    source: config?.source ?? null,
    recipients: config?.recipients ?? [],
  });
}
