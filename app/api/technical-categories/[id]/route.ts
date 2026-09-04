import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { buildAuditChanges, buildAuditDeleteDetails, getRequestIp, registerAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos") || session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const id = (await params).id;
  const nome = String((await req.json()).nome || "").trim().slice(0, 80);
  if (!nome) return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  const before = await prisma.technicalCategory.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  try {
    const category = await prisma.technicalCategory.update({ where: { id }, data: { nome } });
    await registerAudit({ userId: session.user.id, acao: "update", entidade: "TechnicalCategory", entidadeId: id, detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, category as unknown as Record<string, unknown>), ip: getRequestIp(req) });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Não foi possível renomear. Verifique se o nome já existe." }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos") || session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const id = (await params).id;
  const category = await prisma.technicalCategory.findUnique({ where: { id }, include: { _count: { select: { files: true } } } });
  if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  if (category._count.files > 0) return NextResponse.json({ error: `A categoria possui ${category._count.files} arquivo(s) vinculado(s).` }, { status: 409 });
  await prisma.technicalCategory.delete({ where: { id } });
  await registerAudit({ userId: session.user.id, acao: "delete", entidade: "TechnicalCategory", entidadeId: id, detalhes: buildAuditDeleteDetails(category as unknown as Record<string, unknown>), ip: getRequestIp(req) });
  return NextResponse.json({ ok: true });
}
