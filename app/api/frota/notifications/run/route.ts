import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { computeFleetAlerts, type FleetAlert } from "@/lib/frota-alerts";
import {
  alertToNotificationTipo,
  isNotificationAllowedForCargo,
  type NotificationCargoPrefs,
} from "@/lib/notification-prefs";
import {
  getSmtpConfig,
  getBrandName,
  sendMail,
  templateChecklistNaoRealizado,
  templateDocumentoVencendo,
  templateDocumentoVencido,
  templateTrocaOleoProxima,
  templateTrocaOleoVencida,
} from "@/lib/mailer";
import {
  getTelegramConfig,
  sendTelegram,
  tgChecklistNaoRealizado,
  tgDocumentoVencendo,
  tgDocumentoVencido,
  tgTrocaOleoProxima,
  tgTrocaOleoVencida,
} from "@/lib/telegram";

// ---------------------------------------------------------------------------
// Rotina de notificações da Frota.
// Detecta condições (checklist não realizado, documento vencendo/vencido,
// troca de óleo próxima/vencida) usando lib/frota-alerts.ts e dispara
// e-mails, evitando reenvio no mesmo dia através do NotificationLog.
//
// Pode ser chamada manualmente (botão em Configurações) ou por um cron
// externo (ex.: `curl -X POST .../api/frota/notifications/run`).
// ---------------------------------------------------------------------------

