import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function findOwned(id: string, userId: string) {
  return prisma.quoteDraft.findFirst({ where: { id, createdByUserId: userId } });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const draft = await findOwned((await params).id, session.user.id);
  if (!draft) return NextResponse.json({ error: "Rascunho não encontrado" }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = (await params).id;
  if (!(await findOwned(id, session.user.id))) return NextResponse.json({ error: "Rascunho não encontrado" }, { status: 404 });
  const body = await req.json();
  const draft = await prisma.quoteDraft.update({ where: { id }, data: { data: body.data ?? {}, autoSave: body.autoSave !== false } });
  return NextResponse.json(draft);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = (await params).id;
  if (!(await findOwned(id, session.user.id))) return NextResponse.json({ error: "Rascunho não encontrado" }, { status: 404 });
  await prisma.quoteDraft.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
