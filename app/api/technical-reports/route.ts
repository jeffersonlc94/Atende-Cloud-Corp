import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";

function text(value: unknown, max = 5000) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, max) : null;
}

function reportData(body: Record<string, unknown>) {
  return {
    dataEmissao: new Date(String(body.dataEmissao || new Date().toISOString())),
    status: body.status === "Finalizado" ? "Finalizado" as const : "Rascunho" as const,
    companyId: String(body.companyId || ""),
    clienteCodigo: text(body.clienteCodigo, 40), clienteNome: String(body.clienteNome || "").trim().slice(0, 200),
    clienteFantasia: text(body.clienteFantasia, 200), clienteEndereco: text(body.clienteEndereco, 250),
    clienteNumero: text(body.clienteNumero, 30), clienteBairro: text(body.clienteBairro, 100),
    clienteCidade: text(body.clienteCidade, 100), clienteUf: text(body.clienteUf, 2)?.toUpperCase() || null,
    clienteTelefone: text(body.clienteTelefone, 40), clienteDocumento: text(body.clienteDocumento, 30),
    equipamento: String(body.equipamento || "").trim().slice(0, 200), numeroSerie: text(body.numeroSerie, 120),
    modelo: text(body.modelo, 160), equipamentoObservacao: text(body.equipamentoObservacao, 500),
    problema: text(body.problema, 300), problemaRelatado: text(body.problemaRelatado),
    problemasEncontrados: text(body.problemasEncontrados), procedimentosRealizados: text(body.procedimentosRealizados),
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const busca = req.nextUrl.searchParams.get("q")?.trim();
  const items = await prisma.technicalReport.findMany({
    where: busca ? { OR: [{ numero: { contains: busca, mode: "insensitive" } }, { clienteNome: { contains: busca, mode: "insensitive" } }, { equipamento: { contains: busca, mode: "insensitive" } }] } : undefined,
    include: { company: true, createdByUser: { select: { id: true, name: true } }, updatedByUser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await req.json();
  const data = reportData(body);
  if (!data.companyId || !data.clienteNome || !data.equipamento) return NextResponse.json({ error: "Informe empresa, cliente e equipamento" }, { status: 400 });
  const item = await prisma.$transaction(async (tx) => {
    const counter = await tx.technicalReportCounter.upsert({ where: { id: "default" }, update: { lastNum: { increment: 1 } }, create: { id: "default", lastNum: 1 } });
    return tx.technicalReport.create({ data: { ...data, numero: String(counter.lastNum).padStart(6, "0"), createdByUserId: session.user.id, updatedByUserId: session.user.id }, include: { company: true, createdByUser: { select: { id: true, name: true } } } });
  });
  await registerAudit({ userId: session.user.id, acao: "create", entidade: "TechnicalReport", entidadeId: item.id, detalhes: { numero: item.numero, cliente: item.clienteNome }, ip: getRequestIp(req) });
  return NextResponse.json(item, { status: 201 });
}
