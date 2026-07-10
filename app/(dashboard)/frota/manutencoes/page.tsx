"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMaintenances, useCreateMaintenance, useDeleteMaintenance } from "@/hooks/use-fleet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function ManutencoesPage() {
  const { data: items = [], isLoading } = useMaintenances();
  const createMaintenance = useCreateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: "",
    tipo: "",
    data: new Date().toISOString().slice(0, 10),
    oficina: "",
    valor: "",
    km: "",
    descricao: "",
  });

  async function handleAdd() {
    if (!form.vehicleId || !form.tipo) {
      toast.error("Selecione o veículo e informe o tipo");
      return;
    }
    try {
      await createMaintenance.mutateAsync({
        vehicleId: form.vehicleId,
        tipo: form.tipo,
        data: form.data,
        oficina: form.oficina,
        valor: form.valor ? parseFloat(form.valor) : undefined,
        km: form.km ? parseInt(form.km, 10) : undefined,
        descricao: form.descricao,
      });
      toast.success("Manutenção registrada");
      setForm({ vehicleId: "", tipo: "", data: new Date().toISOString().slice(0, 10), oficina: "", valor: "", km: "", descricao: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
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
          <CardTitle>Nova manutenção</CardTitle>
          <CardDescription>Registre serviços realizados na frota</CardDescription>
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
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>KM</Label>
              <Input type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <Button onClick={handleAdd} disabled={createMaintenance.isPending}>
            Registrar
          </Button>
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
                      <Button variant="ghost" size="icon" onClick={() => setPendingDelete(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
    </div>
  );
}
