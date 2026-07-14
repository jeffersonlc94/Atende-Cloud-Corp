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

  // Nunca expor credenciais SMTP neste endpoint público — a configuração
  // de e-mail é servida apenas para admins em /api/config/smtp.
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpFrom, ...publicSettings } =
    settings;
  void smtpHost;
  void smtpPort;
  void smtpUser;
  void smtpPass;
  void smtpSecure;
  void smtpFrom;

  return NextResponse.json(publicSettings);
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

  // Cada aba de Configurações (Personalização, Notificações, Segurança) envia
  // apenas os campos que edita. Para não sobrescrever os demais campos com os
  // defaults do schema (ex: string vazia), aplicamos somente as chaves que
  // vieram de fato no corpo da requisição.
  const hasKey = (key: string) => Object.prototype.hasOwnProperty.call(body, key);

  const updateData: Record<string, unknown> = {};
  if (hasKey("systemName")) updateData.systemName = data.systemName || null;
  if (hasKey("logoUrl")) updateData.logoUrl = data.logoUrl || null;
  if (hasKey("faviconUrl")) updateData.faviconUrl = data.faviconUrl || null;
  if (hasKey("primaryColor")) updateData.primaryColor = data.primaryColor || null;
  if (hasKey("sidebarColor")) updateData.sidebarColor = data.sidebarColor || null;
  if (hasKey("buttonColor")) updateData.buttonColor = data.buttonColor || null;
  if (hasKey("accentColor")) updateData.accentColor = data.accentColor || null;
  if (hasKey("autoLogoutMinutes")) {
    updateData.autoLogoutMinutes = data.autoLogoutMinutes || null;
  }
  if (hasKey("notificationCargoPrefs")) {
    updateData.notificationCargoPrefs = data.notificationCargoPrefs ?? {};
  }

  const settings = await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: updateData,
    create: { id: SETTINGS_ID, ...updateData },
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
