import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Configuração de envio de e-mail via SMTP.
// A configuração salva no painel (SystemSettings) tem prioridade; as
// variáveis de ambiente funcionam como fallback. Sem configuração, o envio
// é ignorado silenciosamente (apenas logado), sem quebrar a aplicação.
// ---------------------------------------------------------------------------

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  allowInvalidCert: boolean;
  from: string;
  recipients: string[];
  source: "painel" | "ambiente";
};

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await prisma.systemSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  const dbRecipients = (settings?.notificationEmails || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const envRecipients = (process.env.FROTA_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const recipients = dbRecipients.length > 0 ? dbRecipients : envRecipients;

  if (settings?.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass && settings.smtpFrom) {
    return {
      host: settings.smtpHost,
      port: settings.smtpPort,
      user: settings.smtpUser,
      pass: settings.smtpPass,
      secure: settings.smtpSecure ?? false,
      allowInvalidCert: settings.smtpAllowInvalidCert ?? false,
      from: settings.smtpFrom,
      recipients,
      source: "painel",
    };
  }

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  ) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      secure: process.env.SMTP_SECURE === "true",
      allowInvalidCert: process.env.SMTP_ALLOW_INVALID_CERT === "true",
      from: process.env.SMTP_FROM,
      recipients,
      source: "ambiente",
    };
  }

  return null;
}

export async function isSmtpConfigured(): Promise<boolean> {
  return (await getSmtpConfig()) !== null;
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendMailResult = { sent: boolean; reason?: string };

export async function sendMail({ to, subject, html }: SendMailInput): Promise<SendMailResult> {
  const config = await getSmtpConfig();

  if (!config) {
    console.warn(
      `[mailer] SMTP não configurado — e-mail "${subject}" para ${to} não foi enviado.`
    );
    return { sent: false, reason: "SMTP não configurado" };
  }

  try {
    const t = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      // Alguns provedores compartilhados (ex.: revendas) apresentam
      // certificado de outro domínio; esta opção replica o comportamento
      // tolerante de clientes como o Outlook quando habilitada no painel.
      tls: config.allowInvalidCert ? { rejectUnauthorized: false } : undefined,
    });
    await t.sendMail({ from: config.from, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] Falha ao enviar e-mail:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

// ---------------------------------------------------------------------------
// Templates simples de e-mail (HTML)
// ---------------------------------------------------------------------------

function baseTemplate(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
      <div style="background:#0f172a; padding:16px 24px;">
        <span style="color:#fff; font-size:16px; font-weight:bold;">Atende Cloud Corp</span>
      </div>
      <div style="padding:24px; border:1px solid #e5e7eb; border-top:none;">
        <h2 style="margin-top:0; font-size:18px;">${title}</h2>
        ${bodyHtml}
      </div>
      <p style="color:#9ca3af; font-size:12px; padding:12px 24px;">
        Esta é uma notificação automática do módulo de Gestão de Frota. Não responda a este e-mail.
      </p>
    </div>
  `;
}

export function templateChecklistNaoRealizado(params: {
  veiculo: string;
  dias: number;
}): { subject: string; html: string } {
  const { veiculo, dias } = params;
  return {
    subject: `Checklist pendente — ${veiculo}`,
    html: baseTemplate(
      "Checklist não realizado",
      `<p>O veículo <strong>${veiculo}</strong> está há <strong>${dias} dia(s)</strong> sem checklist registrado.</p>
       <p>Regularize o quanto antes para manter o histórico de inspeções em dia.</p>`
    ),
  };
}

export function templateDocumentoVencendo(params: {
  veiculo: string;
  tipoDocumento: string;
  dataVencimento: string;
}): { subject: string; html: string } {
  const { veiculo, tipoDocumento, dataVencimento } = params;
  return {
    subject: `Documento vencendo em breve — ${veiculo}`,
    html: baseTemplate(
      "Documento próximo do vencimento",
      `<p>O documento <strong>${tipoDocumento}</strong> do veículo <strong>${veiculo}</strong> vence em <strong>${dataVencimento}</strong>.</p>
       <p>Providencie a renovação para evitar problemas de conformidade.</p>`
    ),
  };
}

export function templateDocumentoVencido(params: {
  veiculo: string;
  tipoDocumento: string;
  dataVencimento: string;
}): { subject: string; html: string } {
  const { veiculo, tipoDocumento, dataVencimento } = params;
  return {
    subject: `Documento vencido — ${veiculo}`,
    html: baseTemplate(
      "Documento vencido",
      `<p>O documento <strong>${tipoDocumento}</strong> do veículo <strong>${veiculo}</strong> venceu em <strong>${dataVencimento}</strong>.</p>
       <p>Regularize imediatamente.</p>`
    ),
  };
}

export function templateTrocaOleoProxima(params: {
  veiculo: string;
  kmRestante: number;
}): { subject: string; html: string } {
  const { veiculo, kmRestante } = params;
  return {
    subject: `Troca de óleo próxima — ${veiculo}`,
    html: baseTemplate(
      "Troca de óleo próxima",
      `<p>Faltam <strong>${kmRestante} km</strong> para a próxima troca de óleo do veículo <strong>${veiculo}</strong>.</p>
       <p>Agende a manutenção preventiva.</p>`
    ),
  };
}

export function templateTrocaOleoVencida(params: {
  veiculo: string;
  kmExcedente: number;
}): { subject: string; html: string } {
  const { veiculo, kmExcedente } = params;
  return {
    subject: `Troca de óleo vencida — ${veiculo}`,
    html: baseTemplate(
      "Troca de óleo vencida",
      `<p>O veículo <strong>${veiculo}</strong> já rodou <strong>${kmExcedente} km</strong> além do previsto para a troca de óleo.</p>
       <p>Providencie a manutenção o quanto antes.</p>`
    ),
  };
}
