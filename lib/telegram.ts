import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Envio de notificações via bot do Telegram.
// O token do bot é configurado no painel (Configurações > Notificações),
// com a variável de ambiente TELEGRAM_BOT_TOKEN como fallback.
// As mensagens espelham os templates de e-mail (lib/mailer.ts).
// ---------------------------------------------------------------------------

export type TelegramConfig = {
  botToken: string;
  /** Chat IDs fixos (grupos ou pessoas) que recebem todos os avisos. */
  chatIds: string[];
  source: "painel" | "ambiente";
};

export async function getTelegramConfig(): Promise<TelegramConfig | null> {
  const settings = await prisma.systemSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  const parseIds = (raw: string | null | undefined) =>
    (raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  if (settings?.telegramBotToken) {
    return {
      botToken: settings.telegramBotToken,
      chatIds: parseIds(settings.telegramChatIds),
      source: "painel",
    };
  }

  if (process.env.TELEGRAM_BOT_TOKEN) {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatIds: parseIds(process.env.TELEGRAM_CHAT_IDS),
      source: "ambiente",
    };
  }

  return null;
}

export type SendTelegramResult = { sent: boolean; reason?: string };

export async function sendTelegram(
  botToken: string,
  chatId: string,
  html: string
): Promise<SendTelegramResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML" }),
    });
    const body = (await res.json().catch(() => null)) as
      | { ok: boolean; description?: string }
      | null;
    if (!res.ok || !body?.ok) {
      return { sent: false, reason: body?.description || `HTTP ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

// ---------------------------------------------------------------------------
// Templates (mesmo conteúdo dos e-mails, em HTML do Telegram)
// ---------------------------------------------------------------------------

type Severidade = "critico" | "atencao" | "info";

const severidadeEmoji: Record<Severidade, string> = {
  critico: "🔴 <b>URGENTE</b>",
  atencao: "🟡 <b>ATENÇÃO</b>",
  info: "🟢 <b>INFORMATIVO</b>",
};

function baseMessage(params: {
  brand: string;
  title: string;
  severidade: Severidade;
  veiculo?: string;
  linhas: { label: string; valor: string }[];
  mensagem: string;
}): string {
  const { brand, title, severidade, veiculo, linhas, mensagem } = params;
  const detalhes = [
    ...(veiculo ? [{ label: "Veículo", valor: veiculo }] : []),
    ...linhas,
  ]
    .map((l) => `• ${l.label}: <b>${l.valor}</b>`)
    .join("\n");

  return [
    `${severidadeEmoji[severidade]} — ${brand} · Gestão de Frota`,
    "",
    `<b>${title}</b>`,
    mensagem,
    ...(detalhes ? ["", detalhes] : []),
  ].join("\n");
}

export function tgChecklistNaoRealizado(params: {
  brand: string;
  veiculo: string;
  dias: number;
}): string {
  const { brand, veiculo, dias } = params;
  return baseMessage({
    brand,
    title: "Checklist não realizado",
    severidade: "atencao",
    veiculo,
    linhas:
      dias === 0
        ? [{ label: "Checklist de hoje", valor: "pendente" }]
        : [{ label: "Sem checklist há", valor: `${dias} dia(s)` }],
    mensagem:
      dias === 0
        ? "Hoje é dia de checklist e ele ainda não foi registrado para este veículo."
        : "Este veículo está sem checklist registrado. Regularize o quanto antes para manter o histórico de inspeções em dia.",
  });
}

export function tgDocumentoVencendo(params: {
  brand: string;
  veiculo: string;
  tipoDocumento: string;
  dataVencimento: string;
}): string {
  const { brand, veiculo, tipoDocumento, dataVencimento } = params;
  return baseMessage({
    brand,
    title: "Documento próximo do vencimento",
    severidade: "atencao",
    veiculo,
    linhas: [
      { label: "Documento", valor: tipoDocumento },
      { label: "Vence em", valor: dataVencimento },
    ],
    mensagem: "Providencie a renovação para evitar problemas de conformidade.",
  });
}

export function tgDocumentoVencido(params: {
  brand: string;
  veiculo: string;
  tipoDocumento: string;
  dataVencimento: string;
}): string {
  const { brand, veiculo, tipoDocumento, dataVencimento } = params;
  return baseMessage({
    brand,
    title: "Documento vencido",
    severidade: "critico",
    veiculo,
    linhas: [
      { label: "Documento", valor: tipoDocumento },
      { label: "Venceu em", valor: dataVencimento },
    ],
    mensagem: "O documento está vencido. Regularize imediatamente.",
  });
}

export function tgTrocaOleoProxima(params: {
  brand: string;
  veiculo: string;
  kmRestante: number;
}): string {
  const { brand, veiculo, kmRestante } = params;
  return baseMessage({
    brand,
    title: "Troca de óleo próxima",
    severidade: "atencao",
    veiculo,
    linhas: [{ label: "Faltam", valor: `${kmRestante.toLocaleString("pt-BR")} km` }],
    mensagem: "A próxima troca de óleo está se aproximando. Agende a manutenção preventiva.",
  });
}

export function tgTrocaOleoVencida(params: {
  brand: string;
  veiculo: string;
  kmExcedente: number;
}): string {
  const { brand, veiculo, kmExcedente } = params;
  return baseMessage({
    brand,
    title: "Troca de óleo vencida",
    severidade: "critico",
    veiculo,
    linhas: [
      { label: "Km além do previsto", valor: `${kmExcedente.toLocaleString("pt-BR")} km` },
    ],
    mensagem:
      "O veículo ultrapassou a quilometragem prevista para a troca. Providencie a manutenção o quanto antes.",
  });
}

export function tgTeste(brand: string): string {
  return baseMessage({
    brand,
    title: "Bot do Telegram funcionando",
    severidade: "info",
    linhas: [],
    mensagem:
      "Esta é uma mensagem de teste enviada pelo painel de configurações. Se você recebeu, o envio pelo Telegram está configurado corretamente.",
  });
}
