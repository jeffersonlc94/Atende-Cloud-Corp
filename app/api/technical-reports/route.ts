import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";

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
    problemasEncontrados: text(body.problemasEncontrados), procedimentosRealizados: text(body.procedimentosRealizados), conclusao: text(body.conclusao),
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const params = req.nextUrl.searchParams;
  const numero = params.get("numero")?.trim();
  const cliente = params.get("cliente")?.trim();
  const companyId = params.get("companyId")?.trim();
  const status = params.get("status")?.trim();
  const dataInicial = params.get("dataInicial")?.trim();
  const dataFinal = params.get("dataFinal")?.trim();
  const where: Prisma.TechnicalReportWhereInput = {};
  if (numero) where.numero = { contains: numero, mode: "insensitive" };
  if (cliente) where.clienteNome = { contains: cliente, mode: "insensitive" };
  if (companyId) where.companyId = companyId;
  if (status === "Rascunho" || status === "Finalizado") where.status = status;
  if (dataInicial || dataFinal) {
    where.dataEmissao = {};
    if (dataInicial) where.dataEmissao.gte = new Date(dataInicial);
    if (dataFinal) {
      const end = new Date(dataFinal);
      end.setHours(23, 59, 59, 999);
      where.dataEmissao.lte = end;
    }
  }
  const items = await prisma.technicalReport.findMany({
    where,
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
  try {
  const item = await prisma.$transaction(async (tx) => {
    const requestedNumber = text(body.numero, 30);
    let reportNumber: string;
    if (requestedNumber) {
      reportNumber = requestedNumber;
      const numericNumber = Number.parseInt(requestedNumber, 10);
      if (/^\d+$/.test(requestedNumber) && Number.isSafeInteger(numericNumber)) {
        const counter = await tx.technicalReportCounter.findUnique({ where: { id: "default" } });
        if (!counter) await tx.technicalReportCounter.create({ data: { id: "default", lastNum: numericNumber } });
        else if (numericNumber > counter.lastNum) await tx.technicalReportCounter.update({ where: { id: "default" }, data: { lastNum: numericNumber } });
      }
    } else {
      const counter = await tx.technicalReportCounter.upsert({ where: { id: "default" }, update: { lastNum: { increment: 1 } }, create: { id: "default", lastNum: 1 } });
      reportNumber = String(counter.lastNum).padStart(6, "0");
    }
    return tx.technicalReport.create({ data: { ...data, numero: reportNumber, createdByUserId: session.user.id, updatedByUserId: session.user.id }, include: { company: true, createdByUser: { select: { id: true, name: true } } } });
  });
  await registerAudit({ userId: session.user.id, acao: "create", entidade: "TechnicalReport", entidadeId: item.id, detalhes: { numero: item.numero, cliente: item.clienteNome }, ip: getRequestIp(req) });
  return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Já existe um laudo com esse número" }, { status: 409 });
    throw error;
  }
}
