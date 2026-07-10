import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const documentos = await prisma.vehicleDocument.findMany({
    include: { vehicle: { select: { id: true, placa: true, marca: true, modelo: true } } },
    orderBy: { dataVencimento: "asc" },
  });

  return NextResponse.json(documentos);
}
