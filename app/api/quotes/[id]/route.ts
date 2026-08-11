import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";
import {canDeleteRecords, canAccessModule} from "@/lib/permissions";
import { computeQuoteTotals, computeUnitPriceFromMargin } from "@/lib/quote-calc";

type Params = { params: Promise<{ id: string }> };

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
      updatedByUser: { select: { id: true, name: true } },
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

  const itensNormalizados = data.itens.map((item) => ({
    ...item,
    valorUnitario: item.calcularPorMargem
      ? computeUnitPriceFromMargin(item.custoUnitario ?? 0, item.margemLucro ?? 0, item.freteHabilitado ? item.freteUnitario ?? 0 : 0)
      : item.valorUnitario,
  }));
  const { itensComputados, subtotal, total } = computeQuoteTotals(
    itensNormalizados,
    data.descontoGeralTipo,
    data.descontoGeralValor
  );

  const itensParaCriar = itensComputados.map((item, idx) => ({
    ordem: idx,
    tipoItem: item.tipoItem ?? "Produto",
    descricao: item.descricao,
    fotoUrl: item.fotoUrl || null,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    calcularPorMargem: item.calcularPorMargem,
    custoUnitario: item.calcularPorMargem ? item.custoUnitario ?? null : null,
    margemLucro: item.calcularPorMargem ? item.margemLucro ?? null : null,
    freteHabilitado: item.calcularPorMargem && item.freteHabilitado,
    freteUnitario: item.calcularPorMargem && item.freteHabilitado ? item.freteUnitario ?? null : null,
    descontoTipo: item.descontoTipo ?? null,
    descontoValor: item.descontoValor ?? null,
    valorTotal: item.valorTotal,
  }));

  // Ao editar, a data de emissão é sempre atualizada para o dia da edição.
  const dataEmissao = new Date();
  let dataValidade: Date | null = null;
  if (data.validadeDias) {
    dataValidade = new Date(dataEmissao);
    dataValidade.setDate(dataValidade.getDate() + data.validadeDias);
  }

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
        validadeDias: data.validadeDias ?? null,
        condicoesPagamento: data.condicoesPagamento,
        prazoEntrega: data.prazoEntrega,
        observacoes: data.observacoes,
        observacoesInternas: data.observacoesInternas,
        subtotal,
        descontoGeralTipo: data.descontoGeralTipo ?? null,
        descontoGeralValor: data.descontoGeralValor ?? null,
        total,
        visibilidade: data.visibilidade,
        updatedByUserId: session.user.id,
        itens: { createMany: { data: itensParaCriar } },
      },
      include: {
        itens: true,
        company: true,
        client: true,
        createdByUser: { select: { id: true, name: true } },
        updatedByUser: { select: { id: true, name: true } },
      },
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
