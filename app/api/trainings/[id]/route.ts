import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { canAccessModule } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "treinamentos")) return NextResponse.json({ error: "Acesso ao módulo não autorizado" }, { status: 403 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await req.json();
  if (String(body.descricao || "").length > 250) return NextResponse.json({ error: "A descrição deve ter no máximo 250 caracteres" }, { status: 400 });
  const item = await prisma.trainingContent.update({
    where: { id: (await params).id },
    data: { titulo: body.titulo?.trim(), descricao: body.descricao?.trim() || null, tipo: body.tipo, categoryId: body.categoryId, ordem: Number(body.ordem) || 0 },
    include: { category: true, createdByUser: { select: { id: true, name: true } } },
  });
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
  return NextResponse.json({ ok: true });
}
