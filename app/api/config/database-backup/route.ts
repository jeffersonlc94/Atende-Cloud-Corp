import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { registerAudit, getRequestIp } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem gerar backups" }, { status: 403 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL não configurada no servidor" }, { status: 500 });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `atende-cloud-backup-${stamp}.sql`;
  const outputPath = join(tmpdir(), `${crypto.randomUUID()}-${filename}`);
  const pgDump = process.env.PG_DUMP_PATH || "pg_dump";

  try {
    await execFileAsync(
      pgDump,
      [
        `--dbname=${databaseUrl}`,
        "--format=plain",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        `--file=${outputPath}`,
      ],
      { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }
    );

    const backup = await readFile(outputPath);
    await registerAudit({
      userId: session.user.id,
      acao: "backup",
      entidade: "Database",
      detalhes: { filename, bytes: backup.length },
      ip: getRequestIp(req),
    });

    return new Response(backup, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida";
    const toolMissing = /ENOENT|not recognized|não é reconhecido/i.test(message);
    return NextResponse.json(
      {
        error: toolMissing
          ? "O pg_dump não está instalado ou não foi encontrado no servidor. Configure PG_DUMP_PATH."
          : "Não foi possível gerar o backup do PostgreSQL. Verifique a conexão e as permissões do banco.",
      },
      { status: 500 }
    );
  } finally {
    await unlink(outputPath).catch(() => undefined);
  }
}
