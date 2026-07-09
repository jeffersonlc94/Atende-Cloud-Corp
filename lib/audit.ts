import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction = "create" | "update" | "delete";

export type AuditEntity =
  | "Company"
  | "Quote"
  | "Vehicle"
  | "Maintenance"
  | "OilChange"
  | "Checklist"
  | "User";

export type RegisterAuditParams = {
  userId?: string | null;
  acao: AuditAction;
  entidade: AuditEntity;
  entidadeId?: string | null;
  detalhes?: Prisma.InputJsonValue | null;
  ip?: string | null;
};

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
