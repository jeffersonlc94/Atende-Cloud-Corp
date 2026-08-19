import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const nome = String((await req.json()).nome || "").trim();
  if (!nome) return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  try {
    return NextResponse.json(await prisma.trainingCategory.update({ where: { id: (await params).id }, data: { nome } }));
  } catch {
    return NextResponse.json({ error: "Não foi possível renomear. Verifique se o nome já existe." }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const id = (await params).id;
  const count = await prisma.trainingContent.count({ where: { categoryId: id } });
  if (count > 0) return NextResponse.json({ error: `Esta categoria possui ${count} conteúdo(s). Mova ou exclua os conteúdos antes.` }, { status: 409 });
  await prisma.trainingCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
