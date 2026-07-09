import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      company: true,
      documentos: { orderBy: { dataVencimento: "asc" } },
      oilChanges: { orderBy: { data: "desc" } },
      maintenances: { orderBy: { data: "desc" } },
      mileageLogs: { orderBy: { data: "desc" }, take: 20 },
      checklists: { orderBy: { data: "desc" }, take: 10, include: { itens: true } },
      fuels: { orderBy: { data: "desc" }, take: 20 },
    },
  });

  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      fotoUrl: data.fotoUrl || null,
      placa: data.placa.toUpperCase(),
      marca: data.marca,
      modelo: data.modelo,
      versao: data.versao || null,
      ano: data.ano,
      cor: data.cor || null,
      renavam: data.renavam || null,
      chassi: data.chassi || null,
      combustivel: data.combustivel,
      companyId: data.companyId,
      kmAtual: data.kmAtual,
      situacao: data.situacao,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : null,
      observacoes: data.observacoes || null,
    },
    include: { company: true },
  });

  return NextResponse.json(vehicle);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
