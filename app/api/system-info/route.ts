import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let dbVersion = "Não disponível";
  try {
    const result = await prisma.$queryRawUnsafe<{ version: string }[]>("SELECT version()");
    dbVersion = result?.[0]?.version ?? "Não disponível";
  } catch {
    dbVersion = "Não disponível";
  }

  // A versão do Docker normalmente não é acessível de dentro do próprio
  // container em execução — não há um binário/daemon Docker disponível ali.
  // Se o operador quiser exibi-la, pode definir a env var DOCKER_VERSION
  // (ex: via `docker version --format '{{.Server.Version}}'` no host, repassada
  // ao container). Sem essa env var, mostramos "Não disponível".
  const dockerVersion = process.env.DOCKER_VERSION || "Não disponível";

  return NextResponse.json({
    appVersion: APP_VERSION,
    dbVersion,
    dockerVersion,
    environment: process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento",
  });
}
