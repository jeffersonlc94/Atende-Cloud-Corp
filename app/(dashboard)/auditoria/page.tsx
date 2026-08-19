"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useAuditLogs, type AuditLogFilters } from "@/hooks/use-audit-logs";
import { useUsers } from "@/hooks/use-users";
import { canViewAuditLog } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Code2, Copy, Eye, Maximize2, ShieldAlert } from "lucide-react";
import { entidadeOptions, labelForEntidade, labelForAcao, labelForAuditField } from "@/lib/audit-labels";
import type { AuditLogRecord } from "@/hooks/use-audit-logs";
import { formatCurrencyBRL } from "@/lib/format";

function isDeParaShape(v: unknown): v is { de: unknown; para: unknown } {
  return !!v && typeof v === "object" && "de" in v && "para" in v;
}

function AuditValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Sim" : "Não"}</span>;
  if (typeof value === "object") {
    return <JsonAuditValue value={value} />;
  }
  return <span>{String(value)}</span>;
}

function JsonAuditValue({ value }: { value: object }) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(value, null, 2);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("JSON copiado");
    } catch {
      toast.error("Não foi possível copiar o JSON");
    }
  }

  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setExpanded(true)}>
          <Maximize2 className="mr-1 h-3.5 w-3.5" /> Ampliar
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={copyJson}>
          <Copy className="mr-1 h-3.5 w-3.5" /> Copiar JSON
        </Button>
      </div>
      <pre className="max-h-56 overflow-auto whitespace-pre rounded bg-muted p-2 text-[11px]">{json}</pre>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="h-[88vh] w-[96vw] max-w-none overflow-hidden sm:max-w-[96vw] xl:max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Visualização ampliada do JSON</DialogTitle>
            <DialogDescription>Conteúdo técnico completo do registro de auditoria.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={copyJson}>
              <Copy className="mr-2 h-4 w-4" /> Copiar JSON
            </Button>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre rounded-md border bg-muted p-4 text-xs">{json}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function simpleAuditValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "Vazio";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (/valor|total|subtotal|custo|frete|desconto/i.test(field) && !Number.isNaN(Number(value))) {
    return formatCurrencyBRL(Number(value));
  }
  if (/data|createdAt|updatedAt/i.test(field) && typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleString("pt-BR");
  }
  const statuses: Record<string, string> = { Negociacao: "Em negociação", Enviado: "Enviado", NaoAprovado: "Não aprovado", Aprovado: "Aprovado" };
  if (typeof value === "string" && statuses[value]) return statuses[value];
  return String(value);
}

function SimpleItemsDiff({ before, after }: { before: unknown; after: unknown }) {
  const oldItems = Array.isArray(before) ? before as Record<string, unknown>[] : [];
  const newItems = Array.isArray(after) ? after as Record<string, unknown>[] : [];
  const ignored = new Set(["id", "quoteId", "ordem"]);
  const messages: string[] = [];
  const count = Math.max(oldItems.length, newItems.length);
  for (let index = 0; index < count; index++) {
    const oldItem = oldItems[index];
    const newItem = newItems[index];
    if (!oldItem && newItem) {
      messages.push(`Item ${index + 1} adicionado: ${String(newItem.descricao ?? "Sem descrição")}`);
      continue;
    }
    if (oldItem && !newItem) {
      messages.push(`Item ${index + 1} removido: ${String(oldItem.descricao ?? "Sem descrição")}`);
      continue;
    }
    if (!oldItem || !newItem) continue;
    for (const field of new Set([...Object.keys(oldItem), ...Object.keys(newItem)])) {
      if (ignored.has(field) || JSON.stringify(oldItem[field]) === JSON.stringify(newItem[field])) continue;
      messages.push(`Item ${index + 1} — ${labelForAuditField(field)}: ${simpleAuditValue(field, oldItem[field])} → ${simpleAuditValue(field, newItem[field])}`);
    }
  }
  return <ul className="space-y-1 text-xs">{messages.map((message, index) => <li key={index} className="rounded bg-muted/60 px-2 py-1.5">{message}</li>)}</ul>;
}

