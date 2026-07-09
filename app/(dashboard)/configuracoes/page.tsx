"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, MailCheck, MailX, Send } from "lucide-react";

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

export default function ConfiguracoesPage() {
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Status de integrações e rotinas do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" /> Envio de e-mails (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  );
}
