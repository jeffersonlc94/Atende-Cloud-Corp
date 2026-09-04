import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { getRequestIp, registerAudit } from "@/lib/audit";
import { technicalFilePath } from "@/lib/technical-files";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "arquivosTecnicos")) return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = (await params).id;
  const item = await prisma.technicalFile.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  const fullPath = technicalFilePath(item.nomeArmazenado);
  try {
    const info = await stat(fullPath);
    await registerAudit({ userId: session.user.id, acao: "download", entidade: "TechnicalFile", entidadeId: id, detalhes: { nome: item.nome, produto: item.produto, nomeOriginal: item.nomeOriginal }, ip: getRequestIp(req) });
    const asciiName = item.nomeOriginal.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const stream = Readable.toWeb(createReadStream(fullPath)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": item.mimeType || "application/octet-stream",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(item.nomeOriginal)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "O arquivo não foi encontrado no armazenamento do servidor" }, { status: 404 });
  }
}
