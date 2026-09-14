import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction = "create" | "update" | "delete" | "backup" | "download";

export type AuditEntity =
  | "Company"
  | "Quote"
  | "Vehicle"
  | "Maintenance"
  | "OilChange"
  | "Checklist"
  | "User"
  | "SystemSettings"
  | "Database"
  | "StockMovement"
  | "Supplier"
  | "SupplierQuotation"
  | "TechnicalFile"
  | "TechnicalCategory"
  | "TechnicalOption"
  | "TechnicalReport";

export type RegisterAuditParams = {
  userId?: string | null;
  acao: AuditAction;
  entidade: AuditEntity;
  entidadeId?: string | null;
  detalhes?: Prisma.InputJsonValue | null;
  ip?: string | null;
};

const SENSITIVE_FIELD = /password|senha|secret|token|smtpPass|passwordHash/i;
const DEFAULT_IGNORED_FIELDS = new Set(["id", "createdAt", "updatedAt"]);

function normalizeAuditValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeAuditValue);
  if (typeof value === "object") {
    if ("toNumber" in value && typeof (value as { toNumber?: unknown }).toNumber === "function") {
      return Number(String(value));
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SENSITIVE_FIELD.test(key))
        .map(([key, item]) => [key, normalizeAuditValue(item)])
    );
  }
  return String(value);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeAuditValue(a)) === JSON.stringify(normalizeAuditValue(b));
}

/** Gera um diff seguro e serializável para registros de atualização. */
export function buildAuditChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  options?: { ignore?: string[]; resumo?: Record<string, unknown> }
): Prisma.InputJsonValue {
  const ignored = new Set([...DEFAULT_IGNORED_FIELDS, ...(options?.ignore ?? [])]);
  const alteracoes: Record<string, Prisma.InputJsonValue> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (ignored.has(key) || SENSITIVE_FIELD.test(key) || valuesEqual(before[key], after[key])) continue;
    alteracoes[key] = {
      de: normalizeAuditValue(before[key]),
      para: normalizeAuditValue(after[key]),
    } as Prisma.InputJsonValue;
  }
  return {
    ...(options?.resumo ? normalizeAuditValue(options.resumo) as Record<string, Prisma.InputJsonValue> : {}),
    camposAlterados: Object.keys(alteracoes).length,
    alteracoes,
  } as Prisma.InputJsonValue;
}

/** Preserva os dados relevantes de um registro antes que ele seja apagado. */
export function buildAuditDeleteDetails(
  record: Record<string, unknown>,
  options?: { ignore?: string[]; resumo?: Record<string, unknown> }
): Prisma.InputJsonValue {
  const ignored = new Set([...DEFAULT_IGNORED_FIELDS, ...(options?.ignore ?? [])]);
  const snapshot = Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => !ignored.has(key) && !SENSITIVE_FIELD.test(key))
      .map(([key, value]) => [key, normalizeAuditValue(value)])
  );
  return {
    ...(options?.resumo ? normalizeAuditValue(options.resumo) as Record<string, Prisma.InputJsonValue> : {}),
    registroExcluido: snapshot,
  } as Prisma.InputJsonValue;
}

/**
 * Registra uma ação de auditoria. Nunca lança erro — falhas de auditoria
 * não devem impedir a operação principal, apenas são logadas no console.
 */
export async function registerAudit({
  userId,
  acao,
  entidade,
  entidadeId,
  detalhes,
  ip,
}: RegisterAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        acao,
        entidade,
        entidadeId: entidadeId ?? null,
        detalhes: detalhes ?? Prisma.JsonNull,
        ip: ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] Falha ao registrar log de auditoria:", err);
  }
}

/** Extrai o IP do cliente a partir dos headers de uma requisição Next.js. */
export function getRequestIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
