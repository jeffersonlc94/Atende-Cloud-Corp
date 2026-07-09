import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validations";
import { registerAudit, getRequestIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companies = await prisma.company.findMany({
    orderBy: { razaoSocial: "asc" },
  });

  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = companySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.create({ data: parsed.data });

  await registerAudit({
    userId: session.user.id,
    acao: "create",
    entidade: "Company",
    entidadeId: company.id,
    detalhes: { razaoSocial: company.razaoSocial },
    ip: getRequestIp(req),
  });

  return NextResponse.json(company, { status: 201 });
}
