import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const drafts = await prisma.quoteDraft.findMany({
    where: { createdByUserId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "orcamentos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const draft = await prisma.quoteDraft.create({
    data: { data: body.data ?? {}, autoSave: body.autoSave !== false, createdByUserId: session.user.id },
  });
  return NextResponse.json(draft, { status: 201 });
}
