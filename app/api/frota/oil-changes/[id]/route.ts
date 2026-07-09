import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { oilChangeSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
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

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.oilChange.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
