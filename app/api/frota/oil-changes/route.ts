import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { oilChangeSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicleId = req.nextUrl.searchParams.get("vehicleId")?.trim();
  const items = await prisma.oilChange.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: { select: { id: true, placa: true, marca: true, modelo: true, kmAtual: true } } },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = oilChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.oilChange.create({
    data: {
      vehicleId: data.vehicleId,
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
    acao: "create",
    entidade: "OilChange",
    entidadeId: item.id,
    detalhes: { vehicleId: item.vehicleId, km: item.km },
    ip: getRequestIp(req),
  });

  return NextResponse.json(item, { status: 201 });
}
