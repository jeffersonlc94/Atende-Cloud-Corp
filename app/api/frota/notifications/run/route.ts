import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeFleetAlerts, type FleetAlert } from "@/lib/frota-alerts";
import {
  isSmtpConfigured,
  sendMail,
  templateChecklistNaoRealizado,
  templateDocumentoVencendo,
  templateDocumentoVencido,
  templateTrocaOleoProxima,
  templateTrocaOleoVencida,
} from "@/lib/mailer";

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

function buildEmail(alert: FleetAlert): { subject: string; html: string } | null {
  if (alert.tipo === "checklist") {
    return templateChecklistNaoRealizado({ veiculo: alert.descricao, dias: 7 });
  }

  if (alert.tipo === "documento") {
    const vencido = alert.severidade === "critico";
    const tipoDocumento = alert.titulo.replace(/^Documento (vencido|vencendo) \(/, "").replace(/\)$/, "");
    const dataVencimento = alert.data ? new Date(alert.data).toLocaleDateString("pt-BR") : "—";
    return vencido
      ? templateDocumentoVencido({ veiculo: alert.descricao, tipoDocumento, dataVencimento })
      : templateDocumentoVencendo({ veiculo: alert.descricao, tipoDocumento, dataVencimento });
  }

  if (alert.tipo === "troca_oleo") {
    const vencido = alert.severidade === "critico";
    const match = alert.descricao.match(/(\d+)/g);
    const numero = match ? Number(match[match.length - 1]) : 0;
    return vencido
      ? templateTrocaOleoVencida({ veiculo: alert.descricao, kmExcedente: numero })
      : templateTrocaOleoProxima({ veiculo: alert.descricao, kmRestante: numero });
  }

  return null;
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const smtpConfigured = isSmtpConfigured();
  const recipients = destinationEmails();

  const alerts = relevantAlerts(await computeFleetAlerts());

  let processed = 0;
  let sent = 0;
  let skippedDuplicate = 0;
  let skippedNoSmtp = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    processed++;

    const duplicate = await alreadySentToday(alert.tipo, alert.id);
    if (duplicate) {
      skippedDuplicate++;
      continue;
    }

    const email = buildEmail(alert);
    if (!email) continue;

    if (!smtpConfigured || recipients.length === 0) {
      skippedNoSmtp++;
      continue;
    }

    for (const to of recipients) {
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
        referencia: alert.id,
        destinatario: recipients.join(", "),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    smtpConfigured,
    recipients,
    processed,
    sent,
    skippedDuplicate,
    skippedNoSmtp,
    errors: errors.slice(0, 10),
  });
}
