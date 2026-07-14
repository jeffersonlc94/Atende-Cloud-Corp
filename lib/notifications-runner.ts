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
// Núcleo da rotina de notificações da Frota, compartilhado entre o botão
// manual (API) e o agendador interno (instrumentation.ts).
// O anti-reenvio é POR CANAL: cada canal tem seu próprio registro diário,
// permitindo horários/dias diferentes para e-mail e Telegram.
// ---------------------------------------------------------------------------

export type RunChannels = { email: boolean; telegram: boolean };

export type RunSummary = {
  ok: true;
  smtpConfigured: boolean;
  telegramConfigured: boolean;
  recipients: string[];
  processed: number;
  sent: number;
  sentTelegram: number;
  skippedDuplicate: number;
  skippedNoSmtp: number;
  errors: string[];
};

function destinationEmails(): string[] {
  const raw = process.env.FROTA_NOTIFICATION_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

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
  return alerts.filter(
    (a) => a.tipo === "documento" || a.tipo === "troca_oleo" || a.tipo === "checklist"
  );
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
    const tipoDocumento = alert.titulo
      .replace(/^Documento (vencido|vencendo) \(/, "")
      .replace(/\)$/, "");
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
    const tipoDocumento = alert.titulo
      .replace(/^Documento (vencido|vencendo) \(/, "")
      .replace(/\)$/, "");
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

/**
 * Executa a rotina para os canais solicitados. Os toggles de ativado/pausado
 * do painel já devem ter sido aplicados pelo chamador (manual ou agendador).
 */
export async function runFleetNotifications(channels: RunChannels): Promise<RunSummary> {
  const smtpConfig = channels.email ? await getSmtpConfig() : null;
  const smtpConfigured = smtpConfig !== null;
  const envRecipients = smtpConfig?.recipients?.length
    ? smtpConfig.recipients
    : destinationEmails();

  const telegramConfig = channels.telegram ? await getTelegramConfig() : null;

  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  const prefs = (settings?.notificationCargoPrefs as NotificationCargoPrefs | null) ?? null;

  const brand = await getBrandName();
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

    // Anti-reenvio por canal e por dia.
    const emailDuplicate = !channels.email || (await alreadySentToday(alert.tipo, `email:${alert.id}`));
    const telegramDuplicate =
      !channels.telegram || (await alreadySentToday(alert.tipo, `telegram:${alert.id}`));

    if (emailDuplicate && telegramDuplicate) {
      skippedDuplicate++;
      continue;
    }

    const { emails, telegramChatIds } = await recipientsForAlert(alert, envRecipients, prefs);

    const allChatIds = telegramConfig
      ? Array.from(new Set([...telegramConfig.chatIds, ...telegramChatIds]))
      : [];

    const canEmail = !emailDuplicate && smtpConfigured && emails.length > 0;
    const canTelegram = !telegramDuplicate && telegramConfig !== null && allChatIds.length > 0;

    if (!canEmail && !canTelegram) {
      skippedNoSmtp++;
      continue;
    }

    if (canEmail) {
      const email = buildEmail(alert, brand);
      if (email) {
        for (const to of emails) {
          allRecipientsUsed.add(to);
          const result = await sendMail({ to, subject: email.subject, html: email.html });
          if (result.sent) {
            sent++;
          } else if (result.reason) {
            errors.push(result.reason);
          }
        }
        await prisma.notificationLog.create({
          data: {
            tipo: alert.tipo,
            referencia: `email:${alert.id}`,
            destinatario: emails.join(", "),
          },
        });
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
        await prisma.notificationLog.create({
          data: {
            tipo: alert.tipo,
            referencia: `telegram:${alert.id}`,
            destinatario: allChatIds.map((id) => `telegram:${id}`).join(", "),
          },
        });
      }
    }
  }

  return {
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
  };
}

// ---------------------------------------------------------------------------
// Agendamento por canal (dias da semana + horário).
// ---------------------------------------------------------------------------

export function parseDays(raw: string | null | undefined): number[] {
  return (raw || "")
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !Number.isNaN(d));
}

/** Um canal está no horário agendado quando: dia habilitado E horário bate (HH:MM). */
export function isChannelDue(params: {
  days: number[];
  time: string | null | undefined;
  now: Date;
}): boolean {
  const { days, time, now } = params;
  if (days.length > 0 && !days.includes(now.getDay())) return false;
  const target = (time || "08:00").slice(0, 5);
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return current === target;
}

/**
 * Chamado a cada minuto pelo agendador interno. Verifica cada canal
 * (ativado + dia + horário) e dispara apenas os canais elegíveis agora.
 */
export async function runScheduledNotifications(now = new Date()): Promise<RunSummary | null> {
  const settings = await prisma.systemSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  if (!settings) return null;

  const emailDue =
    (settings.smtpEnabled ?? true) &&
    isChannelDue({ days: parseDays(settings.notificationDays), time: settings.notificationTime, now });

  const telegramDue =
    (settings.telegramEnabled ?? true) &&
    isChannelDue({ days: parseDays(settings.telegramDays), time: settings.telegramTime, now });

  if (!emailDue && !telegramDue) return null;

  return runFleetNotifications({ email: emailDue, telegram: telegramDue });
}
