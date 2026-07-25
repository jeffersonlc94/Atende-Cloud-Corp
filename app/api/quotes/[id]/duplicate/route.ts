import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateNextQuoteNumber } from "@/lib/quote-number";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const original = await prisma.quote.findUnique({
    where: { id },
    include: { itens: true },
  });

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (original.visibilidade === "Privado" && !isAdmin && original.createdByUserId !== session.user.id) {
    return NextResponse.json(
      { error: "Este orçamento é privado e só pode ser duplicado por quem o criou." },
      { status: 403 }
    );
  }

  const duplicated = await prisma.$transaction(async (tx) => {
    const numero = await generateNextQuoteNumber(tx);
    const dataEmissao = new Date();
    let dataValidade: Date | null = null;
    if (original.validadeDias) {
      dataValidade = new Date(dataEmissao);
      dataValidade.setDate(dataValidade.getDate() + original.validadeDias);
    }

    return tx.quote.create({
      data: {
        numero,
        companyId: original.companyId,
        clientId: original.clientId,
        referencia: original.referencia,
        dataEmissao,
        dataValidade,
        validadeDias: original.validadeDias,
        condicoesPagamento: original.condicoesPagamento,
        prazoEntrega: original.prazoEntrega,
        observacoes: original.observacoes,
        subtotal: original.subtotal,
        descontoGeralTipo: original.descontoGeralTipo,
        descontoGeralValor: original.descontoGeralValor,
        total: original.total,
        visibilidade: original.visibilidade,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
        itens: {
          createMany: {
            data: original.itens.map((i) => ({
              ordem: i.ordem,
              tipoItem: i.tipoItem,
              descricao: i.descricao,
              fotoUrl: i.fotoUrl,
              quantidade: i.quantidade,
              valorUnitario: i.valorUnitario,
              descontoTipo: i.descontoTipo,
              descontoValor: i.descontoValor,
              valorTotal: i.valorTotal,
            })),
          },
        },
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

  return NextResponse.json(duplicated, { status: 201 });
}
