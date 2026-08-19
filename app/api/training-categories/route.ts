import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.trainingCategory.findMany({ orderBy: { nome: "asc" } }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const nome = String((await req.json()).nome || "").trim();
  if (!nome) return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  const category = await prisma.trainingCategory.create({ data: { nome } });
  return NextResponse.json(category, { status: 201 });
}
