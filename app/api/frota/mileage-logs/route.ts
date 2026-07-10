import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { mileageLogSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const vehicleId = req.nextUrl.searchParams.get("vehicleId")?.trim();
  const logs = await prisma.mileageLog.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: {
      vehicle: { select: { id: true, placa: true, marca: true, modelo: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { data: "desc" },
    take: 200,
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = mileageLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.mileageLog.create({
      data: {
        vehicleId: data.vehicleId,
        data: new Date(data.data),
        km: data.km,
        userId: session.user.id,
      },
    });

    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (vehicle && data.km > vehicle.kmAtual) {
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { kmAtual: data.km } });
    }

    return created;
  });

  return NextResponse.json(log, { status: 201 });
}
