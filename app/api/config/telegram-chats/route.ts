import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTelegramConfig } from "@/lib/telegram";

type TgUpdate = {
  message?: TgMessageContainer;
  edited_message?: TgMessageContainer;
  channel_post?: TgMessageContainer;
  my_chat_member?: { chat?: TgChat; from?: TgUser };
};
type TgMessageContainer = { chat?: TgChat; from?: TgUser };
type TgChat = { id: number; type: string; title?: string; first_name?: string; last_name?: string; username?: string };
type TgUser = { id: number; first_name?: string; last_name?: string; username?: string };

/**
 * Lista os chats que interagiram com o bot recentemente (via getUpdates),
 * para o admin copiar os IDs sem precisar acessar a API do Telegram na mão.
 * Requer que o usuário/grupo tenha enviado alguma mensagem ao bot.
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const config = await getTelegramConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Bot do Telegram não configurado — salve o token primeiro" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates`, {
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as
      | { ok: boolean; result?: TgUpdate[]; description?: string }
      | null;
    if (!res.ok || !body?.ok) {
      return NextResponse.json(
        { error: body?.description || "Falha ao consultar o Telegram" },
        { status: 502 }
      );
    }

    const chats = new Map<string, { id: string; nome: string; tipo: string }>();
    for (const update of body.result ?? []) {
      const containers = [update.message, update.edited_message, update.channel_post, update.my_chat_member];
      for (const c of containers) {
        const chat = c?.chat;
        if (!chat) continue;
        const nome =
          chat.title ||
          [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
          (chat.username ? `@${chat.username}` : String(chat.id));
        const tipo =
          chat.type === "private"
            ? "Pessoa"
            : chat.type === "channel"
              ? "Canal"
              : "Grupo";
        chats.set(String(chat.id), { id: String(chat.id), nome, tipo });
        // Em conversas privadas, o "from" é a mesma pessoa; em grupos não
        // adicionamos o autor para não confundir com o chat do grupo.
      }
    }

    return NextResponse.json({ chats: Array.from(chats.values()) });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar o Telegram" }, { status: 502 });
  }
}
