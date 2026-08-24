import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { canAccessModule } from "@/lib/permissions";
import { normalizeYouTubeUrl } from "@/lib/youtube";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "treinamentos")) return NextResponse.json({ error: "Acesso ao módulo não autorizado" }, { status: 403 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await req.json();
  if (String(body.descricao || "").length > 250) return NextResponse.json({ error: "A descrição deve ter no máximo 250 caracteres" }, { status: 400 });
  const id = (await params).id;
  const existing = await prisma.trainingContent.findUnique({ where: { id }, select: { capaUrl: true, arquivoUrl: true } });
  if (!existing) return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });
  const hasNewSource = Object.prototype.hasOwnProperty.call(body, "arquivoUrl");
  const youtubeUrl = body.tipo === "Videoaula" && hasNewSource ? normalizeYouTubeUrl(String(body.arquivoUrl || "")) : null;
  if (hasNewSource && !String(body.arquivoUrl).startsWith("/uploads/training/") && !youtubeUrl) return NextResponse.json({ error: "Informe um arquivo enviado ou um link válido do YouTube" }, { status: 400 });
  const item = await prisma.trainingContent.update({
    where: { id },
    data: { titulo: body.titulo?.trim(), descricao: body.descricao?.trim() || null, tipo: body.tipo, categoryId: body.categoryId, ordem: Number(body.ordem) || 0, ...(hasNewSource ? { arquivoUrl: youtubeUrl || body.arquivoUrl, nomeArquivo: youtubeUrl ? "YouTube" : body.nomeArquivo || null } : {}), ...(Object.prototype.hasOwnProperty.call(body, "capaUrl") ? { capaUrl: body.capaUrl || null } : {}) },
    include: { category: true, createdByUser: { select: { id: true, name: true } } },
  });
  if (Object.prototype.hasOwnProperty.call(body, "capaUrl") && existing.capaUrl && existing.capaUrl !== body.capaUrl && existing.capaUrl.startsWith("/uploads/")) {
    await unlink(path.join(process.cwd(), "public", "uploads", path.basename(existing.capaUrl))).catch(() => undefined);
  }
  if (hasNewSource && existing.arquivoUrl !== body.arquivoUrl && existing.arquivoUrl.startsWith("/uploads/training/")) {
    await unlink(path.join(process.cwd(), "public", "uploads", "training", path.basename(existing.arquivoUrl))).catch(() => undefined);
  }
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "treinamentos")) return NextResponse.json({ error: "Acesso ao módulo não autorizado" }, { status: 403 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const item = await prisma.trainingContent.delete({ where: { id: (await params).id } });
  if (item.arquivoUrl.startsWith("/uploads/training/")) {
    const filename = path.basename(item.arquivoUrl);
    await unlink(path.join(process.cwd(), "public", "uploads", "training", filename)).catch(() => undefined);
  }
  if (item.capaUrl?.startsWith("/uploads/") && !item.capaUrl.includes("/../")) {
    const coverFilename = path.basename(item.capaUrl);
    await unlink(path.join(process.cwd(), "public", "uploads", coverFilename)).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
