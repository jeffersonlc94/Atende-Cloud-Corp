import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clients?q=texto -> autocomplete search
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: q ? { nome: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { nome: "asc" },
    take: 15,
  });

  return NextResponse.json(clients);
}

// POST /api/clients { nome } -> encontra ou cria cliente pelo nome
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const nome: string = (body?.nome ?? "").trim();

  if (!nome) {
    return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
  }

  let client = await prisma.client.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
  });

  if (!client) {
    client = await prisma.client.create({ data: { nome } });
  }

  return NextResponse.json(client, { status: 201 });
}
