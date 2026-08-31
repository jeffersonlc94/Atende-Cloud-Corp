import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const id = (await params).id;
  const quotation = await prisma.supplierQuotation.findUnique({ where: { id } });
  if (!quotation) return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  const updated = await prisma.supplierQuotation.update({ where: { id }, data: { status: "EmCotacao", updatedByUserId: session.user.id } });
  await registerAudit({ userId: session.user.id, acao: "update", entidade: "SupplierQuotation", entidadeId: id, detalhes: { numero: quotation.numero, statusAntes: quotation.status, statusDepois: "EmCotacao" }, ip: getRequestIp(req) });
  return NextResponse.json(updated);
}
