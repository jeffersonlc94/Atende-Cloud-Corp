import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const placa = sp.get("placa")?.trim();
  const situacao = sp.get("situacao")?.trim();
  const companyId = sp.get("companyId")?.trim();

  const where: Prisma.VehicleWhereInput = {};
  if (placa) where.placa = { contains: placa, mode: "insensitive" };
  if (situacao) where.situacao = situacao as Prisma.EnumSituacaoVeiculoFilter["equals"];
  if (companyId) where.companyId = companyId;

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      company: { select: { id: true, razaoSocial: true, nomeFantasia: true } },
      _count: { select: { checklists: true, documentos: true, maintenances: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const vehicle = await prisma.vehicle.create({
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

  return NextResponse.json(vehicle, { status: 201 });
}
