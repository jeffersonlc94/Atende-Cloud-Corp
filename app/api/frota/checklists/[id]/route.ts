import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerAudit, getRequestIp } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.checklist.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "Checklist",
    entidadeId: id,
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