/** Renderiza o JSON de `detalhes` de forma legível, com destaque para diffs (de/para). */
function AuditDetalhesView({ detalhes }: { detalhes: unknown }) {
  const [advanced, setAdvanced] = useState(false);
  if (!detalhes || typeof detalhes !== "object") {
    return <p className="text-sm text-muted-foreground">Sem detalhes registrados.</p>;
  }

  const obj = detalhes as Record<string, unknown>;
  const alteracoes = obj.alteracoes;
  const deleted = obj.registroExcluido;

  return (
    <div className="space-y-3 text-sm">
      {Object.entries(obj)
        .filter(([key]) => !["alteracoes", "registroExcluido", "camposAlterados"].includes(key))
        .map(([key, value]) => (
          <p key={key}>
            <span className="font-medium">{labelForAuditField(key)}:</span> <AuditValue value={value} />
          </p>
        ))}

      {typeof obj.camposAlterados === "number" && <p className="font-medium">{obj.camposAlterados} campo(s) alterado(s)</p>}

      {!!alteracoes && typeof alteracoes === "object" && !advanced && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium">O que foi alterado</p>
          {Object.entries(alteracoes as Record<string, unknown>).map(([campo, valor]) => isDeParaShape(valor) ? (
            <div key={campo} className="rounded-md bg-muted/50 p-2 text-xs">
              <p className="font-medium">{labelForAuditField(campo)}</p>
              {campo === "itens" ? <SimpleItemsDiff before={valor.de} after={valor.para} /> : (
                <p className="mt-1"><span className="text-muted-foreground">{simpleAuditValue(campo, valor.de)}</span> → <span className="font-medium">{simpleAuditValue(campo, valor.para)}</span></p>
              )}
            </div>
          ) : null)}
        </div>
      )}

      {!!deleted && typeof deleted === "object" && !advanced && (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50/50 p-3">
          <p className="font-medium text-red-800">Dados do registro excluído</p>
          {Object.entries(deleted as Record<string, unknown>).filter(([, value]) => typeof value !== "object").slice(0, 12).map(([field, value]) => (
            <p key={field} className="text-xs"><span className="font-medium">{labelForAuditField(field)}:</span> {simpleAuditValue(field, value)}</p>
          ))}
        </div>
      )}

      {(!!alteracoes || !!deleted) && (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdvanced((value) => !value)}>
          <Code2 className="mr-2 h-4 w-4" /> {advanced ? "Ocultar log avançado" : "Ver log avançado"}
        </Button>
      )}

      {!!alteracoes && typeof alteracoes === "object" && advanced && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium">Log avançado — alterações</p>
          {Object.entries(alteracoes as Record<string, unknown>).map(([campo, valor]) => {
            if (isDeParaShape(valor)) {
              return (
                <div key={campo} className="min-w-0 text-xs">
                  <span className="font-medium">{labelForAuditField(campo)}:</span>
                  <div className="mt-1 grid min-w-0 gap-3 lg:grid-cols-2">
                    <div className="min-w-0 rounded border border-red-200 bg-red-50 p-3"><span className="font-medium text-red-700">Antes</span><AuditValue value={valor.de} /></div>
                    <div className="min-w-0 rounded border border-emerald-200 bg-emerald-50 p-3"><span className="font-medium text-emerald-700">Depois</span><AuditValue value={valor.para} /></div>
                  </div>
                </div>
              );
            }
            if (Array.isArray(valor)) {
              return (
                <div key={campo} className="text-xs">
                  <span className="font-medium">{labelForAuditField(campo)}:</span>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {valor.map((v, idx) => (
                      <li key={idx}>
                        {typeof v === "object" && v && "item" in v ? (
                          <>
                            {String((v as { item: unknown }).item)}:{" "}
                            <span className="text-muted-foreground line-through">
                              {String((v as { de: unknown }).de)}
                            </span>{" "}
                            → {String((v as { para: unknown }).para)}
                          </>
                        ) : (
                          JSON.stringify(v)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return (
              <p key={campo} className="text-xs">
                <span className="font-medium">{labelForAuditField(campo)}:</span> <AuditValue value={valor} />
              </p>
            );
          })}
        </div>
      )}
      {!!deleted && advanced && <div className="rounded-md border p-3"><p className="font-medium">Log avançado — registro excluído</p><AuditValue value={deleted} /></div>}
    </div>
  );
}

export default function AuditoriaPage() {
  const { data: session } = useSession();
  const allowed = canViewAuditLog(session);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1 });
  const { data: users = [] } = useUsers();
  const { data, isLoading } = useAuditLogs(filters);
  const [viewingLog, setViewingLog] = useState<AuditLogRecord | null>(null);

  function updateFilter(key: keyof AuditLogFilters, value: string | undefined) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  if (!allowed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <ShieldAlert className="h-8 w-8" />
          <p>Apenas administradores podem visualizar os logs de auditoria.</p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de ações realizadas no sistema
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={filters.userId ?? "all"}
            onValueChange={(v) => updateFilter("userId", v === "all" ? undefined : (v as string))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Usuário">
                {(value) =>
                  !value || value === "all"
                    ? "Todos os usuários"
                    : users.find((u) => u.id === value)?.name ?? "Todos os usuários"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.entidade ?? "all"}
            onValueChange={(v) => updateFilter("entidade", v === "all" ? undefined : (v as string))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              {entidadeOptions.map((e) => (
                <SelectItem key={e} value={e}>
                  {labelForEntidade(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" onChange={(e) => updateFilter("dataInicial", e.target.value)} />
          <Input type="date" onChange={(e) => updateFilter("dataFinal", e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{log.user?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.acao === "delete"
                            ? "destructive"
                            : log.acao === "create"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {labelForAcao(log.acao)}
                      </Badge>
                    </TableCell>
                    <TableCell>{labelForEntidade(log.entidade)}</TableCell>
                    <TableCell className="font-mono text-xs">{log.entidadeId ?? "—"}</TableCell>
                    <TableCell>{log.ip ?? "—"}</TableCell>
                    <TableCell>
                      {log.detalhes ? (
                        <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => setViewingLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {data.page} de {totalPages} — {data.total} registro(s)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewingLog} onOpenChange={(o) => !o && setViewingLog(null)}>
        <DialogContent className="h-[88vh] w-[94vw] max-w-none overflow-y-auto p-5 sm:max-w-[94vw] xl:max-w-[1200px] xl:p-6">
          {viewingLog && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {labelForAcao(viewingLog.acao)} — {labelForEntidade(viewingLog.entidade)}
                </DialogTitle>
                <DialogDescription>
                  {viewingLog.user?.name ?? "—"} em{" "}
                  {new Date(viewingLog.createdAt).toLocaleString("pt-BR")}
                </DialogDescription>
              </DialogHeader>
              <AuditDetalhesView detalhes={viewingLog.detalhes} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
