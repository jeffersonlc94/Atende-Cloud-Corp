import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";
import { canManageUsers } from "@/lib/permissions";
import { registerAudit, getRequestIp, buildAuditChanges, buildAuditDeleteDetails } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session)) {
    return NextResponse.json({ error: "Apenas administradores podem gerenciar usuários." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  if (data.password && data.password.length > 0 && data.password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email,
      role: data.role,
      cargo: data.cargo ?? null,
      canAccessOrcamentos: data.canAccessOrcamentos ?? true,
      canAccessFrota: data.canAccessFrota ?? true,
      canAccessEstoque: data.canAccessEstoque ?? true,
      canAccessTreinamentos: data.canAccessTreinamentos ?? true,
      receiveNotifications: data.receiveNotifications ?? true,
      telegramChatId: data.telegramChatId || null,
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cargo: true,
      canAccessOrcamentos: true,
      canAccessFrota: true,
      canAccessEstoque: true,
      canAccessTreinamentos: true,
      receiveNotifications: true,
      telegramChatId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "User",
    entidadeId: user.id,
    detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, user as unknown as Record<string, unknown>, { resumo: { email: user.email } }),
    ip: getRequestIp(req),
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session)) {
    return NextResponse.json({ error: "Apenas administradores podem gerenciar usuários." }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Você não pode excluir seu próprio usuário." }, { status: 400 });
  }

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Usuário possui registros vinculados (orçamentos, checklists, etc.) e não pode ser excluído." },
      { status: 409 }
    );
  }

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "User",
    entidadeId: id,
    detalhes: buildAuditDeleteDetails(before as unknown as Record<string, unknown>, { resumo: { email: before.email, nome: before.name } }),
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
