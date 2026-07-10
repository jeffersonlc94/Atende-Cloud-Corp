"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, User, Leaf } from "lucide-react";
import { APP_AUTHOR_EMAIL, APP_AUTHOR_NAME, APP_AUTHOR_PHONE, APP_VERSION } from "@/lib/version";
import { useSystemSettings } from "@/hooks/use-settings";

const DEFAULT_SYSTEM_NAME = "Atende Cloud Corp";

export function SobreTab() {
  const { data: settings } = useSystemSettings();

  const systemName = settings?.systemName || DEFAULT_SYSTEM_NAME;
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        {settings?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt={systemName} className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-8 w-8" />
          </span>
        )}
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{systemName}</h2>
          <Badge className="bg-primary text-primary-foreground">{APP_VERSION}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Sistema de Orçamentos e Gestão de Frota</p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-5">
          <h3 className="mb-2 text-sm font-semibold">Sobre o sistema</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O {systemName} é um sistema completo para emissão e gestão de orçamentos e
            controle de frota de veículos: cadastro de empresas emissoras, clientes,
            itens e totalização automática, impressão em A4, histórico e pesquisa,
            além de veículos, checklists, manutenções, trocas de óleo, documentos,
            abastecimentos, notificações e relatórios — desenvolvido com foco em
            simplicidade e produtividade para o dia a dia da empresa.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="pt-5">
          <h3 className="mb-3 text-sm font-semibold">Desenvolvedor</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" /> {APP_AUTHOR_NAME}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" /> {APP_AUTHOR_PHONE}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" /> {APP_AUTHOR_EMAIL}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        © {year} {APP_AUTHOR_NAME}. Todos os direitos reservados.
      </p>
    </div>
  );
}
