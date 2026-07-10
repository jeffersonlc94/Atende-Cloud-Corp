import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

// Rota de autoatendimento: cada usuário só pode editar A SI MESMO (nome,
// e-mail, foto e senha). Diferente de /api/users/[id], que é admin-only.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.password) {
    if (data.password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres." }, { status: 400 });
    }
    if (data.password !== data.confirmPassword) {
      return NextResponse.json({ error: "A confirmação de senha não confere." }, { status: 400 });
    }
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email, NOT: { id: session.user.id } } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      email,
      avatarUrl: data.avatarUrl || null,
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cargo: true,
      avatarUrl: true,
      canAccessOrcamentos: true,
      canAccessFrota: true,
    },
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "User",
    entidadeId: user.id,
    detalhes: { email: user.email, self: true },
    ip: getRequestIp(req),
  });

  return NextResponse.json(user);
}
