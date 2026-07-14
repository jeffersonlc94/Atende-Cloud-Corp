import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";
import { canManageUsers } from "@/lib/permissions";
import { registerAudit, getRequestIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session)) {
    return NextResponse.json({ error: "Apenas administradores podem gerenciar usuários." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { hidden: false },
    select: { id: true, name: true, email: true, role: true, cargo: true, canAccessOrcamentos: true, canAccessFrota: true, receiveNotifications: true, hidden: true, avatarUrl: true, createdAt: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session)) {
    return NextResponse.json({ error: "Apenas administradores podem gerenciar usuários." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (!data.password || data.password.length < 6) {
    return NextResponse.json(
      { error: "Senha obrigatória (mínimo 6 caracteres) na criação de usuário." },
      { status: 400 }
    );
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      passwordHash,
      role: data.role,
      cargo: data.cargo ?? null,
      canAccessOrcamentos: data.canAccessOrcamentos ?? true,
      canAccessFrota: data.canAccessFrota ?? true,
      receiveNotifications: data.receiveNotifications ?? true,
    },
    select: { id: true, name: true, email: true, role: true, cargo: true, canAccessOrcamentos: true, canAccessFrota: true, receiveNotifications: true, hidden: true, avatarUrl: true, createdAt: true, updatedAt: true },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "create",
    entidade: "User",
    entidadeId: user.id,
    detalhes: { email: user.email, role: user.role },
    ip: getRequestIp(req),
  });

  return NextResponse.json(user, { status: 201 });
}
