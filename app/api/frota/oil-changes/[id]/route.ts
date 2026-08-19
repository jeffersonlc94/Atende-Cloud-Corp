import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { oilChangeSchema } from "@/lib/validations";
import { registerAudit, getRequestIp, buildAuditChanges, buildAuditDeleteDetails } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const before = await prisma.oilChange.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Troca de óleo não encontrada" }, { status: 404 });
  const parsed = oilChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.oilChange.update({
    where: { id },
    data: {
      data: new Date(data.data),
      km: data.km,
      tipoOleo: data.tipoOleo || null,
      quantidade: data.quantidade ?? null,
      oficina: data.oficina || null,
      valor: data.valor ?? null,
      observacoes: data.observacoes || null,
      kmProximaTroca: data.kmProximaTroca ?? null,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "OilChange",
    entidadeId: item.id,
    detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, item as unknown as Record<string, unknown>, { resumo: { vehicleId: item.vehicleId } }),
    ip: getRequestIp(req),
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const item = await prisma.oilChange.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "OilChange",
    entidadeId: id,
    detalhes: buildAuditDeleteDetails(item as unknown as Record<string, unknown>, { resumo: { vehicleId: item.vehicleId, km: item.km } }),
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
