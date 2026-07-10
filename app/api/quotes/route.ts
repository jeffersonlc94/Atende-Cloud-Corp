import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validations";
import { generateNextQuoteNumber } from "@/lib/quote-number";
import { Prisma } from "@prisma/client";
import { registerAudit, getRequestIp } from "@/lib/audit";

function computeItemTotal(quantidade: number, valorUnitario: number) {
  return Math.round(quantidade * valorUnitario * 100) / 100;
}

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

  const isAdmin = session.user.role === "ADMIN";

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

  // Escopo "Meus Orçamentos": tudo que o usuário criou (Global ou Privado).
  // Admin vê tudo em ambos os modos, mas mantém o mesmo toggle na UI.
  // Escopo "Orçamentos Globais": todos os orçamentos marcados como Global no sistema.
  if (!isAdmin) {
    if (scope === "mine") {
      where.createdByUserId = session.user.id;
    } else {
      where.visibilidade = "Global";
    }
  } else if (scope === "global") {
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
    const numero = data.numero?.trim() || (await generateNextQuoteNumber(tx));

    return tx.quote.create({
      data: {
        numero,
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
        createdByUserId: session.user.id,
        itens: { createMany: { data: itensComputados } },
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
