import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fuelSchema } from "@/lib/validations";

function computeTotal(litros: number, valorLitro: number) {
  return Math.round(litros * valorLitro * 100) / 100;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicleId = req.nextUrl.searchParams.get("vehicleId")?.trim();
  const items = await prisma.fuel.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: { select: { id: true, placa: true, marca: true, modelo: true } } },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = fuelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const valorTotal = computeTotal(data.litros, data.valorLitro);

  const item = await prisma.fuel.create({
    data: {
      vehicleId: data.vehicleId,
      data: new Date(data.data),
      km: data.km ?? null,
      litros: data.litros,
      valorLitro: data.valorLitro,
      valorTotal,
      posto: data.posto || null,
      tipoCombustivel: data.tipoCombustivel,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
