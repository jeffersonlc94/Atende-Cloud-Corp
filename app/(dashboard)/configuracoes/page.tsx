"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type SmtpStatus = {
  configured: boolean;
  host: string | null;
  port: string | null;
  from: string | null;
  secure: boolean;
  source: "painel" | "ambiente" | null;
  recipients: string[];
};

type SmtpSettings = {
  smtpHost: string;
  smtpPort: number | null;
  smtpUser: string;
  hasPassword: boolean;
  smtpSecure: boolean;
  smtpAllowInvalidCert: boolean;
  smtpFrom: string;
  notificationEmails: string;
  notificationDays: string;
  notificationTime: string;
  smtpEnabled: boolean;
};

const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

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
  const [testing, setTesting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  async function handleTest(channel: "both" | "email" | "telegram", force: boolean) {
    setTesting(force ? channel : "both");
    setLastResult(null);
    try {
      const res = await fetch("/api/frota/notifications/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, force }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Erro ao executar rotina de notificações");
      setLastResult(body);
      const total = (body.sent ?? 0) + (body.sentTelegram ?? 0);
      toast.success(
        total > 0
          ? `Enviado: ${body.sent ?? 0} e-mail(s) e ${body.sentTelegram ?? 0} mensagem(ns) no Telegram.`
          : "Rotina executada. Nenhum aviso novo foi enviado (ver detalhes abaixo)."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao testar notificações");
    } finally {
      setTesting(null);
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
                  <MailCheck className="h-3.5 w-3.5" />
                  Configurado{smtp.source ? ` (via ${smtp.source})` : ""}
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
                Preencha os dados do servidor SMTP no cartão acima (ou defina as variáveis
                SMTP_* no ambiente) para habilitar o envio de e-mails.
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleTest("both", false)} disabled={testing !== null}>
              {testing === "both" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Testar envio de notificações
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTest("telegram", true)}
              disabled={testing !== null}
            >
              {testing === "telegram" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Reenviar agora no Telegram
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTest("email", true)}
              disabled={testing !== null}
            >
              {testing === "email" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Reenviar agora por e-mail
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            &quot;Testar envio&quot; respeita o bloqueio de duplicados do dia; os botões de
            reenvio forçam o disparo imediato dos alertas pendentes no canal escolhido.
          </p>

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

function SmtpConfigCard() {
  const queryClient = useQueryClient();
  const { data: smtpConfig, isLoading } = useQuery({
    queryKey: ["smtp-config"],
    queryFn: () => fetchJson<SmtpSettings>("/api/config/smtp"),
  });
  const [form, setForm] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    smtpSecure: false,
    smtpAllowInvalidCert: false,
    smtpFrom: "",
    notificationEmails: "",
  });
  const [hasPassword, setHasPassword] = useState(false);
  // Dias da semana habilitados (0=Dom..6=Sáb). Vazio = todos os dias.
  const [dias, setDias] = useState<number[]>([]);
  const [horario, setHorario] = useState("08:00");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (smtpConfig) {
      setForm({
        smtpHost: smtpConfig.smtpHost,
        smtpPort: smtpConfig.smtpPort ? String(smtpConfig.smtpPort) : "",
        smtpUser: smtpConfig.smtpUser,
        smtpPass: "",
        smtpSecure: smtpConfig.smtpSecure,
        smtpAllowInvalidCert: smtpConfig.smtpAllowInvalidCert,
        smtpFrom: smtpConfig.smtpFrom,
        notificationEmails: smtpConfig.notificationEmails,
      });
      setHasPassword(smtpConfig.hasPassword);
      setDias(
        (smtpConfig.notificationDays || "")
          .split(",")
          .map((d) => parseInt(d.trim(), 10))
          .filter((d) => !Number.isNaN(d))
      );
      setHorario(smtpConfig.notificationTime || "08:00");
      setAtivo(smtpConfig.smtpEnabled);
    }
  }, [smtpConfig]);

  function toggleDia(value: number) {
    setDias((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          smtpPort: form.smtpPort ? parseInt(form.smtpPort, 10) : undefined,
          notificationDays: dias.join(","),
          notificationTime: horario,
          smtpEnabled: ativo,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof body?.error === "string" ? body.error : "Erro ao salvar");
      toast.success("Configuração SMTP salva");
      queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
      queryClient.invalidateQueries({ queryKey: ["smtp-status"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar configuração SMTP");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim()) {
      toast.error("Informe o e-mail de destino do teste");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/config/smtp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Falha no envio de teste");
      }
      toast.success(`E-mail de teste enviado para ${testEmail.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar e-mail de teste");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4" /> Configurar servidor SMTP
        </CardTitle>
        <CardDescription>
          Dados do servidor de e-mail usados para enviar as notificações do sistema. A
          configuração salva aqui tem prioridade sobre as variáveis de ambiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 pb-5">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && (
          <>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium">
              <Checkbox checked={ativo} onCheckedChange={(v) => setAtivo(v === true)} />
              <span>
                Envio por e-mail {ativo ? "ativado" : "pausado"}
                <span className="block text-xs font-normal text-muted-foreground">
                  Desmarque para pausar os avisos por e-mail sem perder a configuração
                </span>
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Servidor (host)</Label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={form.smtpHost}
                  onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Porta</Label>
                <Input
                  type="number"
                  placeholder="587"
                  value={form.smtpPort}
                  onChange={(e) => setForm({ ...form, smtpPort: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Usuário</Label>
                <Input
                  placeholder="usuario@dominio.com"
                  value={form.smtpUser}
                  onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Senha</Label>
                <Input
                  type="password"
                  placeholder={hasPassword ? "•••••• (deixe em branco para manter)" : ""}
                  value={form.smtpPass}
                  onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Remetente (from)</Label>
                <Input
                  placeholder='"Atende Cloud" <nao-responda@dominio.com>'
                  value={form.smtpFrom}
                  onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })}
                />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.smtpSecure}
                    onCheckedChange={(v) => setForm({ ...form, smtpSecure: v === true })}
                  />
                  Conexão segura (SSL/TLS — porta 465)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.smtpAllowInvalidCert}
                    onCheckedChange={(v) => setForm({ ...form, smtpAllowInvalidCert: v === true })}
                  />
                  <span>
                    Ignorar validação de certificado
                    <span className="block text-xs text-muted-foreground">
                      Use quando o servidor apresenta certificado de outro domínio
                    </span>
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Destinatários das notificações de frota</Label>
              <Input
                placeholder="email1@dominio.com, email2@dominio.com"
                value={form.notificationEmails}
                onChange={(e) => setForm({ ...form, notificationEmails: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Separe múltiplos e-mails por vírgula. Eles recebem os alertas de checklist,
                documentos e troca de óleo. Os usuários cadastrados também recebem — controle
                individualmente pela opção &quot;Receber notificações por e-mail&quot; na tela de
                Usuários.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Dias e horário dos disparos automáticos</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((d) => {
                  const ativo = dias.length === 0 || dias.includes(d.value);
                  const selecionado = dias.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDia(d.value)}
                      className={
                        selecionado
                          ? "rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                          : dias.length === 0
                            ? "rounded-full border border-dashed bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
                            : "rounded-full border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                      }
                      title={ativo ? "Envia neste dia" : "Não envia neste dia"}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-xs text-muted-foreground">Horário do disparo:</Label>
                <Input
                  type="time"
                  className="w-28"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {dias.length === 0
                  ? `Todos os dias às ${horario}.`
                  : `${DIAS_SEMANA.filter((d) => dias.includes(d.value))
                      .map((d) => d.label)
                      .join(", ")} às ${horario}.`}{" "}
                O disparo automático acontece nesse horário; o botão de teste envia na hora.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <Button onClick={() => setConfirmOpen(true)} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar configuração
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="destino do teste"
                  className="w-52"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button variant="outline" onClick={handleSendTest} disabled={sendingTest}>
                  {sendingTest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar teste
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirma salvar a configuração SMTP?"
        confirmLabel="Salvar"
        onConfirm={handleSave}
      />
    </Card>
  );
}

function TelegramConfigCard() {
  const queryClient = useQueryClient();
  const { data: tgConfig, isLoading } = useQuery({
    queryKey: ["telegram-config"],
    queryFn: () =>
      fetchJson<{
        hasToken: boolean;
        telegramChatIds: string;
        telegramEnabled: boolean;
        telegramDays: string;
        telegramTime: string;
      }>("/api/config/telegram"),
  });
  const [token, setToken] = useState("");
  const [chatIds, setChatIds] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [tgAtivo, setTgAtivo] = useState(true);
  const [tgDias, setTgDias] = useState<number[]>([]);
  const [tgHorario, setTgHorario] = useState("08:00");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testChatId, setTestChatId] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (tgConfig) {
      setChatIds(tgConfig.telegramChatIds);
      setHasToken(tgConfig.hasToken);
      setToken("");
      setTgAtivo(tgConfig.telegramEnabled);
      setTgDias(
        (tgConfig.telegramDays || "")
          .split(",")
          .map((d) => parseInt(d.trim(), 10))
          .filter((d) => !Number.isNaN(d))
      );
      setTgHorario(tgConfig.telegramTime || "08:00");
    }
  }, [tgConfig]);

  function toggleTgDia(value: number) {
    setTgDias((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/telegram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramBotToken: token,
          telegramChatIds: chatIds,
          telegramEnabled: tgAtivo,
          telegramDays: tgDias.join(","),
          telegramTime: tgHorario,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof body?.error === "string" ? body.error : "Erro ao salvar");
      toast.success("Configuração do Telegram salva");
      queryClient.invalidateQueries({ queryKey: ["telegram-config"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar configuração do Telegram");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!testChatId.trim()) {
      toast.error("Informe o chat ID de destino do teste");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/config/telegram-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: testChatId.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Falha no envio de teste");
      }
      toast.success("Mensagem de teste enviada no Telegram");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar teste do Telegram");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Send className="h-4 w-4" /> Notificações pelo Telegram
        </CardTitle>
        <CardDescription>
          Crie um bot com o @BotFather no Telegram (comando /newbot), cole o token aqui e os
          avisos da frota também serão enviados pelo Telegram — com os mesmos conteúdos dos
          e-mails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 pb-5">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && (
          <>
            <div className="flex items-center gap-2">
              {hasToken ? (
                <Badge className="gap-1">
                  <MailCheck className="h-3.5 w-3.5" /> Bot configurado
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <MailX className="h-3.5 w-3.5" /> Bot não configurado
                </Badge>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Token do bot</Label>
                <Input
                  type="password"
                  placeholder={hasToken ? "•••••• (deixe em branco para manter)" : "123456789:AAH..."}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Chats fixos (opcional)</Label>
                <Input
                  placeholder="-100123456789, 987654321"
                  value={chatIds}
                  onChange={(e) => setChatIds(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  IDs de grupos ou pessoas que recebem todos os avisos, separados por vírgula.
                  Além destes, cada usuário com chat ID no cadastro também recebe.
                </p>
              </div>
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium">
              <Checkbox checked={tgAtivo} onCheckedChange={(v) => setTgAtivo(v === true)} />
              <span>
                Envio pelo Telegram {tgAtivo ? "ativado" : "pausado"}
                <span className="block text-xs font-normal text-muted-foreground">
                  Desmarque para pausar os avisos no Telegram sem perder a configuração
                </span>
              </span>
            </label>
            <div className="space-y-1.5">
              <Label>Dias e horário dos disparos automáticos</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((d) => {
                  const selecionado = tgDias.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleTgDia(d.value)}
                      className={
                        selecionado
                          ? "rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                          : tgDias.length === 0
                            ? "rounded-full border border-dashed bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
                            : "rounded-full border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                      }
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-xs text-muted-foreground">Horário do disparo:</Label>
                <Input
                  type="time"
                  className="w-28"
                  value={tgHorario}
                  onChange={(e) => setTgHorario(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {tgDias.length === 0
                  ? `Todos os dias às ${tgHorario}.`
                  : `${DIAS_SEMANA.filter((d) => tgDias.includes(d.value))
                      .map((d) => d.label)
                      .join(", ")} às ${tgHorario}.`}{" "}
                O disparo automático acontece nesse horário; o botão de teste envia na hora.
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Como descobrir o chat ID de um usuário:</p>
              <p>
                1. O usuário abre o bot no Telegram e aperta <strong>Iniciar</strong> (ou envia
                qualquer mensagem). 2. Acesse{" "}
                <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> no navegador — o
                número em <code>&quot;chat&quot;:&#123;&quot;id&quot;:...&#125;</code> é o chat ID. 3. Cole no cadastro do
                usuário (Usuários › Editar › Telegram).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <Button onClick={() => setConfirmOpen(true)} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar configuração
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  placeholder="chat ID do teste"
                  className="w-44"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                />
                <Button variant="outline" onClick={handleSendTest} disabled={sendingTest}>
                  {sendingTest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar teste
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirma salvar a configuração do Telegram?"
        confirmLabel="Salvar"
        onConfirm={handleSave}
      />
    </Card>
  );
}

function NotificacoesTabWrapper() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  return (
    <div className="space-y-4">
      {isAdmin && <SmtpConfigCard />}
      {isAdmin && <TelegramConfigCard />}
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        <Button onClick={() => setConfirmOpen(true)} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar preferências
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirma salvar as preferências de notificação?"
        confirmLabel="Salvar"
        onConfirm={handleSave}
      />
    </Card>
  );
}

function SegurancaTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [minutes, setMinutes] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        <Button onClick={() => setConfirmOpen(true)} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirma salvar esta configuração de segurança?"
        confirmLabel="Salvar"
        onConfirm={handleSave}
      />
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
