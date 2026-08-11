import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { registerAudit, getRequestIp } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  const isAdmin = session.user.role === "ADMIN";
  if (quote.visibilidade === "Privado" && !isAdmin && quote.createdByUserId !== session.user.id) {
    return NextResponse.json({ error: "Você não pode reabrir este orçamento." }, { status: 403 });
  }
  if (quote.status !== "Aprovado") {
    return NextResponse.json({ error: "Somente orçamentos aprovados precisam ser reabertos." }, { status: 409 });
  }

  const reopened = await prisma.quote.update({
    where: { id },
    data: { status: "Negociacao", updatedByUserId: session.user.id },
  });
  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "Quote",
    entidadeId: id,
    detalhes: { numero: quote.numero, statusAnterior: "Aprovado", statusNovo: "Negociacao", reaberto: true },
    ip: getRequestIp(req),
  });
  return NextResponse.json(reopened);
}
