"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useFuels, useCreateFuel, useDeleteFuel } from "@/hooks/use-fleet";
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
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function AbastecimentosPage() {
  const { data: items = [], isLoading } = useFuels();
  const createFuel = useCreateFuel();
  const deleteFuel = useDeleteFuel();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);

  const [form, setForm] = useState({
    vehicleId: "",
    data: new Date().toISOString().slice(0, 10),
    km: "",
    litros: "",
    valorLitro: "",
    posto: "",
    tipoCombustivel: "Flex" as (typeof combustivelOptions)[number],
  });

  const valorTotal =
    form.litros && form.valorLitro ? parseFloat(form.litros) * parseFloat(form.valorLitro) : 0;

  async function handleAdd() {
    if (!form.vehicleId || !form.litros || !form.valorLitro) {
      toast.error("Preencha veículo, litros e valor por litro");
      return;
    }
    try {
      await createFuel.mutateAsync({
        vehicleId: form.vehicleId,
        data: form.data,
        km: form.km ? parseInt(form.km, 10) : undefined,
        litros: parseFloat(form.litros),
        valorLitro: parseFloat(form.valorLitro),
        posto: form.posto,
        tipoCombustivel: form.tipoCombustivel,
      });
      toast.success("Abastecimento registrado");
      setForm({
        vehicleId: "",
        data: new Date().toISOString().slice(0, 10),
        km: "",
        litros: "",
        valorLitro: "",
        posto: "",
        tipoCombustivel: "Flex",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
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
          <CardTitle>Novo abastecimento</CardTitle>
          <CardDescription>Registre litros, valor e posto de abastecimento</CardDescription>
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
          <Button
            onClick={() => {
              if (!form.vehicleId || !form.litros || !form.valorLitro) {
                toast.error("Preencha veículo, litros e valor por litro");
                return;
              }
              setConfirmAddOpen(true);
            }}
            disabled={createFuel.isPending}
          >
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
                  <TableHead>Data</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Valor/litro</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Posto</TableHead>
                  <TableHead className="w-10" />
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
                      <Button variant="ghost" size="icon" onClick={() => setPendingDelete(f.id)}>
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
        title="Confirma a exclusão deste abastecimento?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteFuel.mutate(pendingDelete)}
      />
      <ConfirmDialog
        open={confirmAddOpen}
        onOpenChange={setConfirmAddOpen}
        title="Confirma o registro deste abastecimento?"
        confirmLabel="Registrar"
        onConfirm={handleAdd}
      />
    </div>
  );
}
