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
// Templates de e-mail (HTML)
// ---------------------------------------------------------------------------

/**
 * Nome exibido no cabeçalho dos e-mails: nome do sistema definido no painel,
 * senão a empresa emissora padrão cadastrada, senão o nome padrão.
 */
export async function getBrandName(): Promise<string> {
  const settings = await prisma.systemSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  if (settings?.systemName) return settings.systemName;

  const company = await prisma.company
    .findFirst({ where: { isDefault: true } })
    .catch(() => null);
  if (company) return company.nomeFantasia || company.razaoSocial;

  return "Atende Cloud Corp";
}

type Severidade = "critico" | "atencao" | "info";

const severidadeStyle: Record<Severidade, { bg: string; fg: string; label: string }> = {
  critico: { bg: "#fee2e2", fg: "#b91c1c", label: "URGENTE" },
  atencao: { bg: "#fef3c7", fg: "#b45309", label: "ATENÇÃO" },
  info: { bg: "#dcfce7", fg: "#15803d", label: "INFORMATIVO" },
};

function baseTemplate(params: {
  brand: string;
  title: string;
  severidade: Severidade;
  veiculo?: string;
  linhas: { label: string; valor: string }[];
  mensagem: string;
}): string {
  const { brand, title, severidade, veiculo, linhas, mensagem } = params;
  const sev = severidadeStyle[severidade];

  const detalhes = [
    ...(veiculo ? [{ label: "Veículo", valor: veiculo }] : []),
    ...linhas,
  ]
    .map(
      (l) => `
        <tr>
          <td style="padding:8px 0; color:#6b7280; font-size:13px; width:140px; vertical-align:top;">${l.label}</td>
          <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:bold;">${l.valor}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="background:#f3f4f6; padding:24px 12px; font-family: Arial, Helvetica, sans-serif;">
    <div style="max-width:560px; margin:0 auto;">
      <div style="background:#14532d; border-radius:12px 12px 0 0; padding:20px 28px;">
        <span style="color:#ffffff; font-size:18px; font-weight:bold; letter-spacing:0.3px;">${brand}</span>
        <span style="display:block; color:#86efac; font-size:12px; margin-top:2px;">Gestão de Frota</span>
      </div>
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px; padding:28px;">
        <span style="display:inline-block; background:${sev.bg}; color:${sev.fg}; font-size:11px; font-weight:bold; letter-spacing:0.5px; padding:4px 10px; border-radius:999px;">${sev.label}</span>
        <h2 style="margin:14px 0 6px; font-size:20px; color:#111827;">${title}</h2>
        <p style="margin:0 0 18px; color:#4b5563; font-size:14px; line-height:1.6;">${mensagem}</p>
        ${
          detalhes
            ? `<table style="width:100%; border-collapse:collapse; border-top:1px solid #f3f4f6;">${detalhes}</table>`
            : ""
        }
      </div>
      <p style="color:#9ca3af; font-size:12px; text-align:center; padding:16px 24px 0; line-height:1.5;">
        Notificação automática do módulo de Gestão de Frota — ${brand}.<br/>Não responda a este e-mail.
      </p>
    </div>
  </div>
  `;
}

export function templateChecklistNaoRealizado(params: {
  brand: string;
  veiculo: string;
  dias: number;
}): { subject: string; html: string } {
  const { brand, veiculo, dias } = params;
  return {
    subject: `Checklist pendente — ${veiculo}`,
    html: baseTemplate({
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
    }),
  };
}

export function templateDocumentoVencendo(params: {
  brand: string;
  veiculo: string;
  tipoDocumento: string;
  dataVencimento: string;
}): { subject: string; html: string } {
  const { brand, veiculo, tipoDocumento, dataVencimento } = params;
  return {
    subject: `Documento vencendo em breve — ${veiculo}`,
    html: baseTemplate({
      brand,
      title: "Documento próximo do vencimento",
      severidade: "atencao",
      veiculo,
      linhas: [
        { label: "Documento", valor: tipoDocumento },
        { label: "Vence em", valor: dataVencimento },
      ],
      mensagem: "Providencie a renovação para evitar problemas de conformidade.",
    }),
  };
}

export function templateDocumentoVencido(params: {
  brand: string;
  veiculo: string;
  tipoDocumento: string;
  dataVencimento: string;
}): { subject: string; html: string } {
  const { brand, veiculo, tipoDocumento, dataVencimento } = params;
  return {
    subject: `Documento vencido — ${veiculo}`,
    html: baseTemplate({
      brand,
      title: "Documento vencido",
      severidade: "critico",
      veiculo,
      linhas: [
        { label: "Documento", valor: tipoDocumento },
        { label: "Venceu em", valor: dataVencimento },
      ],
      mensagem: "O documento está vencido. Regularize imediatamente.",
    }),
  };
}

export function templateTrocaOleoProxima(params: {
  brand: string;
  veiculo: string;
  kmRestante: number;
}): { subject: string; html: string } {
  const { brand, veiculo, kmRestante } = params;
  return {
    subject: `Troca de óleo próxima — ${veiculo}`,
    html: baseTemplate({
      brand,
      title: "Troca de óleo próxima",
      severidade: "atencao",
      veiculo,
      linhas: [{ label: "Faltam", valor: `${kmRestante.toLocaleString("pt-BR")} km` }],
      mensagem: "A próxima troca de óleo está se aproximando. Agende a manutenção preventiva.",
    }),
  };
}

export function templateTrocaOleoVencida(params: {
  brand: string;
  veiculo: string;
  kmExcedente: number;
}): { subject: string; html: string } {
  const { brand, veiculo, kmExcedente } = params;
  return {
    subject: `Troca de óleo vencida — ${veiculo}`,
    html: baseTemplate({
      brand,
      title: "Troca de óleo vencida",
      severidade: "critico",
      veiculo,
      linhas: [{ label: "Km além do previsto", valor: `${kmExcedente.toLocaleString("pt-BR")} km` }],
      mensagem: "O veículo ultrapassou a quilometragem prevista para a troca. Providencie a manutenção o quanto antes.",
    }),
  };
}

export function templateTeste(brand: string): { subject: string; html: string } {
  return {
    subject: "Teste de configuração SMTP",
    html: baseTemplate({
      brand,
      title: "Configuração SMTP funcionando",
      severidade: "info",
      linhas: [],
      mensagem:
        "Este é um e-mail de teste enviado pelo painel de configurações. Se você recebeu esta mensagem, o envio de e-mails está configurado corretamente.",
    }),
  };
}
