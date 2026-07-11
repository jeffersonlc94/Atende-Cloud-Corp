"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useFuels, useCreateFuel, useUpdateFuel, useDeleteFuel } from "@/hooks/use-fleet";
import { combustivelOptions } from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function AbastecimentosPage() {
  const { data: items = [], isLoading } = useFuels();
  const createFuel = useCreateFuel();
  const updateFuel = useUpdateFuel();
  const deleteFuel = useDeleteFuel();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    vehicleId: "",
    data: new Date().toISOString().slice(0, 10),
    km: "",
    litros: "",
    valorLitro: "",
    posto: "",
    tipoCombustivel: "Flex" as (typeof combustivelOptions)[number],
  };
  const [form, setForm] = useState(emptyForm);

  const valorTotal =
    form.litros && form.valorLitro ? parseFloat(form.litros) * parseFloat(form.valorLitro) : 0;

  function handleEdit(f: (typeof items)[number]) {
    setEditingId(f.id);
    setForm({
      vehicleId: f.vehicleId,
      data: f.data.slice(0, 10),
      km: f.km ? String(f.km) : "",
      litros: String(f.litros),
      valorLitro: String(f.valorLitro),
      posto: f.posto || "",
      tipoCombustivel: f.tipoCombustivel as (typeof combustivelOptions)[number],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleAdd() {
    if (!form.vehicleId || !form.litros || !form.valorLitro) {
      toast.error("Preencha veículo, litros e valor por litro");
      return;
    }
    const payload = {
      vehicleId: form.vehicleId,
      data: form.data,
      km: form.km ? parseInt(form.km, 10) : undefined,
      litros: parseFloat(form.litros),
      valorLitro: parseFloat(form.valorLitro),
      posto: form.posto,
      tipoCombustivel: form.tipoCombustivel,
    };
    try {
      if (editingId) {
        await updateFuel.mutateAsync({ id: editingId, data: payload });
        toast.success("Abastecimento atualizado");
      } else {
        await createFuel.mutateAsync(payload);
        toast.success("Abastecimento registrado");
      }
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abastecimentos</h1>
        <p className="text-sm text-muted-foreground">Controle de abastecimentos da frota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar abastecimento" : "Novo abastecimento"}</CardTitle>
          <CardDescription>
            {editingId
              ? "Atualize os dados do abastecimento selecionado"
              : "Registre litros, valor e posto de abastecimento"}
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
              <Label>KM</Label>
              <NumberInput
                value={form.km ? Number(form.km) : undefined}
                onValueChange={(v) => setForm({ ...form, km: v === undefined ? "" : String(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Litros *</Label>
              <Input type="number" step="0.01" value={form.litros} onChange={(e) => setForm({ ...form, litros: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Valor/litro *</Label>
              <CurrencyInput
                value={form.valorLitro ? Number(form.valorLitro) : undefined}
                onValueChange={(v) => setForm({ ...form, valorLitro: v === undefined ? "" : String(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Posto</Label>
              <Input value={form.posto} onChange={(e) => setForm({ ...form, posto: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Combustível</Label>
              <Select
                value={form.tipoCombustivel}
                onValueChange={(v) => setForm({ ...form, tipoCombustivel: v as typeof form.tipoCombustivel })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {combustivelOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Valor total: <span className="font-medium text-foreground">{formatCurrencyBRL(valorTotal)}</span>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!form.vehicleId || !form.litros || !form.valorLitro) {
                  toast.error("Preencha veículo, litros e valor por litro");
                  return;
                }
                setConfirmAddOpen(true);
              }}
              disabled={createFuel.isPending || updateFuel.isPending}
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
                  <TableHead>Data</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Valor/litro</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Posto</TableHead>
                  <TableHead className="w-20" />
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
                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum abastecimento registrado
                    </TableCell>
                  </TableRow>
                )}
                {items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.vehicle.placa}</TableCell>
                    <TableCell>{formatDateBR(f.data)}</TableCell>
                    <TableCell>{Number(f.litros).toLocaleString("pt-BR")} L</TableCell>
                    <TableCell>{formatCurrencyBRL(Number(f.valorLitro))}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(Number(f.valorTotal))}</TableCell>
                    <TableCell>{f.posto || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                          onClick={() => handleEdit(f)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                          onClick={() => setPendingDelete(f.id)}
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
        title="Confirma a exclusão deste abastecimento?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteFuel.mutate(pendingDelete)}
      />
      <ConfirmDialog
        open={confirmAddOpen}
        onOpenChange={setConfirmAddOpen}
        title={editingId ? "Confirma a alteração deste abastecimento?" : "Confirma o registro deste abastecimento?"}
        confirmLabel={editingId ? "Salvar" : "Registrar"}
        onConfirm={handleAdd}
      />
    </div>
  );
}
