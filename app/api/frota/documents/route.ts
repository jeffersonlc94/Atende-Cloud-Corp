import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documentos = await prisma.vehicleDocument.findMany({
    include: { vehicle: { select: { id: true, placa: true, marca: true, modelo: true } } },
    orderBy: { dataVencimento: "asc" },
  });

  return NextResponse.json(documentos);
}
