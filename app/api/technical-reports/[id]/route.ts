import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };
const include = { company: true, createdByUser: { select: { id: true, name: true } }, updatedByUser: { select: { id: true, name: true } } } as const;
function text(value: unknown, max = 5000) { const valueText = String(value ?? "").trim(); return valueText ? valueText.slice(0, max) : null; }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const item = await prisma.technicalReport.findUnique({ where: { id: (await params).id }, include });
  return item ? NextResponse.json(item) : NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = (await params).id;
  const current = await prisma.technicalReport.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  const body = await req.json();
  const data = {
    dataEmissao: new Date(String(body.dataEmissao || current.dataEmissao)), status: body.status === "Finalizado" ? "Finalizado" as const : "Rascunho" as const,
    companyId: String(body.companyId || ""), clienteCodigo: text(body.clienteCodigo, 40), clienteNome: String(body.clienteNome || "").trim().slice(0, 200),
    clienteFantasia: text(body.clienteFantasia, 200), clienteEndereco: text(body.clienteEndereco, 250), clienteNumero: text(body.clienteNumero, 30), clienteBairro: text(body.clienteBairro, 100), clienteCidade: text(body.clienteCidade, 100), clienteUf: text(body.clienteUf, 2)?.toUpperCase() || null, clienteTelefone: text(body.clienteTelefone, 40), clienteDocumento: text(body.clienteDocumento, 30),
    equipamento: String(body.equipamento || "").trim().slice(0, 200), numeroSerie: text(body.numeroSerie, 120), modelo: text(body.modelo, 160), equipamentoObservacao: text(body.equipamentoObservacao, 500), problema: text(body.problema, 300), problemaRelatado: text(body.problemaRelatado), problemasEncontrados: text(body.problemasEncontrados), procedimentosRealizados: text(body.procedimentosRealizados), updatedByUserId: session.user.id,
  };
  if (!data.companyId || !data.clienteNome || !data.equipamento) return NextResponse.json({ error: "Informe empresa, cliente e equipamento" }, { status: 400 });
  const item = await prisma.technicalReport.update({ where: { id }, data, include });
  await registerAudit({ userId: session.user.id, acao: "update", entidade: "TechnicalReport", entidadeId: id, detalhes: { numero: item.numero }, ip: getRequestIp(req) });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Apenas administradores podem excluir laudos" }, { status: 403 });
  const id = (await params).id;
  const item = await prisma.technicalReport.delete({ where: { id } });
  await registerAudit({ userId: session.user.id, acao: "delete", entidade: "TechnicalReport", entidadeId: id, detalhes: { numero: item.numero }, ip: getRequestIp(req) });
  return NextResponse.json({ ok: true });
}
