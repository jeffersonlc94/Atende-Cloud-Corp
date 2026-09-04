import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { buildAuditChanges, buildAuditDeleteDetails, getRequestIp, registerAudit } from "@/lib/audit";
import { isTechnicalFileType, removeTechnicalFile, saveTechnicalFile } from "@/lib/technical-files";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = (await params).id;
  const before = await prisma.technicalFile.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const nome = String(form.get("nome") || "").trim();
  const produto = String(form.get("produto") || "").trim();
  const categoryId = String(form.get("categoryId") || "");
  const tipo = String(form.get("tipo") || "");
  const descricao = String(form.get("descricao") || "").trim();
  if (!nome || !produto || !categoryId || !isTechnicalFileType(tipo)) return NextResponse.json({ error: "Preencha nome, categoria, produto e tipo" }, { status: 400 });
  if (descricao.length > 500) return NextResponse.json({ error: "A descrição deve ter no máximo 500 caracteres" }, { status: 400 });
  let saved: Awaited<ReturnType<typeof saveTechnicalFile>> | null = null;
  try {
    if (file) {
      if (file.size > 2_000_000_000) return NextResponse.json({ error: "O arquivo ultrapassa o limite técnico de 2 GB" }, { status: 413 });
      const settings = await prisma.systemSettings.findUnique({ where: { id: "default" }, select: { technicalFileMaxMb: true } });
      const maxMb = settings?.technicalFileMaxMb ?? 500;
      if (maxMb > 0 && file.size > maxMb * 1024 * 1024) return NextResponse.json({ error: `Arquivo muito grande (limite configurado: ${maxMb} MB)` }, { status: 413 });
      saved = await saveTechnicalFile(file);
    }
    const fabricanteValue = String(form.get("fabricante") || "").trim().slice(0, 100);
    const sistemaValue = String(form.get("sistemaOperacional") || "").trim().slice(0, 120);
    await Promise.all([
      prisma.technicalOption.upsert({ where: { kind_nome: { kind: "Produto", nome: produto.slice(0, 160) } }, update: {}, create: { kind: "Produto", nome: produto.slice(0, 160) } }),
      ...(fabricanteValue ? [prisma.technicalOption.upsert({ where: { kind_nome: { kind: "Fabricante" as const, nome: fabricanteValue } }, update: {}, create: { kind: "Fabricante" as const, nome: fabricanteValue } })] : []),
      ...(sistemaValue ? [prisma.technicalOption.upsert({ where: { kind_nome: { kind: "SistemaOperacional" as const, nome: sistemaValue } }, update: {}, create: { kind: "SistemaOperacional" as const, nome: sistemaValue } })] : []),
    ]);
    const item = await prisma.technicalFile.update({
      where: { id },
      data: {
        nome: nome.slice(0, 160), descricao: descricao || null, tipo,
        fabricante: fabricanteValue || null,
        produto: produto.slice(0, 160), versao: String(form.get("versao") || "").trim().slice(0, 80) || null,
        sistemaOperacional: sistemaValue || null,
        categoryId,
        ...(saved && file ? { nomeOriginal: saved.originalName, nomeArmazenado: saved.storedName, mimeType: file.type || null, tamanhoBytes: file.size } : {}),
      },
      include: { category: true, createdByUser: { select: { id: true, name: true } } },
    });
    if (saved) await removeTechnicalFile(before.nomeArmazenado);
    await registerAudit({ userId: session.user.id, acao: "update", entidade: "TechnicalFile", entidadeId: id, detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, item as unknown as Record<string, unknown>, { ignore: ["category", "createdByUser"] }), ip: getRequestIp(req) });
    return NextResponse.json(item);
  } catch (error) {
    if (saved) await removeTechnicalFile(saved.storedName);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos") || session.user.role !== "ADMIN") return NextResponse.json({ error: "Apenas administradores podem excluir arquivos" }, { status: 403 });
  const id = (await params).id;
  const item = await prisma.technicalFile.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  await prisma.technicalFile.delete({ where: { id } });
  await removeTechnicalFile(item.nomeArmazenado);
  await registerAudit({ userId: session.user.id, acao: "delete", entidade: "TechnicalFile", entidadeId: id, detalhes: buildAuditDeleteDetails(item as unknown as Record<string, unknown>), ip: getRequestIp(req) });
  return NextResponse.json({ ok: true });
}
