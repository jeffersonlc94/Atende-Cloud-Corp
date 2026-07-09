import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = maintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.maintenance.update({
    where: { id },
    data: {
      tipo: data.tipo,
      data: new Date(data.data),
      oficina: data.oficina || null,
      valor: data.valor ?? null,
      km: data.km ?? null,
      responsavelUserId: data.responsavelUserId || null,
      descricao: data.descricao || null,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "Maintenance",
    entidadeId: item.id,
    detalhes: { tipo: item.tipo, vehicleId: item.vehicleId },
    ip: getRequestIp(req),
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.maintenance.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "Maintenance",
    entidadeId: id,
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
