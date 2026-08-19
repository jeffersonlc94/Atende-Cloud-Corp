"use client";

import { useSession } from "next-auth/react";
import { Construction } from "lucide-react";
import { useSystemSettings } from "@/hooks/use-settings";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { data: settings } = useSystemSettings();
  if (settings?.maintenanceMode && session?.user?.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-6">
        <section className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Construction className="h-8 w-8" /></span>
          <h1 className="mt-5 text-2xl font-bold">Sistema temporariamente indisponível</h1>
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{settings.maintenanceMessage || "O sistema está em manutenção ou atualização. Tente novamente em alguns minutos."}</p>
          <p className="mt-6 text-xs text-muted-foreground">{settings.systemName || "Atende Cloud Corp"}</p>
        </section>
      </main>
    );
  }
  return children;
}
