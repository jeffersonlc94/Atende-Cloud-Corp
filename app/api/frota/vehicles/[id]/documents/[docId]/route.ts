import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { vehicleDocumentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; docId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { id, docId } = await params;
  const body = await req.json();
  const parsed = vehicleDocumentSchema.safeParse({ ...body, vehicleId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Se o arquivo foi substituído, guarda o anterior no histórico de versões
  // para permitir reimpressão de documentos antigos.
  const existente = await prisma.vehicleDocument.findUnique({ where: { id: docId } });
  let versoes = (existente?.versoes as { url: string; substituidaEm: string }[] | null) ?? [];
  if (
    existente?.arquivoUrl &&
    data.arquivoUrl &&
    existente.arquivoUrl !== data.arquivoUrl
  ) {
    versoes = [
      { url: existente.arquivoUrl, substituidaEm: new Date().toISOString() },
      ...versoes,
    ].slice(0, 20);
  }

  const doc = await prisma.vehicleDocument.update({
    where: { id: docId },
    data: {
      tipo: data.tipo,
      arquivoUrl: data.arquivoUrl || null,
      versoes,
      dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
      dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
    },
  });

  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "frota")) {
    return NextResponse.json({ error: "Acesso ao módulo não autorizado." }, { status: 403 });
  }

  const { docId } = await params;
  await prisma.vehicleDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
