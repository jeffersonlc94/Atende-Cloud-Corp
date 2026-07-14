import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBrandName } from "@/lib/mailer";
import { getTelegramConfig, sendTelegram, tgTeste } from "@/lib/telegram";
import { z } from "zod";

const testSchema = z.object({ chatId: z.string().trim().min(1, "Informe o chat ID") });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Apenas administradores podem enviar teste do Telegram" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe o chat ID de destino" }, { status: 400 });
  }

  const config = await getTelegramConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Bot do Telegram não configurado — salve o token primeiro" },
      { status: 400 }
    );
  }

  const message = tgTeste(await getBrandName());
  const result = await sendTelegram(config.botToken, parsed.data.chatId, message);

  if (!result.sent) {
    return NextResponse.json(
      { error: result.reason || "Falha ao enviar mensagem de teste" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
