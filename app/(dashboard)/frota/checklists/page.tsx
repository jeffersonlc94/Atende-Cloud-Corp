"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useChecklists, useCreateChecklist, useDeleteChecklist } from "@/hooks/use-fleet";
import {
  tipoChecklistOptions,
  checklistItemTipoOptions,
  checklistItemStatusOptions,
} from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleSelect } from "@/components/frota/vehicle-select";
import { formatDateBR } from "@/lib/format";
import { Trash2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  OK: "OK",
  Atencao: "Atenção",
  NecessitaManutencao: "Necessita manutenção",
};

export default function ChecklistsPage() {
  const { data: checklists = [], isLoading } = useChecklists();
  const createChecklist = useCreateChecklist();
  const deleteChecklist = useDeleteChecklist();

  const [vehicleId, setVehicleId] = useState("");
  const [km, setKm] = useState("");
  const [tipo, setTipo] = useState<(typeof tipoChecklistOptions)[number]>("Diario");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itemStatus, setItemStatus] = useState<Record<string, string>>(
    Object.fromEntries(checklistItemTipoOptions.map((i) => [i, "OK"]))
  );

  async function handleSubmit() {
    if (!vehicleId) {
      toast.error("Selecione um veículo");
      return;
    }
    const kmNumber = parseInt(km, 10);
    if (!km || Number.isNaN(kmNumber) || kmNumber <= 0) {
      toast.error("Informe o KM atual do veículo (maior que zero)");
      return;
    }
    try {
      await createChecklist.mutateAsync({
        vehicleId,
        km: kmNumber,
        tipo,
        data,
        hora,
        observacoes,
        itens: checklistItemTipoOptions.map((item) => ({
          item,
          status: itemStatus[item] as (typeof checklistItemStatusOptions)[number],
        })),
      });
      toast.success("Checklist registrado");
      setVehicleId("");
      setKm("");
      setObservacoes("");
      setItemStatus(Object.fromEntries(checklistItemTipoOptions.map((i) => [i, "OK"])));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar checklist");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
        <p className="text-sm text-muted-foreground">Inspeções diárias, semanais e mensais da frota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo checklist</CardTitle>
          <CardDescription>Informe o veículo e o KM atual antes de preencher os itens de inspeção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-5">
            <div className="space-y-1">
              <Label>Veículo *</Label>
              <VehicleSelect value={vehicleId} onChange={setVehicleId} />
            </div>
            <div className="space-y-1">
              <Label>KM Atual *</Label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 45000"
                value={km}
                onChange={(e) => setKm(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoChecklistOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hora</Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {checklistItemTipoOptions.map((item) => (
              <div key={item} className="space-y-1">
                <Label>{item}</Label>
                <Select
                  value={itemStatus[item]}
                  onValueChange={(v) => setItemStatus((s) => ({ ...s, [item]: v ?? "OK" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {checklistItemStatusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} disabled={createChecklist.isPending}>
            Registrar checklist
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && checklists.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum checklist registrado ainda.</p>
          )}
          {checklists.map((c) => (
            <div key={c.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {c.vehicle.placa} — {c.tipo} — {formatDateBR(c.data)} {c.hora || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Por: {c.user?.name ?? "—"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteChecklist.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.itens.map((i) => (
                  <Badge
                    key={i.id}
                    variant={
                      i.status === "OK"
                        ? "secondary"
                        : i.status === "Atencao"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {i.item}: {statusLabels[i.status]}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
