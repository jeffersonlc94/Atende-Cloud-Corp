import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml",
  pdf: "application/pdf", mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg", mov: "video/quicktime",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

type Params = { params: Promise<{ filepath: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  const segments = (await params).filepath;
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.resolve(UPLOAD_DIR, ...segments);
  if (!filePath.startsWith(`${UPLOAD_DIR}${path.sep}`)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    const range = req.headers.get("range");

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${fileStat.size}` } });
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), fileStat.size - 1) : fileStat.size - 1;
      if (start > end || start >= fileStat.size) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${fileStat.size}` } });
      const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
      return new NextResponse(stream, { status: 206, headers: {
        "Content-Type": contentType, "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${fileStat.size}`, "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      } });
    }

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new NextResponse(stream, { headers: {
      "Content-Type": contentType, "Content-Length": String(fileStat.size), "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
