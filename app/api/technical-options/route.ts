import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";

const kinds = ["Fabricante", "Produto", "SistemaOperacional"] as const;
type Kind = (typeof kinds)[number];
const isKind = (value: string): value is Kind => kinds.includes(value as Kind);

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  return NextResponse.json(await prisma.technicalOption.findMany({ orderBy: [{ kind: "asc" }, { nome: "asc" }] }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos") || session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await req.json();
  const kind = String(body.kind || "");
  const nome = String(body.nome || "").trim().slice(0, 160);
  if (!isKind(kind) || !nome) return NextResponse.json({ error: "Informe o tipo e o nome" }, { status: 400 });
  try {
    const option = await prisma.technicalOption.create({ data: { kind, nome } });
    await registerAudit({ userId: session.user.id, acao: "create", entidade: "TechnicalOption", entidadeId: option.id, detalhes: { kind, nome }, ip: getRequestIp(req) });
    return NextResponse.json(option, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Esse cadastro já existe" }, { status: 409 });
  }
}
