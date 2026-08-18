import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { Construction } from "lucide-react";
import { MaintenanceGate } from "@/components/layout/maintenance-gate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { maintenanceMode: true, maintenanceMessage: true, systemName: true },
  }).catch(() => null);

  if (settings?.maintenanceMode && session.user.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <section className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Construction className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Sistema temporariamente indisponível</h1>
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
            {settings.maintenanceMessage || "O sistema está em manutenção ou atualização. Tente novamente em alguns minutos."}
          </p>
          <p className="mt-6 text-xs text-muted-foreground">{settings.systemName || "Atende Cloud Corp"}</p>
        </section>
      </main>
    );
  }

  return (
    <MaintenanceGate>
    <div className="flex h-screen overflow-clip">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 [contain:layout]">
          {children}
        </main>
      </div>
    </div>
    </MaintenanceGate>
  );
}
