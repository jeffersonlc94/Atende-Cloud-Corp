import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";
import {canDeleteRecords, canAccessModule} from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

function computeItemTotal(quantidade: number, valorUnitario: number) {
  return Math.round(quantidade * valorUnitario * 100) / 100;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      company: true,
      client: true,
      createdByUser: { select: { id: true, name: true } },
      itens: { orderBy: { ordem: "asc" } },
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (quote.visibilidade === "Privado" && !isAdmin && quote.createdByUserId !== session.user.id) {
    return NextResponse.json(
      { error: "Este orçamento é privado e só pode ser visualizado por quem o criou." },
      { status: 403 }
    );
  }

  return NextResponse.json(quote);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const existingQuote = await prisma.quote.findUnique({
    where: { id },
    select: { visibilidade: true, createdByUserId: true },
  });
  if (!existingQuote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (existingQuote.visibilidade === "Privado" && !isAdmin && existingQuote.createdByUserId !== session.user.id) {
    return NextResponse.json(
      { error: "Este orçamento é privado e só pode ser editado por quem o criou." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const clientNome = data.clientNome.trim();
  const client =
    (await prisma.client.findFirst({
      where: { nome: { equals: clientNome, mode: "insensitive" } },
    })) ?? (await prisma.client.create({ data: { nome: clientNome } }));

  const itensComputados = data.itens.map((item, idx) => ({
    ordem: idx,
    descricao: item.descricao,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    valorTotal: computeItemTotal(item.quantidade, item.valorUnitario),
  }));

  const total = itensComputados.reduce((acc, i) => acc + i.valorTotal, 0);

  const dataEmissao = new Date(data.dataEmissao);
  const dataValidade = new Date(dataEmissao);
  dataValidade.setDate(dataValidade.getDate() + data.validadeDias);

  const quote = await prisma.$transaction(async (tx) => {
    await tx.quoteItem.deleteMany({ where: { quoteId: id } });

    return tx.quote.update({
      where: { id },
      data: {
        numero: data.numero?.trim() || undefined,
        companyId: data.companyId,
        clientId: client.id,
        referencia: data.referencia,
        dataEmissao,
        dataValidade,
        validadeDias: data.validadeDias,
        condicoesPagamento: data.condicoesPagamento,
        prazoEntrega: data.prazoEntrega,
        observacoes: data.observacoes,
        total,
        visibilidade: data.visibilidade,
        itens: { createMany: { data: itensComputados } },
      },
      include: { itens: true, company: true, client: true },
    });
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "Quote",
    entidadeId: quote.id,
    detalhes: { numero: quote.numero, total: quote.total.toString() },
    ip: getRequestIp(req),
  });

  return NextResponse.json(quote);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }
  if (!canDeleteRecords(session)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir orçamentos." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.quote.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "Quote",
    entidadeId: id,
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
