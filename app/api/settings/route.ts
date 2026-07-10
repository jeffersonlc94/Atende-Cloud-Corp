import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { systemSettingsSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

const SETTINGS_ID = "default";

// GET é público (sem auth) pois o Provider de tema precisa ler as cores/nome
// antes de qualquer navegação autenticada (ex: tela de login).
export async function GET() {
  const settings = await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem alterar as configurações" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = systemSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const settings = await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      systemName: data.systemName || null,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
      primaryColor: data.primaryColor || null,
      sidebarColor: data.sidebarColor || null,
      buttonColor: data.buttonColor || null,
      accentColor: data.accentColor || null,
    },
    create: {
      id: SETTINGS_ID,
      systemName: data.systemName || null,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
      primaryColor: data.primaryColor || null,
      sidebarColor: data.sidebarColor || null,
      buttonColor: data.buttonColor || null,
      accentColor: data.accentColor || null,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "SystemSettings",
    entidadeId: settings.id,
    detalhes: { systemName: settings.systemName },
    ip: getRequestIp(req),
  });

  return NextResponse.json(settings);
}
