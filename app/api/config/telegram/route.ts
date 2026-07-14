import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registerAudit, getRequestIp } from "@/lib/audit";

const SETTINGS_ID = "default";

const telegramSettingsSchema = z.object({
  // Token vazio = manter o token já salvo.
  telegramBotToken: z.string().trim().optional().default(""),
  telegramChatIds: z.string().trim().optional().default(""),
  removeToken: z.boolean().optional().default(false),
});

async function requireAdmin() {
  const session = await auth();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Apenas administradores podem gerenciar o Telegram" },
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
    hasToken: Boolean(settings?.telegramBotToken),
    telegramChatIds: settings?.telegramChatIds ?? "",
  });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = telegramSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {
    telegramChatIds: data.telegramChatIds || null,
  };
  if (data.removeToken) {
    updateData.telegramBotToken = null;
  } else if (data.telegramBotToken) {
    updateData.telegramBotToken = data.telegramBotToken;
  }

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
    detalhes: { telegram: true },
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
