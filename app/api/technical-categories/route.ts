import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  return NextResponse.json(await prisma.technicalCategory.findMany({ orderBy: { nome: "asc" } }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos") || session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const nome = String((await req.json()).nome || "").trim().slice(0, 80);
  if (!nome) return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  try {
    const category = await prisma.technicalCategory.create({ data: { nome } });
    await registerAudit({ userId: session.user.id, acao: "create", entidade: "TechnicalCategory", entidadeId: category.id, detalhes: { nome }, ip: getRequestIp(req) });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 409 });
  }
}
