import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checklistSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicleId = req.nextUrl.searchParams.get("vehicleId")?.trim();
  const items = await prisma.checklist.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: {
      vehicle: { select: { id: true, placa: true, marca: true, modelo: true } },
      user: { select: { id: true, name: true } },
      itens: true,
    },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = checklistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const dataChecklist = new Date(data.data);

  const item = await prisma.$transaction(async (tx) => {
    const checklist = await tx.checklist.create({
      data: {
        vehicleId: data.vehicleId,
        tipo: data.tipo,
        data: dataChecklist,
        hora: data.hora || null,
        km: data.km,
        userId: session.user.id,
        observacoes: data.observacoes || null,
        itens: {
          createMany: {
            data: data.itens.map((i) => ({ item: i.item, status: i.status })),
          },
        },
      },
      include: { itens: true },
    });

    // Registra o histórico de quilometragem a partir do KM informado no checklist.
    await tx.mileageLog.create({
      data: {
        vehicleId: data.vehicleId,
        data: dataChecklist,
        km: data.km,
        userId: session.user.id,
      },
    });

    // Atualiza o KM atual do veículo apenas se o novo valor for maior (evita retroceder
    // o campo denormalizado usado pela barra de progresso da próxima troca de óleo).
    await tx.vehicle.updateMany({
      where: { id: data.vehicleId, kmAtual: { lt: data.km } },
      data: { kmAtual: data.km },
    });

    return checklist;
  });

  await registerAudit({
    userId: session.user.id,
    acao: "create",
    entidade: "Checklist",
    entidadeId: item.id,
    detalhes: { vehicleId: item.vehicleId, tipo: item.tipo },
    ip: getRequestIp(req),
  });

  return NextResponse.json(item, { status: 201 });
}
