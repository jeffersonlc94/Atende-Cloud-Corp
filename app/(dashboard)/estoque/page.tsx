"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  useStockMovements,
  useCreateStockMovement,
  useUpdateStockMovement,
  useDeleteStockMovement,
  type StockMovementRecord,
} from "@/hooks/use-estoque";
import { canDeleteRecords } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDateBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Boxes,
  PackageCheck,
  PackageX,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Undo2,
  BadgeDollarSign,
} from "lucide-react";

const emptyForm = {
  cod: "",
  descricao: "",
  qtd: "1",
  respRetirada: "",
  respEntrega: "",
  data: new Date().toISOString().slice(0, 10),
  numeroSerie: "",
  destino: "",
  devolvido: false,
  status: "Pendente" as "Pendente" | "Devolvido" | "Vendido",
  observacoes: "",
};

export default function EstoquePage() {
  const { data: session } = useSession();
  const canDelete = canDeleteRecords(session);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "Pendente" | "Devolvido" | "Vendido">("todos");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const { data: items = [], isLoading } = useStockMovements({
    q: busca || undefined,
    status: statusFiltro === "todos" ? undefined : statusFiltro,
    dataInicial: dataInicial || undefined,
    dataFinal: dataFinal || undefined,
  });
  const createMov = useCreateStockMovement();
  const updateMov = useUpdateStockMovement();
  const deleteMov = useDeleteStockMovement();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StockMovementRecord | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{
    m: StockMovementRecord;
    status: "Pendente" | "Devolvido" | "Vendido";
  } | null>(null);

  const { total, pendentes, devolvidos, vendidos } = useMemo(() => {
    let pend = 0;
    let dev = 0;
    let ven = 0;
    for (const m of items) {
      if (m.status === "Devolvido") dev++;
      else if (m.status === "Vendido") ven++;
      else pend++;
    }
    return { total: items.length, pendentes: pend, devolvidos: dev, vendidos: ven };
  }, [items]);

  function handleEdit(m: StockMovementRecord) {
    setEditingId(m.id);
    setForm({
      cod: m.cod,
      descricao: m.descricao,
      qtd: String(m.qtd),
      respRetirada: m.respRetirada,
      respEntrega: m.respEntrega || "",
      data: m.data.slice(0, 10),
      numeroSerie: m.numeroSerie || "",
      destino: m.destino || "",
      devolvido: m.devolvido,
      status: (m.status as typeof emptyForm.status) || "Pendente",
      observacoes: m.observacoes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function toPayload(f: typeof emptyForm) {
    return {
      cod: f.cod,
      descricao: f.descricao,
      qtd: f.qtd ? parseInt(f.qtd, 10) : 1,
      respRetirada: f.respRetirada,
      respEntrega: f.respEntrega,
      data: f.data,
      numeroSerie: f.numeroSerie,
      destino: f.destino,
      devolvido: f.devolvido,
      status: f.status,
      observacoes: f.observacoes,
    };
  }

  async function handleSave() {
    try {
      if (editingId) {
        await updateMov.mutateAsync({ id: editingId, data: toPayload(form) });
        toast.success("Lançamento atualizado");
      } else {
        await createMov.mutateAsync(toPayload(form));
        toast.success("Lançamento registrado no controle de estoque");
      }
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar lançamento");
    }
  }

  async function applyStatus(m: StockMovementRecord, status: "Pendente" | "Devolvido" | "Vendido") {
    try {
      await updateMov.mutateAsync({
        id: m.id,
        data: {
          cod: m.cod,
          descricao: m.descricao,
          qtd: m.qtd,
          respRetirada: m.respRetirada,
          respEntrega: m.respEntrega || "",
          data: m.data.slice(0, 10),
          numeroSerie: m.numeroSerie || "",
          destino: m.destino || "",
          devolvido: status === "Devolvido",
          status,
          observacoes: m.observacoes || "",
        },
      });
      toast.success(
        status === "Vendido"
          ? "Baixa registrada: item vendido"
          : status === "Devolvido"
            ? "Marcado como devolvido"
            : "Lançamento reaberto"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMov.mutateAsync(pendingDelete.id);
      toast.success("Lançamento excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir lançamento");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controle de Estoque</h1>
        <p className="text-sm text-muted-foreground">
          Saídas de produtos com número de série, responsáveis e destino
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-sky-400 dark:border-l-sky-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lançamentos</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <PackageX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Em aberto</p>
              <p className="text-xl font-bold">{pendentes}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400 dark:border-l-emerald-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Devolvidos</p>
              <p className="text-xl font-bold">{devolvidos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-400 dark:border-l-violet-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendidos (baixa)</p>
              <p className="text-xl font-bold">{vendidos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar lançamento" : "Novo lançamento"}</CardTitle>
          <CardDescription>
            {editingId
              ? "Atualize os dados do lançamento selecionado"
              : "Registre a saída de um produto do estoque"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Código *</Label>
              <Input
                placeholder="Ex: 2970"
                value={form.cod}
                onChange={(e) => setForm({ ...form, cod: e.target.value })}
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: SSD Kingston 240GB"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <NumberInput
                value={form.qtd ? Number(form.qtd) : undefined}
                onValueChange={(v) => setForm({ ...form, qtd: v === undefined ? "" : String(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Resp. retirada *</Label>
              <Input
                value={form.respRetirada}
                onChange={(e) => setForm({ ...form, respRetirada: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Resp. entrega</Label>
              <Input
                value={form.respEntrega}
                onChange={(e) => setForm({ ...form, respEntrega: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Número de série</Label>
              <Input
                placeholder="Ex: 76C9A"
                value={form.numeroSerie}
                onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label>Destino</Label>
              <Input
                placeholder="Ex: Venda OS 5532, Teste 5517"
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label>Observações</Label>
              <Input
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!form.cod || !form.descricao || !form.respRetirada) {
                  toast.error("Preencha código, descrição e responsável pela retirada");
                  return;
                }
                setConfirmSaveOpen(true);
              }}
              disabled={createMov.isPending || updateMov.isPending}
            >
              {editingId ? "Salvar alterações" : "Registrar lançamento"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                <X className="mr-1 h-4 w-4" /> Cancelar edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por código, descrição, série, destino ou responsável"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={statusFiltro}
                onValueChange={(v) => setStatusFiltro(v as typeof statusFiltro)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue>
                    {(v: string) => (v === "todos" ? "Todos" : v === "Pendente" ? "Em aberto" : v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Pendente">Em aberto</SelectItem>
                  <SelectItem value="Devolvido">Devolvido</SelectItem>
                  <SelectItem value="Vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                className="w-36"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Até</Label>
              <Input
                type="date"
                className="w-36"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Cód.</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Resp. retirada</TableHead>
                    <TableHead>Resp. entrega</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Nº de série</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((m) => (
                    <TableRow key={m.id} className="transition-colors odd:bg-muted/20 hover:bg-muted/40">
                      <TableCell className="font-medium">{m.cod}</TableCell>
                      <TableCell className="max-w-[220px] truncate" title={m.descricao}>
                        {m.descricao}
                      </TableCell>
                      <TableCell>{m.qtd}</TableCell>
                      <TableCell>{m.respRetirada}</TableCell>
                      <TableCell>{m.respEntrega || "—"}</TableCell>
                      <TableCell>{formatDateBR(m.data)}</TableCell>
                      <TableCell className="font-mono text-xs">{m.numeroSerie || "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate" title={m.destino || ""}>
                        {m.destino || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            m.status === "Devolvido"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                              : m.status === "Vendido"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                          )}
                        >
                          {m.status === "Pendente" ? "Em aberto" : m.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {m.status === "Pendente" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Dar baixa: vendido"
                                className="text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10"
                                onClick={() => setPendingStatus({ m, status: "Vendido" })}
                              >
                                <BadgeDollarSign className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Marcar como devolvido"
                                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                                onClick={() => setPendingStatus({ m, status: "Devolvido" })}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reabrir lançamento"
                              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10"
                              onClick={() => setPendingStatus({ m, status: "Pendente" })}
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                            onClick={() => handleEdit(m)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                              onClick={() => setPendingDelete(m)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title={editingId ? "Confirma salvar as alterações?" : "Confirma o registro deste lançamento?"}
        confirmLabel={editingId ? "Salvar" : "Registrar"}
        onConfirm={handleSave}
      />
      <ConfirmDialog
        open={!!pendingStatus}
        onOpenChange={(o) => !o && setPendingStatus(null)}
        title={
          pendingStatus?.status === "Vendido"
            ? "Confirmar a baixa deste item como vendido?"
            : pendingStatus?.status === "Devolvido"
              ? "Confirmar a devolução deste item?"
              : "Reabrir este lançamento?"
        }
        confirmLabel={
          pendingStatus?.status === "Vendido"
            ? "Dar baixa"
            : pendingStatus?.status === "Devolvido"
              ? "Confirmar"
              : "Reabrir"
        }
        onConfirm={() => {
          if (pendingStatus) applyStatus(pendingStatus.m, pendingStatus.status);
          setPendingStatus(null);
        }}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão deste lançamento?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
