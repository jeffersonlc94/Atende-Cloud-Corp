import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const file = (await req.formData()).get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  const isVideo = VIDEO_TYPES.includes(file.type);
  const isPdf = file.type === "application/pdf";
  if (!isVideo && !isPdf) return NextResponse.json({ error: "Envie um vídeo MP4/WebM/MOV ou documento PDF" }, { status: 400 });
  const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: `Arquivo muito grande (máx. ${isVideo ? "500 MB" : "50 MB"})` }, { status: 400 });
  const dir = path.join(process.cwd(), "public", "uploads", "training");
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || (isPdf ? ".pdf" : ".mp4");
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/training/${filename}`, nomeArquivo: file.name, tipo: isVideo ? "Videoaula" : "Documento" }, { status: 201 });
}
