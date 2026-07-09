"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVehicles } from "@/hooks/use-vehicles";
import { useOilChanges, useCreateOilChange, useDeleteOilChange } from "@/hooks/use-fleet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Trash2 } from "lucide-react";

export default function TrocaOleoPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: items = [], isLoading } = useOilChanges();
  const createOil = useCreateOilChange();
  const deleteOil = useDeleteOilChange();

  const [form, setForm] = useState({
    vehicleId: "",
    data: new Date().toISOString().slice(0, 10),
    km: "",
    tipoOleo: "",
    oficina: "",
    valor: "",
    kmProximaTroca: "",
  });

  async function handleAdd() {
    if (!form.vehicleId || !form.km) {
      toast.error("Selecione o veículo e informe o KM");
      return;
    }
    try {
      await createOil.mutateAsync({
        vehicleId: form.vehicleId,
        data: form.data,
        km: parseInt(form.km, 10),
        tipoOleo: form.tipoOleo,
        oficina: form.oficina,
        valor: form.valor ? parseFloat(form.valor) : undefined,
        kmProximaTroca: form.kmProximaTroca ? parseInt(form.kmProximaTroca, 10) : undefined,
      });
      toast.success("Troca de óleo registrada");
      setForm({ vehicleId: "", data: new Date().toISOString().slice(0, 10), km: "", tipoOleo: "", oficina: "", valor: "", kmProximaTroca: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
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
          <CardTitle>Nova troca de óleo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <Label>Veículo *</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v ?? "" })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>KM *</Label>
              <Input type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
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
              <Input type="number" value={form.kmProximaTroca} onChange={(e) => setForm({ ...form, kmProximaTroca: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={createOil.isPending}>
            Registrar
          </Button>
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
              <Button variant="ghost" size="icon" onClick={() => deleteOil.mutate(o.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
