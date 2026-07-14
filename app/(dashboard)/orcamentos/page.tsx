"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCompanies } from "@/hooks/use-companies";
import { canDeleteRecords } from "@/lib/permissions";
import {
  useQuotesList,
  useDeleteQuote,
  useDuplicateQuote,
  type QuoteFilters,
} from "@/hooks/use-quotes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Printer,
  Search,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function OrcamentosPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const canDelete = canDeleteRecords(session);
  const { data: companies = [] } = useCompanies();
  const [filters, setFilters] = useState<QuoteFilters>({ scope: "mine" });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { data, isLoading } = useQuotesList(filters);
  const deleteQuote = useDeleteQuote();
  const duplicateQuote = useDuplicateQuote();

  function updateFilter(key: keyof QuoteFilters, value: string | undefined) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuote.mutateAsync(id);
      toast.success("Orçamento excluído");
    } catch {
      toast.error("Erro ao excluir orçamento");
    } finally {
      setPendingDelete(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const created = await duplicateQuote.mutateAsync(id);
      toast.success(`Orçamento duplicado como nº ${created.numero}`);
    } catch {
      toast.error("Erro ao duplicar orçamento");
    } finally {
      setPendingDuplicate(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de orçamentos emitidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={filters.scope ?? "mine"}
            onValueChange={(v) => setFilters((f) => ({ ...f, scope: v as "mine" | "global" }))}
          >
            <TabsList>
              <TabsTrigger value="mine">Meus Orçamentos</TabsTrigger>
              <TabsTrigger value="global">Orçamentos Globais</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Visualizar em tabela"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              title="Visualizar em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/orcamentos/novo" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Número"
            onChange={(e) => updateFilter("numero", e.target.value)}
          />
          <Input
            placeholder="Cliente"
            onChange={(e) => updateFilter("cliente", e.target.value)}
          />
          <Select
            value={filters.companyId ?? "all"}
            onValueChange={(v) =>
              updateFilter("companyId", v === "all" ? undefined : (v as string))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Empresa">
                {(value) =>
                  !value || value === "all"
                    ? "Todas as empresas"
                    : companies.find((c) => c.id === value)?.nomeFantasia ||
                      companies.find((c) => c.id === value)?.razaoSocial ||
                      "Todas as empresas"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nomeFantasia || c.razaoSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Data inicial"
            onChange={(e) => updateFilter("dataInicial", e.target.value)}
          />
          <Input
            type="date"
            placeholder="Data final"
            onChange={(e) => updateFilter("dataFinal", e.target.value)}
          />
        </CardContent>
      </Card>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <p className="col-span-full py-8 text-center text-muted-foreground">Carregando...</p>
          )}
          {!isLoading && data?.items.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">
              Nenhum orçamento encontrado
            </p>
          )}
          {data?.items.map((quote) => (
            <Card key={quote.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Nº {quote.numero}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatDateBR(quote.dataEmissao)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant={quote.visibilidade === "Privado" ? "secondary" : "outline"}>
                  {quote.visibilidade === "Privado" ? "Privado" : "Global"}
                </Badge>
                <p>
                  <span className="text-muted-foreground">Cliente:</span> {quote.client.nome}
                </p>
                <p>
                  <span className="text-muted-foreground">Empresa:</span>{" "}
                  {quote.company.nomeFantasia || quote.company.razaoSocial}
                </p>
                <p className="text-lg font-bold">{formatCurrencyBRL(Number(quote.total))}</p>
                <div className="flex flex-wrap items-center gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Visualizar"
                    onClick={() => router.push(`/orcamentos/${quote.id}/imprimir`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar"
                    onClick={() => router.push(`/orcamentos/${quote.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Duplicar"
                    onClick={() => setPendingDuplicate(quote.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      className="text-destructive"
                      onClick={() => setPendingDelete(quote.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      <Search className="mx-auto mb-2 h-5 w-5" />
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.numero}</TableCell>
                    <TableCell>{quote.client.nome}</TableCell>
                    <TableCell>
                      {quote.company.nomeFantasia || quote.company.razaoSocial}
                    </TableCell>
                    <TableCell>{formatDateBR(quote.dataEmissao)}</TableCell>
                    <TableCell>{quote.createdByUser?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={quote.visibilidade === "Privado" ? "secondary" : "outline"}>
                        {quote.visibilidade === "Privado" ? "Privado" : "Global"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(Number(quote.total))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/orcamentos/${quote.id}/imprimir`)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/orcamentos/${quote.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/orcamentos/${quote.id}/imprimir`, "_blank")
                            }
                          >
                            <Printer className="mr-2 h-4 w-4" /> Reimprimir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPendingDuplicate(quote.id)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(quote.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="space-y-4 p-6">
              <p className="font-medium">Confirma a exclusão deste orçamento?</p>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPendingDelete(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(pendingDelete)}>
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDuplicate}
        onOpenChange={(o) => !o && setPendingDuplicate(null)}
        title="Confirma a duplicação deste orçamento?"
        description="Um novo orçamento será criado a partir deste."
        confirmLabel="Duplicar"
        onConfirm={() => pendingDuplicate && handleDuplicate(pendingDuplicate)}
      />
    </div>
  );
}
