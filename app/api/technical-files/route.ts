import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";
import { isTechnicalFileType, removeTechnicalFile, saveTechnicalFile } from "@/lib/technical-files";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const query = req.nextUrl.searchParams;
  const busca = query.get("busca")?.trim();
  const categoryId = query.get("categoryId");
  const tipo = query.get("tipo");
  const fabricante = query.get("fabricante")?.trim();
  const produto = query.get("produto")?.trim();
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(tipo && isTechnicalFileType(tipo) ? { tipo } : {}),
    ...(fabricante ? { fabricante } : {}),
    ...(produto ? { produto } : {}),
    ...(busca ? { OR: [
      { nome: { contains: busca, mode: "insensitive" as const } },
      { descricao: { contains: busca, mode: "insensitive" as const } },
      { fabricante: { contains: busca, mode: "insensitive" as const } },
      { produto: { contains: busca, mode: "insensitive" as const } },
      { versao: { contains: busca, mode: "insensitive" as const } },
      { sistemaOperacional: { contains: busca, mode: "insensitive" as const } },
      { nomeOriginal: { contains: busca, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [items, allOptions] = await Promise.all([
    prisma.technicalFile.findMany({
      where,
      include: { category: true, createdByUser: { select: { id: true, name: true } } },
      orderBy: [{ updatedAt: "desc" }, { nome: "asc" }],
    }),
    prisma.technicalFile.findMany({ select: { fabricante: true, produto: true } }),
  ]);
  return NextResponse.json({
    items,
    filters: {
      fabricantes: [...new Set(allOptions.map((item) => item.fabricante).filter(Boolean))].sort(),
      produtos: [...new Set(allOptions.map((item) => item.produto).filter(Boolean))].sort(),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const nome = String(form.get("nome") || "").trim();
  const produto = String(form.get("produto") || "").trim();
  const categoryId = String(form.get("categoryId") || "");
  const tipo = String(form.get("tipo") || "");
  const descricao = String(form.get("descricao") || "").trim();
  if (!file || !nome || !produto || !categoryId || !isTechnicalFileType(tipo)) return NextResponse.json({ error: "Preencha nome, categoria, produto, tipo e arquivo" }, { status: 400 });
  if (descricao.length > 500) return NextResponse.json({ error: "A descrição deve ter no máximo 500 caracteres" }, { status: 400 });
  if (file.size > 2_000_000_000) return NextResponse.json({ error: "O arquivo ultrapassa o limite técnico de 2 GB" }, { status: 413 });
  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" }, select: { technicalFileMaxMb: true } });
  const maxMb = settings?.technicalFileMaxMb ?? 500;
  if (maxMb > 0 && file.size > maxMb * 1024 * 1024) return NextResponse.json({ error: `Arquivo muito grande (limite configurado: ${maxMb} MB)` }, { status: 413 });
  let saved: Awaited<ReturnType<typeof saveTechnicalFile>> | null = null;
  try {
    saved = await saveTechnicalFile(file);
    const fabricanteValue = String(form.get("fabricante") || "").trim().slice(0, 100);
    const sistemaValue = String(form.get("sistemaOperacional") || "").trim().slice(0, 120);
    await Promise.all([
      prisma.technicalOption.upsert({ where: { kind_nome: { kind: "Produto", nome: produto.slice(0, 160) } }, update: {}, create: { kind: "Produto", nome: produto.slice(0, 160) } }),
      ...(fabricanteValue ? [prisma.technicalOption.upsert({ where: { kind_nome: { kind: "Fabricante" as const, nome: fabricanteValue } }, update: {}, create: { kind: "Fabricante" as const, nome: fabricanteValue } })] : []),
      ...(sistemaValue ? [prisma.technicalOption.upsert({ where: { kind_nome: { kind: "SistemaOperacional" as const, nome: sistemaValue } }, update: {}, create: { kind: "SistemaOperacional" as const, nome: sistemaValue } })] : []),
    ]);
    const item = await prisma.technicalFile.create({
      data: {
        nome: nome.slice(0, 160), descricao: descricao || null, tipo,
        fabricante: fabricanteValue || null,
        produto: produto.slice(0, 160), versao: String(form.get("versao") || "").trim().slice(0, 80) || null,
        sistemaOperacional: sistemaValue || null,
        nomeOriginal: saved.originalName, nomeArmazenado: saved.storedName, mimeType: file.type || null,
        tamanhoBytes: file.size, categoryId, createdByUserId: session.user.id,
      },
      include: { category: true, createdByUser: { select: { id: true, name: true } } },
    });
    await registerAudit({ userId: session.user.id, acao: "create", entidade: "TechnicalFile", entidadeId: item.id, detalhes: { nome: item.nome, produto: item.produto, nomeOriginal: item.nomeOriginal }, ip: getRequestIp(req) });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (saved) await removeTechnicalFile(saved.storedName);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível salvar o arquivo" }, { status: 400 });
  }
}
