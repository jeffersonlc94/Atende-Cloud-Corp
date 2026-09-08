import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { computeFleetAlerts } from "@/lib/frota-alerts";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const alerts = await computeFleetAlerts();
  const activeIds = alerts.map((alert) => alert.id);
  await prisma.readFleetAlert.deleteMany({
    where: activeIds.length
      ? { userId: session.user.id, alertId: { notIn: activeIds } }
      : { userId: session.user.id },
  });
  const read = await prisma.readFleetAlert.findMany({
    where: { userId: session.user.id, alertId: { in: activeIds } },
    select: { alertId: true },
  });
  const readIds = new Set(read.map((item) => item.alertId));
  return NextResponse.json(alerts.filter((alert) => !readIds.has(alert.id)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const alerts = await computeFleetAlerts();
  const activeIds = new Set(alerts.map((alert) => alert.id));
  const requestedIds = body.all
    ? [...activeIds]
    : [String(body.alertId || "")].filter((id) => activeIds.has(id));
  if (!requestedIds.length) {
    return NextResponse.json({ error: "Notificação não encontrada." }, { status: 404 });
  }

  await prisma.readFleetAlert.createMany({
    data: requestedIds.map((alertId) => ({ userId: session.user.id, alertId })),
    skipDuplicates: true,
  });
  return NextResponse.json({ ok: true, count: requestedIds.length });
}