function destinationEmails(): string[] {
  const raw = process.env.FROTA_NOTIFICATION_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Monta a lista de destinatários para um alerta, combinando os e-mails fixos
 * (FROTA_NOTIFICATION_EMAILS) com os e-mails de usuários cadastrados,
 * filtrados pelas preferências de notificação por cargo (Configurações >
 * Notificações). Usuários sem cargo definido sempre recebem (compatibilidade
 * com o comportamento anterior).
 */
async function recipientsForAlert(
  alert: FleetAlert,
  envRecipients: string[],
  prefs: NotificationCargoPrefs | null
): Promise<{ emails: string[]; telegramChatIds: string[] }> {
  const tipoNotificacao = alertToNotificationTipo(alert.tipo, alert.severidade);
  if (!tipoNotificacao) return { emails: envRecipients, telegramChatIds: [] };

  const users = await prisma.user.findMany({
    where: { receiveNotifications: true },
    select: { email: true, cargo: true, telegramChatId: true },
  });

  const allowed = users.filter((u) =>
    isNotificationAllowedForCargo(prefs, u.cargo, tipoNotificacao)
  );

  const userEmails = allowed.map((u) => u.email);
  const telegramChatIds = allowed
    .map((u) => u.telegramChatId?.trim())
    .filter((id): id is string => Boolean(id));

  // Domínios internos (ex.: admin@atende.local do seed) não são entregáveis
  // e fazem o servidor SMTP rejeitar o envio inteiro.
  const emails = Array.from(new Set([...envRecipients, ...userEmails])).filter(
    (email) => !email.toLowerCase().endsWith(".local")
  );

  return { emails, telegramChatIds: Array.from(new Set(telegramChatIds)) };
}

function relevantAlerts(alerts: FleetAlert[]): FleetAlert[] {
  return alerts.filter((a) => a.tipo === "documento" || a.tipo === "troca_oleo" || a.tipo === "checklist");
}

async function alreadySentToday(tipo: string, referencia: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await prisma.notificationLog.findFirst({
    where: { tipo, referencia, enviadoEm: { gte: startOfDay } },
  });

  return Boolean(existing);
}

function buildEmail(alert: FleetAlert, brand: string): { subject: string; html: string } | null {
  const veiculo = alert.veiculo ?? alert.descricao;

  if (alert.tipo === "checklist") {
    return templateChecklistNaoRealizado({ brand, veiculo, dias: 7 });
  }

  if (alert.tipo === "documento") {
    const vencido = alert.severidade === "critico";
    const tipoDocumento = alert.titulo.replace(/^Documento (vencido|vencendo) \(/, "").replace(/\)$/, "");
    const dataVencimento = alert.data ? new Date(alert.data).toLocaleDateString("pt-BR") : "—";
    return vencido
      ? templateDocumentoVencido({ brand, veiculo, tipoDocumento, dataVencimento })
      : templateDocumentoVencendo({ brand, veiculo, tipoDocumento, dataVencimento });
  }

  if (alert.tipo === "troca_oleo") {
    const vencido = alert.severidade === "critico";
    const match = alert.descricao.match(/(\d+)/g);
    const numero = match ? Number(match[match.length - 1]) : 0;
    return vencido
      ? templateTrocaOleoVencida({ brand, veiculo, kmExcedente: numero })
      : templateTrocaOleoProxima({ brand, veiculo, kmRestante: numero });
  }

  return null;
}

function buildTelegramMessage(alert: FleetAlert, brand: string): string | null {
  const veiculo = alert.veiculo ?? alert.descricao;

  if (alert.tipo === "checklist") {
    return tgChecklistNaoRealizado({ brand, veiculo, dias: 7 });
  }

  if (alert.tipo === "documento") {
    const vencido = alert.severidade === "critico";
    const tipoDocumento = alert.titulo.replace(/^Documento (vencido|vencendo) \(/, "").replace(/\)$/, "");
    const dataVencimento = alert.data ? new Date(alert.data).toLocaleDateString("pt-BR") : "—";
    return vencido
      ? tgDocumentoVencido({ brand, veiculo, tipoDocumento, dataVencimento })
      : tgDocumentoVencendo({ brand, veiculo, tipoDocumento, dataVencimento });
  }

  if (alert.tipo === "troca_oleo") {
    const vencido = alert.severidade === "critico";
    const match = alert.descricao.match(/(\d+)/g);
    const numero = match ? Number(match[match.length - 1]) : 0;
    return vencido
      ? tgTrocaOleoVencida({ brand, veiculo, kmExcedente: numero })
      : tgTrocaOleoProxima({ brand, veiculo, kmRestante: numero });
  }

  return null;
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const smtpConfig = await getSmtpConfig();
  const smtpConfigured = smtpConfig !== null;
  // Destinatários fixos: os do painel de configurações têm prioridade sobre
  // a variável de ambiente FROTA_NOTIFICATION_EMAILS.
  const envRecipients = smtpConfig?.recipients?.length ? smtpConfig.recipients : destinationEmails();

  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  const prefs = (settings?.notificationCargoPrefs as NotificationCargoPrefs | null) ?? null;

  // Dias da semana habilitados para envio (Configurações > Notificações).
  // Vazio/não configurado = envia todos os dias.
  const diasHabilitados = (settings?.notificationDays || "")
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !Number.isNaN(d));
  const hoje = new Date().getDay();
  if (diasHabilitados.length > 0 && !diasHabilitados.includes(hoje)) {
    return NextResponse.json({
      ok: true,
      smtpConfigured,
      skippedByDay: true,
      message: "Hoje não é um dia habilitado para envio de avisos.",
      processed: 0,
      sent: 0,
      skippedDuplicate: 0,
      skippedNoSmtp: 0,
      errors: [],
    });
  }

  const brand = await getBrandName();
  const telegramConfig = await getTelegramConfig();
  const alerts = relevantAlerts(await computeFleetAlerts());

  let processed = 0;
  let sent = 0;
  let sentTelegram = 0;
  let skippedDuplicate = 0;
  let skippedNoSmtp = 0;
  const errors: string[] = [];
  const allRecipientsUsed = new Set<string>();

  for (const alert of alerts) {
    processed++;

    const duplicate = await alreadySentToday(alert.tipo, alert.id);
    if (duplicate) {
      skippedDuplicate++;
      continue;
    }

    const email = buildEmail(alert, brand);
    if (!email) continue;

    const { emails, telegramChatIds } = await recipientsForAlert(alert, envRecipients, prefs);

    // Telegram: chats fixos do painel + chats dos usuários habilitados.
    const allChatIds = telegramConfig
      ? Array.from(new Set([...telegramConfig.chatIds, ...telegramChatIds]))
      : [];

    const canEmail = smtpConfigured && emails.length > 0;
    const canTelegram = telegramConfig !== null && allChatIds.length > 0;

    if (!canEmail && !canTelegram) {
      skippedNoSmtp++;
      continue;
    }

    if (canEmail) {
      for (const to of emails) {
        allRecipientsUsed.add(to);
        const result = await sendMail({ to, subject: email.subject, html: email.html });
        if (result.sent) {
          sent++;
        } else if (result.reason) {
          errors.push(result.reason);
        }
      }
    }

    if (canTelegram) {
      const message = buildTelegramMessage(alert, brand);
      if (message) {
        for (const chatId of allChatIds) {
          allRecipientsUsed.add(`telegram:${chatId}`);
          const result = await sendTelegram(telegramConfig!.botToken, chatId, message);
          if (result.sent) {
            sentTelegram++;
          } else if (result.reason) {
            errors.push(`Telegram (${chatId}): ${result.reason}`);
          }
        }
      }
    }

    await prisma.notificationLog.create({
      data: {
        tipo: alert.tipo,
        referencia: alert.id,
        destinatario: [
          ...emails,
          ...allChatIds.map((id) => `telegram:${id}`),
        ].join(", "),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    smtpConfigured,
    telegramConfigured: telegramConfig !== null,
    recipients: Array.from(allRecipientsUsed),
    processed,
    sent,
    sentTelegram,
    skippedDuplicate,
    skippedNoSmtp,
    errors: errors.slice(0, 10),
  });
}
