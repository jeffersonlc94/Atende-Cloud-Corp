import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const source = await prisma.supplierQuotation.findUnique({ where: { id: (await params).id }, include: { itens: true } });
  if (!source) return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  const duplicate = await prisma.$transaction(async tx => {
    const counter = await tx.supplierQuotationCounter.upsert({ where: { id: "default" }, create: { lastNum: 1 }, update: { lastNum: { increment: 1 } } });
    return tx.supplierQuotation.create({ data: {
      numero: String(counter.lastNum).padStart(6, "0"), companyId: null, tipo: source.tipo,
      primarySupplierId: source.primarySupplierId, referencia: source.referencia ? `Cópia - ${source.referencia}` : "Cópia",
      dataCotacao: new Date(), observacoes: source.observacoes, observacoesInternas: source.observacoesInternas, fotosInternas: source.fotosInternas as Prisma.InputJsonValue,
      status: "Rascunho", total: source.total, createdByUserId: session.user.id, updatedByUserId: session.user.id,
      itens: { create: source.itens.map(i => ({ ordem: i.ordem, supplierId: i.supplierId, codigoProduto: i.codigoProduto,
        codigoFornecedor: i.codigoFornecedor, descricao: i.descricao, fotoUrl: i.fotoUrl, quantidade: i.quantidade,
        valorUnitario: i.valorUnitario, observacao: i.observacao, valorTotal: i.valorTotal })) },
    } });
  });
  await registerAudit({ userId: session.user.id, acao: "create", entidade: "SupplierQuotation", entidadeId: duplicate.id, detalhes: { numero: duplicate.numero, duplicadaDe: source.numero }, ip: getRequestIp(req) });
  return NextResponse.json(duplicate, { status: 201 });
}
