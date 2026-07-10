"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Mail, Phone, User } from "lucide-react";
import { APP_AUTHOR_EMAIL, APP_AUTHOR_NAME, APP_AUTHOR_PHONE, APP_VERSION } from "@/lib/version";

type SystemInfo = {
  appVersion: string;
  dbVersion: string;
  dockerVersion: string;
  environment: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro na requisição");
  return res.json();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export function SobreTab() {
  const { data: info, isLoading } = useQuery({
    queryKey: ["system-info"],
    queryFn: () => fetchJson<SystemInfo>("/api/system-info"),
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4" /> Sobre o sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Nome do sistema" value="Atende Cloud Corp" />
            <InfoRow label="Versão" value={APP_VERSION} />
            <InfoRow label="Ambiente" value={isLoading ? "Carregando..." : info?.environment ?? "—"} />
            <InfoRow label="Versão do banco de dados" value={isLoading ? "Carregando..." : info?.dbVersion ?? "—"} />
            <InfoRow label="Versão do Docker" value={isLoading ? "Carregando..." : info?.dockerVersion ?? "—"} />
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            A versão do Docker normalmente não está disponível de dentro do próprio
            container em execução (não há acesso ao daemon do host). Para exibi-la,
            defina a variável de ambiente <code>DOCKER_VERSION</code> no container com
            o valor obtido via <code>docker version</code> no host.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold">Desenvolvido por</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" /> {APP_AUTHOR_NAME}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" /> {APP_AUTHOR_EMAIL}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" /> {APP_AUTHOR_PHONE}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
