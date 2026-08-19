import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const presence = await prisma.userPresence.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, path: String(body.path || "").slice(0, 300), lastSeen: new Date() },
    update: { path: String(body.path || "").slice(0, 300), lastSeen: new Date() },
  });
  return NextResponse.json(presence);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const onlineSince = new Date(Date.now() - 2 * 60 * 1000);
  const users = await prisma.userPresence.findMany({
    where: { lastSeen: { gte: onlineSince } },
    include: { user: { select: { id: true, name: true, cargo: true, role: true } } },
    orderBy: { lastSeen: "desc" },
  });
  return NextResponse.json(users.map((presence) => ({ ...presence, isCurrentUser: presence.userId === session.user.id })));
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: true });
  await prisma.userPresence.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
