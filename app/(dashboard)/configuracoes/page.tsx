"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Mail,
  MailCheck,
  MailX,
  Send,
  Settings,
  Building2,
  BellRing,
  ShieldCheck,
  Save,
} from "lucide-react";
import { PersonalizacaoTab } from "@/components/settings/personalizacao-tab";
import { CompaniesManager } from "@/components/companies/companies-manager";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-settings";
import { notificationTipoOptions } from "@/lib/validations";
import {
  cargoLabels,
  notificationTipoLabels,
  type NotificationCargoPrefs,
  type CargoValue,
} from "@/lib/notification-prefs";

type SmtpStatus = {
  configured: boolean;
  host: string | null;
  port: string | null;
  from: string | null;
  secure: boolean;
  recipients: string[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro na requisição");
  return res.json();
}

function NotificacoesTab() {
  const { data: smtp, isLoading } = useQuery({
    queryKey: ["smtp-status"],
    queryFn: () => fetchJson<SmtpStatus>("/api/config/smtp-status"),
  });
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  async function handleTest() {
    setTesting(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/frota/notifications/run", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Erro ao executar rotina de notificações");
      setLastResult(body);
      toast.success(
        body.sent > 0
          ? `${body.sent} e-mail(s) enviado(s) com sucesso.`
          : "Rotina executada. Nenhum e-mail novo foi enviado (ver detalhes abaixo)."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao testar notificações");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4" /> Envio de e-mails (SMTP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 pb-5">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Verificando configuração...</p>
        )}

        {!isLoading && smtp && (
          <>
            <div className="flex items-center gap-2">
              {smtp.configured ? (
                <Badge className="gap-1">
                  <MailCheck className="h-3.5 w-3.5" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <MailX className="h-3.5 w-3.5" /> Não configurado
                </Badge>
              )}
            </div>

            {smtp.configured && (
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Host</dt>
                  <dd>{smtp.host}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Porta</dt>
                  <dd>{smtp.port}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Remetente</dt>
                  <dd>{smtp.from}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Conexão segura (TLS)</dt>
                  <dd>{smtp.secure ? "Sim" : "Não"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Destinatários das notificações de frota</dt>
                  <dd>{smtp.recipients.length > 0 ? smtp.recipients.join(", ") : "Nenhum configurado"}</dd>
                </div>
              </dl>
            )}

            {!smtp.configured && (
              <p className="text-sm text-muted-foreground">
                Defina as variáveis SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM e
                SMTP_SECURE no ambiente para habilitar o envio de e-mails.
              </p>
            )}
          </>
        )}

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Notificações da frota</p>
          <p className="text-sm text-muted-foreground">
            Dispara e-mails para checklists não realizados, documentos e trocas de óleo
            vencendo/vencidos, evitando reenvio no mesmo dia.
          </p>
          <Button onClick={handleTest} disabled={testing}>
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Testar envio de notificações
          </Button>

          {lastResult && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificacoesTabWrapper() {
  return (
    <div className="space-y-4">
      <NotificacoesTab />
      <NotificationCargoPrefsCard />
    </div>
  );
}

const CARGOS: CargoValue[] = ["TECNICO", "VENDEDOR"];

function NotificationCargoPrefsCard() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [prefs, setPrefs] = useState<NotificationCargoPrefs>({});

  useEffect(() => {
    if (settings) {
      setPrefs((settings.notificationCargoPrefs as NotificationCargoPrefs | null) ?? {});
    }
  }, [settings]);

  function isChecked(tipo: string, cargo: CargoValue) {
    const value = prefs[tipo as keyof NotificationCargoPrefs]?.[cargo];
    return value !== false;
  }

  function toggle(tipo: string, cargo: CargoValue) {
    setPrefs((prev) => {
      const tipoPrefs = { ...(prev[tipo as keyof NotificationCargoPrefs] ?? {}) };
      tipoPrefs[cargo] = !isChecked(tipo, cargo);
      return { ...prev, [tipo]: tipoPrefs };
    });
  }

  async function handleSave() {
    try {
      await updateSettings.mutateAsync({ notificationCargoPrefs: prefs });
      toast.success("Preferências de notificação salvas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar preferências");
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" /> Notificações por cargo
        </CardTitle>
        <CardDescription>
          Escolha quais tipos de notificação são enviados para cada cargo. Usuários sem cargo
          definido recebem todas as notificações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 pb-5">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Tipo de notificação</th>
                  {CARGOS.map((cargo) => (
                    <th key={cargo} className="py-2 px-4 font-medium">
                      {cargoLabels[cargo]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notificationTipoOptions.map((tipo) => (
                  <tr key={tipo} className="border-b last:border-0">
                    <td className="py-2 pr-4">{notificationTipoLabels[tipo]}</td>
                    {CARGOS.map((cargo) => (
                      <td key={cargo} className="py-2 px-4">
                        <Checkbox
                          checked={isChecked(tipo, cargo)}
                          onCheckedChange={() => toggle(tipo, cargo)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar preferências
        </Button>
      </CardContent>
    </Card>
  );
}

function SegurancaTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [minutes, setMinutes] = useState<string>("");

  useEffect(() => {
    if (settings) {
      setMinutes(settings.autoLogoutMinutes ? String(settings.autoLogoutMinutes) : "");
    }
  }, [settings]);

  async function handleSave() {
    try {
      const parsed = minutes.trim() ? parseInt(minutes, 10) : undefined;
      await updateSettings.mutateAsync({ autoLogoutMinutes: parsed });
      toast.success("Configuração de segurança salva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar configuração");
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" /> Auto logout por inatividade
        </CardTitle>
        <CardDescription>
          Desconecta automaticamente usuários inativos após o tempo definido. Deixe em branco ou
          zero para desabilitar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 pb-5">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && (
          <div className="max-w-xs space-y-2">
            <Label>Tempo de inatividade (minutos)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ex: 30"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
        )}
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfiguracoesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "personalizacao";
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Personalização, empresas emissoras e notificações do sistema
        </p>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="personalizacao" className="gap-1.5">
            <Settings className="h-4 w-4" /> Personalização
          </TabsTrigger>
          <TabsTrigger value="empresas" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Empresas Emissoras
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5">
            <BellRing className="h-4 w-4" /> Notificações
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="seguranca" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Segurança
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personalizacao" className="pt-4">
          <PersonalizacaoTab />
        </TabsContent>
        <TabsContent value="empresas" className="pt-4">
          <CompaniesManager />
        </TabsContent>
        <TabsContent value="notificacoes" className="pt-4">
          <NotificacoesTabWrapper />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="seguranca" className="pt-4">
            <SegurancaTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
      <ConfiguracoesContent />
    </Suspense>
  );
}
