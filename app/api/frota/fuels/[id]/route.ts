import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fuelSchema } from "@/lib/validations";

function computeTotal(litros: number, valorLitro: number) {
  return Math.round(litros * valorLitro * 100) / 100;
}

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = fuelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.fuel.update({
    where: { id },
    data: {
      data: new Date(data.data),
      km: data.km ?? null,
      litros: data.litros,
      valorLitro: data.valorLitro,
      valorTotal: computeTotal(data.litros, data.valorLitro),
      posto: data.posto || null,
      tipoCombustivel: data.tipoCombustivel,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.fuel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
