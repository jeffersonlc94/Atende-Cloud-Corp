import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { checklistSchema, checklistItemTipoLabels } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const CHECKLIST_FIELD_LABELS: Record<string, string> = {
  tipo: "Tipo",
  data: "Data",
  hora: "Hora",
  km: "KM",
  statusGeral: "Status geral",
  observacoes: "Observações",
  fotos: "Fotos",
};

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const checklist = await prisma.checklist.findUnique({
    where: { id },
    include: {
      vehicle: { select: { id: true, placa: true, marca: true, modelo: true, cor: true, company: true } },
      user: { select: { id: true, name: true } },
      itens: true,
    },
  });

  if (!checklist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(checklist);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.checklist.findUnique({
    where: { id },
    include: { itens: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = checklistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const dataChecklist = new Date(data.data);

  // Monta o diff (antes/depois) apenas dos campos que realmente mudaram, para o log de auditoria.
  const alteracoes: Record<string, unknown> = {};
  const before: Record<string, unknown> = {
    tipo: existing.tipo,
    data: existing.data.toISOString().slice(0, 10),
    hora: existing.hora ?? "",
    km: existing.km,
    statusGeral: existing.statusGeral,
    observacoes: existing.observacoes ?? "",
    fotos: existing.fotos,
  };
  const after: Record<string, unknown> = {
    tipo: data.tipo,
    data: data.data,
    hora: data.hora || "",
    km: data.km,
    statusGeral: data.statusGeral,
    observacoes: data.observacoes || "",
    fotos: data.fotos ?? [],
  };
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      alteracoes[CHECKLIST_FIELD_LABELS[key] ?? key] = { de: before[key], para: after[key] };
    }
  }

  const itensAntes = Object.fromEntries(existing.itens.map((i) => [i.item, i.status]));
  const itensMudados = data.itens
    .filter((i) => itensAntes[i.item] !== i.status)
    .map((i) => ({
      item: checklistItemTipoLabels[i.item as keyof typeof checklistItemTipoLabels] ?? i.item,
      de: itensAntes[i.item] ?? "—",
      para: i.status,
    }));
  if (itensMudados.length > 0) {
    alteracoes["Itens de inspeção"] = itensMudados;
  }

  const item = await prisma.$transaction(async (tx) => {
    await tx.checklistItem.deleteMany({ where: { checklistId: id } });

    return tx.checklist.update({
      where: { id },
      data: {
        vehicleId: data.vehicleId,
        tipo: data.tipo,
        data: dataChecklist,
        hora: data.hora || null,
        km: data.km,
        statusGeral: data.statusGeral,
        observacoes: data.observacoes || null,
        fotos: data.fotos ?? [],
        itens: {
          createMany: {
            data: data.itens.map((i) => ({ item: i.item, status: i.status })),
          },
        },
      },
      include: { itens: true },
    });
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "Checklist",
    entidadeId: item.id,
    detalhes: JSON.parse(
      JSON.stringify({
        vehicleId: item.vehicleId,
        alteracoes: Object.keys(alteracoes).length > 0 ? alteracoes : "Nenhum campo alterado",
      })
    ),
    ip: getRequestIp(req),
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.checklist.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "Checklist",
    entidadeId: id,
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
