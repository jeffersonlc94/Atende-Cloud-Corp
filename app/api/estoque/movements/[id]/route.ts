import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule, canDeleteRecords } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { stockMovementSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "estoque")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = stockMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const movement = await prisma.stockMovement.update({
    where: { id },
    data: {
      cod: data.cod,
      descricao: data.descricao,
      qtd: data.qtd,
      respRetirada: data.respRetirada,
      respEntrega: data.respEntrega || null,
      data: new Date(data.data),
      numeroSerie: data.numeroSerie || null,
      destino: data.destino || null,
      devolvido: data.devolvido,
      observacoes: data.observacoes || null,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "StockMovement",
    entidadeId: movement.id,
    detalhes: { cod: movement.cod, devolvido: movement.devolvido },
    ip: getRequestIp(req),
  });

  return NextResponse.json(movement);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDeleteRecords(session)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir." }, { status: 403 });
  }

  const { id } = await params;
  const movement = await prisma.stockMovement.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "StockMovement",
    entidadeId: id,
    detalhes: { cod: movement.cod, descricao: movement.descricao },
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
