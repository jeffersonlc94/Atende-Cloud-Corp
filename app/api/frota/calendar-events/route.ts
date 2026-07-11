import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calendarEventSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const vehicleId = req.nextUrl.searchParams.get("vehicleId")?.trim();
  const futurasApenas = req.nextUrl.searchParams.get("futuras") === "1";
  const inicioDoDia = new Date();
  inicioDoDia.setUTCHours(0, 0, 0, 0);

  const items = await prisma.calendarEvent.findMany({
    where: {
      ...(vehicleId ? { vehicleId } : {}),
      ...(futurasApenas ? { data: { gte: inicioDoDia } } : {}),
    },
    include: { vehicle: { select: { id: true, placa: true, marca: true, modelo: true } } },
    orderBy: { data: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = calendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.calendarEvent.create({
    data: {
      vehicleId: data.vehicleId || null,
      titulo: data.titulo,
      data: new Date(data.data),
      descricao: data.descricao || null,
      tipo: data.tipo,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
