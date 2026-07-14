import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { runFleetNotifications } from "@/lib/notifications-runner";

// ---------------------------------------------------------------------------
// Disparo manual da rotina de notificações da Frota (botão em Configurações
// ou cron externo). Respeita os toggles de canal ativado/pausado, mas ignora
// o agendamento de dia/horário — o envio agendado fica por conta do
// agendador interno (instrumentation.ts).
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  // Corpo opcional: { channel: "email" | "telegram" | "both", force: boolean }
  const body = (await req.json().catch(() => ({}))) as {
    channel?: "email" | "telegram" | "both";
    force?: boolean;
  };
  const channel = body.channel ?? "both";
  const force = body.force === true;

  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  const emailEnabled = (settings?.smtpEnabled ?? true) && channel !== "telegram";
  const telegramEnabled = (settings?.telegramEnabled ?? true) && channel !== "email";

  if (!emailEnabled && !telegramEnabled) {
    return NextResponse.json({
      ok: true,
      message: "Os dois canais (e-mail e Telegram) estão pausados nas configurações.",
      processed: 0,
      sent: 0,
      sentTelegram: 0,
      skippedDuplicate: 0,
      skippedNoSmtp: 0,
      errors: [],
    });
  }

  const summary = await runFleetNotifications({
    email: emailEnabled,
    telegram: telegramEnabled,
    force,
  });

  return NextResponse.json(summary);
}
