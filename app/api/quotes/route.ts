import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validations";
import { generateNextQuoteNumber } from "@/lib/quote-number";
import { Prisma } from "@prisma/client";
import { registerAudit, getRequestIp } from "@/lib/audit";
import { computeQuoteTotals } from "@/lib/quote-calc";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const numero = sp.get("numero")?.trim();
  const cliente = sp.get("cliente")?.trim();
  const companyId = sp.get("companyId")?.trim();
  const createdByUserId = sp.get("userId")?.trim();
  const dataInicial = sp.get("dataInicial")?.trim();
  const dataFinal = sp.get("dataFinal")?.trim();
  const scope = sp.get("scope") === "global" ? "global" : "mine";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, parseInt(sp.get("pageSize") ?? "20", 10) || 20);

  const where: Prisma.QuoteWhereInput = {};

  if (numero) where.numero = { contains: numero, mode: "insensitive" };
  if (companyId) where.companyId = companyId;
  if (createdByUserId) where.createdByUserId = createdByUserId;
  if (cliente) where.client = { nome: { contains: cliente, mode: "insensitive" } };

  if (dataInicial || dataFinal) {
    where.dataEmissao = {};
    if (dataInicial) where.dataEmissao.gte = new Date(dataInicial);
    if (dataFinal) {
      const end = new Date(dataFinal);
      end.setHours(23, 59, 59, 999);
      where.dataEmissao.lte = end;
    }
  }

  // Escopo "Meus Orçamentos": tudo que o próprio usuário criou (Global ou
  // Privado), inclusive para admins — cada um vê os seus.
  // Escopo "Orçamentos Globais": todos os orçamentos marcados como Global,
  // de qualquer usuário.
  if (scope === "mine") {
    // O filtro por usuário explícito (admin filtrando por criador) tem prioridade.
    if (!createdByUserId) where.createdByUserId = session.user.id;
  } else {
    where.visibilidade = "Global";
  }

  const [items, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        company: { select: { id: true, razaoSocial: true, nomeFantasia: true } },
        client: { select: { id: true, nome: true } },
        createdByUser: { select: { id: true, name: true } },
        itens: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
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

  const { itensComputados, subtotal, total } = computeQuoteTotals(
    data.itens,
    data.descontoGeralTipo,
    data.descontoGeralValor
  );

  const itensParaCriar = itensComputados.map((item, idx) => ({
    ordem: idx,
    tipoItem: item.tipoItem ?? "Produto",
    descricao: item.descricao,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    descontoTipo: item.descontoTipo ?? null,
    descontoValor: item.descontoValor ?? null,
    valorTotal: item.valorTotal,
  }));

  const dataEmissao = new Date(data.dataEmissao);
  let dataValidade: Date | null = null;
  if (data.validadeDias) {
    dataValidade = new Date(dataEmissao);
    dataValidade.setDate(dataValidade.getDate() + data.validadeDias);
  }

  const quote = await prisma.$transaction(async (tx) => {
    const numero = data.numero?.trim() || (await generateNextQuoteNumber(tx));

    return tx.quote.create({
      data: {
        numero,
        companyId: data.companyId,
        clientId: client.id,
        referencia: data.referencia,
        dataEmissao,
        dataValidade,
        validadeDias: data.validadeDias ?? null,
        condicoesPagamento: data.condicoesPagamento,
        prazoEntrega: data.prazoEntrega,
        observacoes: data.observacoes,
        subtotal,
        descontoGeralTipo: data.descontoGeralTipo ?? null,
        descontoGeralValor: data.descontoGeralValor ?? null,
        total,
        visibilidade: data.visibilidade,
        createdByUserId: session.user.id,
        itens: { createMany: { data: itensParaCriar } },
      },
      include: { itens: true, company: true, client: true },
    });
  });

  await registerAudit({
    userId: session.user.id,
    acao: "create",
    entidade: "Quote",
    entidadeId: quote.id,
    detalhes: { numero: quote.numero, total: quote.total.toString() },
    ip: getRequestIp(req),
  });

  return NextResponse.json(quote, { status: 201 });
}
