"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { Eye, ShieldAlert } from "lucide-react";
import { entidadeOptions, labelForEntidade, labelForAcao } from "@/lib/audit-labels";
import type { AuditLogRecord } from "@/hooks/use-audit-logs";

function isDeParaShape(v: unknown): v is { de: unknown; para: unknown } {
  return !!v && typeof v === "object" && "de" in v && "para" in v;
}

/** Renderiza o JSON de `detalhes` de forma legível, com destaque para diffs (de/para). */
function AuditDetalhesView({ detalhes }: { detalhes: unknown }) {
  if (!detalhes || typeof detalhes !== "object") {
    return <p className="text-sm text-muted-foreground">Sem detalhes registrados.</p>;
  }

  const obj = detalhes as Record<string, unknown>;
  const alteracoes = obj.alteracoes;

  return (
    <div className="space-y-3 text-sm">
      {Object.entries(obj)
        .filter(([key]) => key !== "alteracoes")
        .map(([key, value]) => (
          <p key={key}>
            <span className="font-medium">{key}:</span> {String(value)}
          </p>
        ))}

      {!!alteracoes && typeof alteracoes === "object" && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium">Alterações</p>
          {Object.entries(alteracoes as Record<string, unknown>).map(([campo, valor]) => {
            if (isDeParaShape(valor)) {
              return (
                <p key={campo} className="text-xs">
                  <span className="font-medium">{campo}:</span>{" "}
                  <span className="text-muted-foreground line-through">{String(valor.de)}</span>{" "}
                  → <span className="font-medium">{String(valor.para)}</span>
                </p>
              );
            }
            if (Array.isArray(valor)) {
              return (
                <div key={campo} className="text-xs">
                  <span className="font-medium">{campo}:</span>
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
                <span className="font-medium">{campo}:</span> {String(valor)}
              </p>
            );
          })}
        </div>
      )}
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
        <DialogContent className="max-w-lg">
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
