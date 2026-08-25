import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { supplierSchema } from "@/lib/supplier-quotation-validation";
import { getRequestIp, registerAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const search = req.nextUrl.searchParams.get("search")?.trim();
  const suppliers = await prisma.supplier.findMany({
    where: search ? { OR: [
      { razaoSocial: { contains: search, mode: "insensitive" } },
      { nomeFantasia: { contains: search, mode: "insensitive" } },
      { cnpjCpf: { contains: search, mode: "insensitive" } },
    ] } : undefined,
    orderBy: { razaoSocial: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "cotacoes")) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  const parsed = supplierSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const supplier = await prisma.supplier.create({ data: {
    razaoSocial: d.razaoSocial, nomeFantasia: d.nomeFantasia || null, cnpjCpf: d.cnpjCpf || null,
    telefone: d.telefone || null, email: d.email || null, endereco: d.endereco || null,
    contato: d.contato || null, observacoes: d.observacoes || null,
  } });
  await registerAudit({ userId: session.user.id, acao: "create", entidade: "Supplier", entidadeId: supplier.id, detalhes: { razaoSocial: supplier.razaoSocial }, ip: getRequestIp(req) });
  return NextResponse.json(supplier, { status: 201 });
}
