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
  const before = await prisma.technicalOption.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Cadastro não encontrado" }, { status: 404 });
  const nome = String((await req.json()).nome || "").trim().slice(0, 160);
  if (!nome) return NextResponse.json({ error: "Informe o nome" }, { status: 400 });
  try {
    const option = await prisma.$transaction(async (tx) => {
      if (before.kind === "Fabricante") await tx.technicalFile.updateMany({ where: { fabricante: before.nome }, data: { fabricante: nome } });
      if (before.kind === "Produto") await tx.technicalFile.updateMany({ where: { produto: before.nome }, data: { produto: nome } });
      if (before.kind === "SistemaOperacional") await tx.technicalFile.updateMany({ where: { sistemaOperacional: before.nome }, data: { sistemaOperacional: nome } });
      return tx.technicalOption.update({ where: { id }, data: { nome } });
    });
    await registerAudit({ userId: session.user.id, acao: "update", entidade: "TechnicalOption", entidadeId: id, detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, option as unknown as Record<string, unknown>), ip: getRequestIp(req) });
    return NextResponse.json(option);
  } catch {
    return NextResponse.json({ error: "Não foi possível renomear. Verifique se o nome já existe." }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos") || session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const id = (await params).id;
  const option = await prisma.technicalOption.findUnique({ where: { id } });
  if (!option) return NextResponse.json({ error: "Cadastro não encontrado" }, { status: 404 });
  const linkedFiles = option.kind === "Fabricante"
    ? await prisma.technicalFile.count({ where: { fabricante: option.nome } })
    : option.kind === "Produto"
      ? await prisma.technicalFile.count({ where: { produto: option.nome } })
      : await prisma.technicalFile.count({ where: { sistemaOperacional: option.nome } });
  if (linkedFiles > 0) {
    return NextResponse.json({ error: `Este cadastro é utilizado por ${linkedFiles} arquivo(s). Renomeie em vez de excluir.` }, { status: 409 });
  }
  await prisma.technicalOption.delete({ where: { id } });
  await registerAudit({ userId: session.user.id, acao: "delete", entidade: "TechnicalOption", entidadeId: id, detalhes: buildAuditDeleteDetails(option as unknown as Record<string, unknown>), ip: getRequestIp(req) });
  return NextResponse.json({ ok: true });
}
