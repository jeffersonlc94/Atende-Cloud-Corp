import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule, canDeleteRecords } from "@/lib/permissions";
import { supplierSchema } from "@/lib/supplier-quotation-validation";
import { buildAuditChanges, buildAuditDeleteDetails, getRequestIp, registerAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const supplier = await prisma.supplier.findUnique({ where: { id: (await params).id } });
  return supplier ? NextResponse.json(supplier) : NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const id = (await params).id;
  const before = await prisma.supplier.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
  const parsed = supplierSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const supplier = await prisma.supplier.update({ where: { id }, data: {
    razaoSocial: d.razaoSocial, nomeFantasia: d.nomeFantasia || null, cnpjCpf: d.cnpjCpf || null,
    telefone: d.telefone || null, email: d.email || null, endereco: d.endereco || null,
    contato: d.contato || null, observacoes: d.observacoes || null,
  } });
  await registerAudit({ userId: session.user.id, acao: "update", entidade: "Supplier", entidadeId: id, detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, supplier as unknown as Record<string, unknown>), ip: getRequestIp(req) });
  return NextResponse.json(supplier);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDeleteRecords(session)) return NextResponse.json({ error: "Apenas administradores podem excluir." }, { status: 403 });
  const id = (await params).id;
  const supplier = await prisma.supplier.findUnique({ where: { id }, include: { _count: { select: { quotationItems: true, primaryQuotations: true } } } });
  if (!supplier) return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
  if (supplier._count.quotationItems || supplier._count.primaryQuotations) return NextResponse.json({ error: "Fornecedor vinculado a cotações não pode ser excluído." }, { status: 409 });
  await prisma.supplier.delete({ where: { id } });
  await registerAudit({ userId: session.user.id, acao: "delete", entidade: "Supplier", entidadeId: id, detalhes: buildAuditDeleteDetails(supplier as unknown as Record<string, unknown>), ip: getRequestIp(req) });
  return NextResponse.json({ ok: true });
}
