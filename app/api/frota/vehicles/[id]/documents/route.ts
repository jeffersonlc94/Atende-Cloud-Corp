import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { vehicleDocumentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const documentos = await prisma.vehicleDocument.findMany({
    where: { vehicleId: id },
    orderBy: { dataVencimento: "asc" },
  });
  return NextResponse.json(documentos);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = vehicleDocumentSchema.safeParse({ ...body, vehicleId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const doc = await prisma.vehicleDocument.create({
    data: {
      vehicleId: id,
      tipo: data.tipo,
      arquivoUrl: data.arquivoUrl || null,
      dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
      dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
