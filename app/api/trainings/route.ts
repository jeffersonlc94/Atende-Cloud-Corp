import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tipo = req.nextUrl.searchParams.get("tipo");
  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const busca = req.nextUrl.searchParams.get("busca")?.trim();
  const items = await prisma.trainingContent.findMany({
    where: {
      ...(tipo === "Videoaula" || tipo === "Documento" ? { tipo } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(busca ? { OR: [{ titulo: { contains: busca, mode: "insensitive" } }, { descricao: { contains: busca, mode: "insensitive" } }] } : {}),
    },
    include: { category: true, createdByUser: { select: { id: true, name: true } } },
    orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Apenas administradores podem cadastrar treinamentos" }, { status: 403 });
  const body = await req.json();
  if (!body.titulo?.trim() || !body.categoryId || !body.arquivoUrl || !["Videoaula", "Documento"].includes(body.tipo)) {
    return NextResponse.json({ error: "Preencha título, categoria, tipo e arquivo" }, { status: 400 });
  }
  const item = await prisma.trainingContent.create({
    data: {
      titulo: body.titulo.trim(), descricao: body.descricao?.trim() || null, tipo: body.tipo,
      arquivoUrl: body.arquivoUrl, nomeArquivo: body.nomeArquivo || null,
      ordem: Number(body.ordem) || 0, categoryId: body.categoryId, createdByUserId: session.user.id,
    },
    include: { category: true, createdByUser: { select: { id: true, name: true } } },
  });
  return NextResponse.json(item, { status: 201 });
}
