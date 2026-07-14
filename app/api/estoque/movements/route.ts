import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { stockMovementSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import { registerAudit, getRequestIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "estoque")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const devolvido = sp.get("devolvido")?.trim();
  const dataInicial = sp.get("dataInicial")?.trim();
  const dataFinal = sp.get("dataFinal")?.trim();

  const where: Prisma.StockMovementWhereInput = {};
  if (q) {
    where.OR = [
      { cod: { contains: q, mode: "insensitive" } },
      { descricao: { contains: q, mode: "insensitive" } },
      { numeroSerie: { contains: q, mode: "insensitive" } },
      { destino: { contains: q, mode: "insensitive" } },
      { respRetirada: { contains: q, mode: "insensitive" } },
      { respEntrega: { contains: q, mode: "insensitive" } },
    ];
  }
  if (devolvido === "sim") where.devolvido = true;
  if (devolvido === "nao") where.devolvido = false;
  if (dataInicial || dataFinal) {
    where.data = {};
    if (dataInicial) where.data.gte = new Date(dataInicial);
    if (dataFinal) {
      const end = new Date(dataFinal);
      end.setHours(23, 59, 59, 999);
      where.data.lte = end;
    }
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(movements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "estoque")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = stockMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const movement = await prisma.stockMovement.create({
    data: {
      cod: data.cod,
      descricao: data.descricao,
      qtd: data.qtd,
      respRetirada: data.respRetirada,
      respEntrega: data.respEntrega || null,
      data: new Date(data.data),
      numeroSerie: data.numeroSerie || null,
      destino: data.destino || null,
      devolvido: data.devolvido,
      observacoes: data.observacoes || null,
      createdByUserId: session.user.id,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "create",
    entidade: "StockMovement",
    entidadeId: movement.id,
    detalhes: { cod: movement.cod, descricao: movement.descricao, numeroSerie: movement.numeroSerie },
    ip: getRequestIp(req),
  });

  return NextResponse.json(movement, { status: 201 });
}
