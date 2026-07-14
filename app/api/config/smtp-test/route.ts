import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendMail, getBrandName, templateTeste } from "@/lib/mailer";
import { z } from "zod";

const testSchema = z.object({ to: z.string().email("Informe um e-mail válido") });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Apenas administradores podem enviar e-mail de teste" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
  }

  const template = templateTeste(await getBrandName());
  const result = await sendMail({
    to: parsed.data.to,
    subject: template.subject,
    html: template.html,
  });

  if (!result.sent) {
    return NextResponse.json(
      { error: result.reason || "Falha ao enviar e-mail de teste" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
