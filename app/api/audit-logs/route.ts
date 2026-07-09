import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewAuditLog } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewAuditLog(session)) {
    return NextResponse.json({ error: "Apenas administradores podem visualizar a auditoria." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const userId = sp.get("userId")?.trim();
  const entidade = sp.get("entidade")?.trim();
  const dataInicial = sp.get("dataInicial")?.trim();
  const dataFinal = sp.get("dataFinal")?.trim();
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, parseInt(sp.get("pageSize") ?? "20", 10) || 20);

  const where: Prisma.AuditLogWhereInput = {};
  if (userId) where.userId = userId;
  if (entidade) where.entidade = entidade;
  if (dataInicial || dataFinal) {
    where.createdAt = {};
    if (dataInicial) where.createdAt.gte = new Date(dataInicial);
    if (dataFinal) {
      const end = new Date(dataFinal);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
