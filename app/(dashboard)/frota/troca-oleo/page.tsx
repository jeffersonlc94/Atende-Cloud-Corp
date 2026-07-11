"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVehicles } from "@/hooks/use-vehicles";
import { useOilChanges, useCreateOilChange, useUpdateOilChange, useDeleteOilChange } from "@/hooks/use-fleet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VehicleSelect } from "@/components/frota/vehicle-select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Trash2, Pencil, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function TrocaOleoPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: items = [], isLoading } = useOilChanges();
  const createOil = useCreateOilChange();
  const updateOil = useUpdateOilChange();
  const deleteOil = useDeleteOilChange();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    vehicleId: "",
    data: new Date().toISOString().slice(0, 10),
    km: "",
    tipoOleo: "",
    oficina: "",
    valor: "",
    kmProximaTroca: "",
  };
  const [form, setForm] = useState(emptyForm);

  function handleEdit(o: (typeof items)[number]) {
    setEditingId(o.id);
    setForm({
      vehicleId: o.vehicleId,
      data: o.data.slice(0, 10),
      km: String(o.km),
      tipoOleo: o.tipoOleo || "",
      oficina: o.oficina || "",
      valor: o.valor ? String(o.valor) : "",
      kmProximaTroca: o.kmProximaTroca ? String(o.kmProximaTroca) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleAdd() {
    if (!form.vehicleId || !form.km) {
      toast.error("Selecione o veículo e informe o KM");
      return;
    }
    const payload = {
      vehicleId: form.vehicleId,
      data: form.data,
      km: parseInt(form.km, 10),
      tipoOleo: form.tipoOleo,
      oficina: form.oficina,
      valor: form.valor ? parseFloat(form.valor) : undefined,
      kmProximaTroca: form.kmProximaTroca ? parseInt(form.kmProximaTroca, 10) : undefined,
    };
    try {
      if (editingId) {
        await updateOil.mutateAsync({ id: editingId, data: payload });
        toast.success("Troca de óleo atualizada");
      } else {
        await createOil.mutateAsync(payload);
        toast.success("Troca de óleo registrada");
      }
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  // Última troca por veículo, para exibir progresso
  const lastByVehicle = new Map<string, (typeof items)[number]>();
  for (const o of items) {
    if (!lastByVehicle.has(o.vehicleId)) lastByVehicle.set(o.vehicleId, o);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Troca de Óleo</h1>
        <p className="text-sm text-muted-foreground">Controle de trocas de óleo da frota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status por veículo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => {
            const last = lastByVehicle.get(v.id);
            const proxima = last?.kmProximaTroca;
            const progress =
              proxima && proxima > last!.km
                ? Math.min(100, Math.max(0, ((v.kmAtual - last!.km) / (proxima - last!.km)) * 100))
                : 0;
            const overdue = proxima ? v.kmAtual >= proxima : false;
            return (
              <div key={v.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{v.placa} — {v.marca} {v.modelo}</p>
                {proxima ? (
                  <>
                    <Progress value={progress} className="mt-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.kmAtual.toLocaleString("pt-BR")} / {proxima.toLocaleString("pt-BR")} km
                    </p>
                    {overdue && <Badge variant="destructive" className="mt-1">Troca vencida</Badge>}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Sem registro de troca</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar troca de óleo" : "Nova troca de óleo"}</CardTitle>
          <CardDescription>
            {editingId
              ? "Atualize os dados da troca selecionada"
              : "Registre a troca e a quilometragem prevista para a próxima"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-7">
            <div className="space-y-1">
              <Label>Veículo *</Label>
              <VehicleSelect
                value={form.vehicleId}
                onChange={(v) => setForm({ ...form, vehicleId: v })}
              />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>KM *</Label>
              <NumberInput
                value={form.km ? Number(form.km) : undefined}
                onValueChange={(v) => setForm({ ...form, km: v === undefined ? "" : String(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de óleo</Label>
              <Input value={form.tipoOleo} onChange={(e) => setForm({ ...form, tipoOleo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Oficina</Label>
              <Input value={form.oficina} onChange={(e) => setForm({ ...form, oficina: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Próxima troca (KM)</Label>
              <NumberInput
                value={form.kmProximaTroca ? Number(form.kmProximaTroca) : undefined}
                onValueChange={(v) => setForm({ ...form, kmProximaTroca: v === undefined ? "" : String(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <CurrencyInput
                value={form.valor ? Number(form.valor) : undefined}
                onValueChange={(v) => setForm({ ...form, valor: v === undefined ? "" : String(v) })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!form.vehicleId || !form.km) {
                  toast.error("Selecione o veículo e informe o KM");
                  return;
                }
                setConfirmAddOpen(true);
              }}
              disabled={createOil.isPending || updateOil.isPending}
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
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma troca registrada.</p>
          )}
          {items.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0">
              <span>{o.vehicle.placa} — {formatDateBR(o.data)} — {o.km.toLocaleString("pt-BR")} km</span>
              <span>{o.tipoOleo || "—"}</span>
              <span>{o.valor ? formatCurrencyBRL(Number(o.valor)) : "—"}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Editar"
                  className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                  onClick={() => handleEdit(o)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Excluir"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                  onClick={() => setPendingDelete(o.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão desta troca de óleo?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteOil.mutate(pendingDelete)}
      />
      <ConfirmDialog
        open={confirmAddOpen}
        onOpenChange={setConfirmAddOpen}
        title={editingId ? "Confirma a alteração desta troca de óleo?" : "Confirma o registro desta troca de óleo?"}
        confirmLabel={editingId ? "Salvar" : "Registrar"}
        onConfirm={handleAdd}
      />
    </div>
  );
}
