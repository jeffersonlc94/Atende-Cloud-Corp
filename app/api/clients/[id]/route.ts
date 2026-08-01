import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/clients/:id { nome } -> corrige o nome do cliente
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const nome: string = (body?.nome ?? "").trim();

  if (!nome) {
    return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const client = await prisma.client.update({
    where: { id },
    data: { nome },
  });

  return NextResponse.json(client);
}
