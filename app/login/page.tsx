import { Suspense } from "react";
import { LoginForm } from "@/components/layout/login-form";
import { prisma } from "@/lib/prisma";
import { getBrandName } from "@/lib/mailer";

// Nome/logo vêm das configurações do sistema ou da empresa emissora padrão.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const brand = await getBrandName().catch(() => "Atende Cloud Corp");
  const settings = await prisma.systemSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  const logoUrl =
    settings?.logoUrl ||
    (
      await prisma.company
        .findFirst({ where: { isDefault: true }, select: { logoUrl: true } })
        .catch(() => null)
    )?.logoUrl ||
    null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={brand}
              className="mx-auto mb-3 h-16 w-16 rounded-2xl object-contain"
            />
          )}
          <h1 className="text-2xl font-bold tracking-tight">{brand}</h1>
          <p className="text-sm text-muted-foreground">
            Entre com suas credenciais para continuar
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
