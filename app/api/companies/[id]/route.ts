import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validations";
import { registerAudit, getRequestIp, buildAuditChanges, buildAuditDeleteDetails } from "@/lib/audit";
import { canDeleteRecords } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(company);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const before = await prisma.company.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  const parsed = companySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.company.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.company.update({ where: { id }, data: parsed.data });
  });

  await registerAudit({
    userId: session.user.id,
    acao: "update",
    entidade: "Company",
    entidadeId: company.id,
    detalhes: buildAuditChanges(before as unknown as Record<string, unknown>, company as unknown as Record<string, unknown>, { resumo: { razaoSocial: company.razaoSocial } }),
    ip: getRequestIp(req),
  });

  return NextResponse.json(company);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDeleteRecords(session)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir empresas." }, { status: 403 });
  }

  const { id } = await params;

  const inUse = await prisma.quote.count({ where: { companyId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: "Empresa possui orçamentos vinculados e não pode ser excluída." },
      { status: 409 }
    );
  }

  const company = await prisma.company.delete({ where: { id } });

  await registerAudit({
    userId: session.user.id,
    acao: "delete",
    entidade: "Company",
    entidadeId: id,
    detalhes: buildAuditDeleteDetails(company as unknown as Record<string, unknown>, { resumo: { razaoSocial: company.razaoSocial } }),
    ip: getRequestIp(req),
  });

  return NextResponse.json({ ok: true });
}
