import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registerAudit, getRequestIp } from "@/lib/audit";

const SETTINGS_ID = "default";

const schema = z.object({
  // Dias da semana (0=domingo ... 6=sábado) em que o checklist é obrigatório.
  checklistDays: z.string().trim().optional().default(""),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } });
  return NextResponse.json({ checklistDays: settings?.checklistDays ?? "" });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Apenas administradores podem alterar os dias de checklist" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { checklistDays: parsed.data.checklistDays || null },
    create: { id: SETTINGS_ID, checklistDays: parsed.data.checklistDays || null },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "SystemSettings",
    entidadeId: settings.id,
    detalhes: { checklistDays: settings.checklistDays },
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
