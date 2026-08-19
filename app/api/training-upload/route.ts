import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(session, "treinamentos")) return NextResponse.json({ error: "Acesso ao módulo não autorizado" }, { status: 403 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const file = (await req.formData()).get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  const isVideo = VIDEO_TYPES.includes(file.type);
  const isPdf = file.type === "application/pdf";
  if (!isVideo && !isPdf) return NextResponse.json({ error: "Envie um vídeo MP4/WebM/MOV ou documento PDF" }, { status: 400 });
  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" }, select: { trainingVideoMaxMb: true, trainingDocumentMaxMb: true } });
  const maxMb = isVideo ? settings?.trainingVideoMaxMb ?? 0 : settings?.trainingDocumentMaxMb ?? 50;
  if (maxMb > 0 && file.size > maxMb * 1024 * 1024) return NextResponse.json({ error: `Arquivo muito grande (limite configurado: ${maxMb} MB)` }, { status: 413 });
  const dir = path.join(process.cwd(), "public", "uploads", "training");
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || (isPdf ? ".pdf" : ".mp4");
  const buffer = Buffer.from(await file.arrayBuffer());
  let filename = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    filename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`;
    try {
      await writeFile(path.join(dir, filename), buffer, { flag: "wx" });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || attempt === 4) throw error;
    }
  }
  return NextResponse.json({ url: `/uploads/training/${filename}`, nomeArquivo: file.name, tipo: isVideo ? "Videoaula" : "Documento" }, { status: 201 });
}
