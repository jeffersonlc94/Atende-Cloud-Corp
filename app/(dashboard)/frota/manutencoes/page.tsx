"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMaintenances, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance } from "@/hooks/use-fleet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VehicleSelect } from "@/components/frota/vehicle-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Trash2, Pencil, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function ManutencoesPage() {
  const { data: items = [], isLoading } = useMaintenances();
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    vehicleId: "",
    tipo: "",
    data: new Date().toISOString().slice(0, 10),
    oficina: "",
    valor: "",
    km: "",
    descricao: "",
  };
  const [form, setForm] = useState(emptyForm);

  function handleEdit(m: (typeof items)[number]) {
    setEditingId(m.id);
    setForm({
      vehicleId: m.vehicleId,
      tipo: m.tipo,
      data: m.data.slice(0, 10),
      oficina: m.oficina || "",
      valor: m.valor ? String(m.valor) : "",
      km: m.km ? String(m.km) : "",
      descricao: m.descricao || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleAdd() {
    if (!form.vehicleId || !form.tipo) {
      toast.error("Selecione o veículo e informe o tipo");
      return;
    }
    const payload = {
      vehicleId: form.vehicleId,
      tipo: form.tipo,
      data: form.data,
      oficina: form.oficina,
      valor: form.valor ? parseFloat(form.valor) : undefined,
      km: form.km ? parseInt(form.km, 10) : undefined,
      descricao: form.descricao,
    };
    try {
      if (editingId) {
        await updateMaintenance.mutateAsync({ id: editingId, data: payload });
        toast.success("Manutenção atualizada");
      } else {
        await createMaintenance.mutateAsync(payload);
        toast.success("Manutenção registrada");
      }
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manutenções</h1>
        <p className="text-sm text-muted-foreground">Registro de manutenções da frota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar manutenção" : "Nova manutenção"}</CardTitle>
          <CardDescription>
            {editingId ? "Atualize os dados da manutenção selecionada" : "Registre serviços realizados na frota"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <Label>Veículo *</Label>
              <VehicleSelect
                value={form.vehicleId}
                onChange={(v) => setForm({ ...form, vehicleId: v })}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Oficina</Label>
              <Input value={form.oficina} onChange={(e) => setForm({ ...form, oficina: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <CurrencyInput
                value={form.valor ? Number(form.valor) : undefined}
                onValueChange={(v) => setForm({ ...form, valor: v === undefined ? "" : String(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>KM</Label>
              <NumberInput
                value={form.km ? Number(form.km) : undefined}
                onValueChange={(v) => setForm({ ...form, km: v === undefined ? "" : String(v) })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!form.vehicleId || !form.tipo) {
                  toast.error("Selecione o veículo e informe o tipo");
                  return;
                }
                setConfirmAddOpen(true);
              }}
              disabled={createMaintenance.isPending || updateMaintenance.isPending}
            >
              {editingId ? "Salvar alterações" : "Registrar"}
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhuma manutenção registrada
                    </TableCell>
                  </TableRow>
                )}
                {items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.vehicle.placa}</TableCell>
                    <TableCell>{m.tipo}</TableCell>
                    <TableCell>{formatDateBR(m.data)}</TableCell>
                    <TableCell>{m.oficina || "—"}</TableCell>
                    <TableCell className="text-right">
                      {m.valor ? formatCurrencyBRL(Number(m.valor)) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                          onClick={() => handleEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                          onClick={() => setPendingDelete(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão desta manutenção?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteMaintenance.mutate(pendingDelete)}
      />
      <ConfirmDialog
        open={confirmAddOpen}
        onOpenChange={setConfirmAddOpen}
        title={editingId ? "Confirma a alteração desta manutenção?" : "Confirma o registro desta manutenção?"}
        confirmLabel={editingId ? "Salvar" : "Registrar"}
        onConfirm={handleAdd}
      />
    </div>
  );
}
