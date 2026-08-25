import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { supplierQuotationSchema, supplierQuotationStatuses } from "@/lib/supplier-quotation-validation";
import { getRequestIp, registerAudit } from "@/lib/audit";

const includeQuotation = {
  company: true,
  primarySupplier: true,
  createdByUser: { select: { id: true, name: true } },
  updatedByUser: { select: { id: true, name: true } },
  itens: { include: { supplier: true }, orderBy: { ordem: "asc" as const } },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const where: Prisma.SupplierQuotationWhereInput = {};
  const numero = sp.get("numero")?.trim();
  const referencia = sp.get("referencia")?.trim();
  const supplierId = sp.get("supplierId")?.trim();
  const status = sp.get("status")?.trim();
  const tipo = sp.get("tipo")?.trim();
  if (numero) where.numero = { contains: numero, mode: "insensitive" };
  if (referencia) where.referencia = { contains: referencia, mode: "insensitive" };
  if (supplierId) where.OR = [{ primarySupplierId: supplierId }, { itens: { some: { supplierId } } }];
  if (status && supplierQuotationStatuses.includes(status as (typeof supplierQuotationStatuses)[number])) where.status = status as (typeof supplierQuotationStatuses)[number];
  if (tipo === "FornecedorUnico" || tipo === "MultiplosFornecedores") where.tipo = tipo;
  const initial = sp.get("dataInicial");
  const final = sp.get("dataFinal");
  if (initial || final) {
    where.dataCotacao = {};
    if (initial) where.dataCotacao.gte = new Date(initial);
    if (final) { const end = new Date(final); end.setHours(23, 59, 59, 999); where.dataCotacao.lte = end; }
  }
  const items = await prisma.supplierQuotation.findMany({ where, include: includeQuotation, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const parsed = supplierQuotationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const total = d.itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
  const quotation = await prisma.$transaction(async (tx) => {
    let numero = d.numero;
    if (!numero) {
      const counter = await tx.supplierQuotationCounter.upsert({ where: { id: "default" }, create: { lastNum: 1 }, update: { lastNum: { increment: 1 } } });
      numero = String(counter.lastNum).padStart(6, "0");
    }
    return tx.supplierQuotation.create({
      data: {
        numero, companyId: d.companyId, tipo: d.tipo,
        primarySupplierId: d.tipo === "FornecedorUnico" ? d.primarySupplierId : null,
        referencia: d.referencia || null, dataCotacao: new Date(d.dataCotacao),
        observacoes: d.observacoes || null, observacoesInternas: d.observacoesInternas || null,
        status: d.status, total, createdByUserId: session.user.id, updatedByUserId: session.user.id,
        itens: { create: d.itens.map((item, index) => ({
          ordem: index,
          supplierId: d.tipo === "FornecedorUnico" ? d.primarySupplierId : item.supplierId,
          codigoProduto: item.codigoProduto || null, codigoFornecedor: item.codigoFornecedor || null,
          descricao: item.descricao, fotoUrl: item.fotoUrl || null, quantidade: item.quantidade, valorUnitario: item.valorUnitario,
          observacao: item.observacao || null, valorTotal: item.quantidade * item.valorUnitario,
        })) },
      },
      include: includeQuotation,
    });
  });
  await registerAudit({ userId: session.user.id, acao: "create", entidade: "SupplierQuotation", entidadeId: quotation.id, detalhes: { numero: quotation.numero, total }, ip: getRequestIp(req) });
  return NextResponse.json(quotation, { status: 201 });
}
