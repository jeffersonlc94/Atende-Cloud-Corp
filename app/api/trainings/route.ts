import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { normalizeYouTubeUrl } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "treinamentos")) return NextResponse.json({ error: "Acesso ao módulo não autorizado" }, { status: 403 });
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
  if (!canAccessModule(session, "treinamentos")) return NextResponse.json({ error: "Acesso ao módulo não autorizado" }, { status: 403 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Apenas administradores podem cadastrar treinamentos" }, { status: 403 });
  const body = await req.json();
  const youtubeUrl = body.tipo === "Videoaula" ? normalizeYouTubeUrl(String(body.arquivoUrl || "")) : null;
  if (!body.titulo?.trim() || !body.categoryId || !body.arquivoUrl || !["Videoaula", "Documento"].includes(body.tipo)) {
    return NextResponse.json({ error: "Preencha título, categoria, tipo e arquivo" }, { status: 400 });
  }
  if (!String(body.arquivoUrl).startsWith("/uploads/training/") && !youtubeUrl) {
    return NextResponse.json({ error: "Informe um arquivo enviado ou um link válido do YouTube" }, { status: 400 });
  }
  if (String(body.descricao || "").length > 250) return NextResponse.json({ error: "A descrição deve ter no máximo 250 caracteres" }, { status: 400 });
  const item = await prisma.trainingContent.create({
    data: {
      titulo: body.titulo.trim(), descricao: body.descricao?.trim() || null, tipo: body.tipo,
      arquivoUrl: youtubeUrl || body.arquivoUrl, capaUrl: body.capaUrl || null, nomeArquivo: youtubeUrl ? "YouTube" : body.nomeArquivo || null,
      ordem: Number(body.ordem) || 0, categoryId: body.categoryId, createdByUserId: session.user.id,
    },
    include: { category: true, createdByUser: { select: { id: true, name: true } } },
  });
  return NextResponse.json(item, { status: 201 });
}
