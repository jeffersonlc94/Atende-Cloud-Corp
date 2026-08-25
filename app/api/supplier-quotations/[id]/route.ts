import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule, canDeleteRecords } from "@/lib/permissions";
import { supplierQuotationSchema } from "@/lib/supplier-quotation-validation";
import { buildAuditChanges, buildAuditDeleteDetails, getRequestIp, registerAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };
const includeQuotation = { company: true, primarySupplier: true, createdByUser: { select: { id: true, name: true } }, updatedByUser: { select: { id: true, name: true } }, itens: { include: { supplier: true }, orderBy: { ordem: "asc" as const } } };

export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const quotation = await prisma.supplierQuotation.findUnique({ where: { id: (await params).id }, include: includeQuotation });
  return quotation ? NextResponse.json(quotation) : NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const id = (await params).id;
  const before = await prisma.supplierQuotation.findUnique({ where: { id }, include: { itens: true } });
  if (!before) return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  const parsed = supplierQuotationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const total = d.itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
  const quotation = await prisma.$transaction(async (tx) => {
    await tx.supplierQuotationItem.deleteMany({ where: { quotationId: id } });
    return tx.supplierQuotation.update({ where: { id }, data: {
      numero: d.numero || before.numero, companyId: d.companyId, tipo: d.tipo,
      primarySupplierId: d.tipo === "FornecedorUnico" ? d.primarySupplierId : null,
      referencia: d.referencia || null, dataCotacao: new Date(d.dataCotacao),
      observacoes: d.observacoes || null, observacoesInternas: d.observacoesInternas || null,
      status: d.status, total, updatedByUserId: session.user.id,
      itens: { create: d.itens.map((item, index) => ({ ordem: index,
        supplierId: d.tipo === "FornecedorUnico" ? d.primarySupplierId : item.supplierId,
        codigoProduto: item.codigoProduto || null, codigoFornecedor: item.codigoFornecedor || null,
        descricao: item.descricao, fotoUrl: item.fotoUrl || null, quantidade: item.quantidade, valorUnitario: item.valorUnitario,
        observacao: item.observacao || null, valorTotal: item.quantidade * item.valorUnitario,
      })) },
    }, include: includeQuotation });
  });
  await registerAudit({ userId: session.user.id, acao: "update", entidade: "SupplierQuotation", entidadeId: id, detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, quotation as unknown as Record<string, unknown>, { resumo: { numero: quotation.numero } }), ip: getRequestIp(req) });
  return NextResponse.json(quotation);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDeleteRecords(session)) return NextResponse.json({ error: "Apenas administradores podem excluir." }, { status: 403 });
  const id = (await params).id;
  const quotation = await prisma.supplierQuotation.findUnique({ where: { id }, include: { itens: true } });
  if (!quotation) return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  await prisma.supplierQuotation.delete({ where: { id } });
  await registerAudit({ userId: session.user.id, acao: "delete", entidade: "SupplierQuotation", entidadeId: id, detalhes: buildAuditDeleteDetails(quotation as unknown as Record<string, unknown>), ip: getRequestIp(req) });
  return NextResponse.json({ ok: true });
}
