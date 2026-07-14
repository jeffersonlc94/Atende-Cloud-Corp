import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registerAudit, getRequestIp } from "@/lib/audit";

const SETTINGS_ID = "default";

const smtpSettingsSchema = z.object({
  smtpHost: z.string().trim().optional().default(""),
  smtpPort: z.coerce.number().int().positive().optional(),
  smtpUser: z.string().trim().optional().default(""),
  // Senha vazia = manter a senha já salva.
  smtpPass: z.string().optional().default(""),
  smtpSecure: z.boolean().optional().default(false),
  smtpAllowInvalidCert: z.boolean().optional().default(false),
  smtpFrom: z.string().trim().optional().default(""),
  notificationEmails: z.string().trim().optional().default(""),
});

// Somente administradores: a configuração inclui credenciais.
async function requireAdmin() {
  const session = await auth();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Apenas administradores podem gerenciar o SMTP" },
        { status: 403 }
      ),
    };
  }
  return { session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const settings = await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } });

  return NextResponse.json({
    smtpHost: settings?.smtpHost ?? "",
    smtpPort: settings?.smtpPort ?? null,
    smtpUser: settings?.smtpUser ?? "",
    hasPassword: Boolean(settings?.smtpPass),
    smtpSecure: settings?.smtpSecure ?? false,
    smtpAllowInvalidCert: settings?.smtpAllowInvalidCert ?? false,
    smtpFrom: settings?.smtpFrom ?? "",
    notificationEmails: settings?.notificationEmails ?? "",
  });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = smtpSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {
    smtpHost: data.smtpHost || null,
    smtpPort: data.smtpPort ?? null,
    smtpUser: data.smtpUser || null,
    smtpSecure: data.smtpSecure,
    smtpAllowInvalidCert: data.smtpAllowInvalidCert,
    smtpFrom: data.smtpFrom || null,
    notificationEmails: data.notificationEmails || null,
  };
  if (data.smtpPass) updateData.smtpPass = data.smtpPass;

  const settings = await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: updateData,
    create: { id: SETTINGS_ID, ...updateData },
  });

  await registerAudit({
    userId: session!.user.id,
    acao: "update",
    entidade: "SystemSettings",
    entidadeId: settings.id,
    detalhes: { smtp: true, host: settings.smtpHost },
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
