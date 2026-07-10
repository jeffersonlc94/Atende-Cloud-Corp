"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useVehicle } from "@/hooks/use-vehicles";
import {
  useMileageLogs,
  useCreateMileageLog,
  useOilChanges,
  useCreateOilChange,
  useMaintenances,
  useCreateMaintenance,
  useVehicleDocuments,
  useCreateVehicleDocument,
  useDeleteVehicleDocument,
} from "@/hooks/use-fleet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { tipoDocumentoOptions } from "@/lib/validations";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function VeiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: vehicle, isLoading } = useVehicle(id);

  if (isLoading || !vehicle) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const lastOil = (vehicle as unknown as { oilChanges?: { km: number; kmProximaTroca: number | null }[] })
    .oilChanges?.[0];
  const progress =
    lastOil?.kmProximaTroca && lastOil.kmProximaTroca > lastOil.km
      ? Math.min(
          100,
          Math.max(
            0,
            ((vehicle.kmAtual - lastOil.km) / (lastOil.kmProximaTroca - lastOil.km)) * 100
          )
        )
      : 0;
  const oilOverdue = !!lastOil?.kmProximaTroca && vehicle.kmAtual >= lastOil.kmProximaTroca;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/frota/veiculos" className="text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Voltar
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {vehicle.placa} — {vehicle.marca} {vehicle.modelo}
          </h1>
        </div>
        <Badge
          variant={
            vehicle.situacao === "Ativo"
              ? "default"
              : vehicle.situacao === "Manutencao"
              ? "outline"
              : "secondary"
          }
        >
          {vehicle.situacao === "Manutencao" ? "Manutenção" : vehicle.situacao}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            {vehicle.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vehicle.fotoUrl} alt="" className="h-16 w-16 rounded object-cover border" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded border text-xs text-muted-foreground">
                Sem foto
              </div>
            )}
            <div className="text-sm">
              <p>Ano: {vehicle.ano}</p>
              <p>Cor: {vehicle.cor || "—"}</p>
              <p>Combustível: {vehicle.combustivel}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="text-muted-foreground">Empresa responsável</p>
            <p className="font-medium">
              {vehicle.company.nomeFantasia || vehicle.company.razaoSocial}
            </p>
            <p className="mt-2 text-muted-foreground">KM atual</p>
            <p className="font-medium">{vehicle.kmAtual.toLocaleString("pt-BR")} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="text-muted-foreground">Próxima troca de óleo</p>
            {lastOil?.kmProximaTroca ? (
              <>
                <Progress value={progress} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {vehicle.kmAtual.toLocaleString("pt-BR")} /{" "}
                  {lastOil.kmProximaTroca.toLocaleString("pt-BR")} km
                </p>
                {oilOverdue && (
                  <p className="mt-1 text-xs font-medium text-destructive">Troca vencida!</p>
                )}
              </>
            ) : (
              <p className="text-sm">Sem registro de troca de óleo</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="km">
        <TabsList variant="line">
          <TabsTrigger value="km">Quilometragem</TabsTrigger>
          <TabsTrigger value="oleo">Troca de óleo</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="km" className="pt-4">
          <MileageTab vehicleId={id} />
        </TabsContent>
        <TabsContent value="oleo" className="pt-4">
          <OilTab vehicleId={id} />
        </TabsContent>
        <TabsContent value="manutencoes" className="pt-4">
          <MaintenanceTab vehicleId={id} />
        </TabsContent>
        <TabsContent value="documentos" className="pt-4">
          <DocumentsTab vehicleId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MileageTab({ vehicleId }: { vehicleId: string }) {
  const { data: logs = [] } = useMileageLogs(vehicleId);
  const createLog = useCreateMileageLog();
  const [km, setKm] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  async function handleAdd() {
    if (!km) return;
    try {
      await createLog.mutateAsync({ vehicleId, km: parseInt(km, 10), data });
      setKm("");
      toast.success("Quilometragem registrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de quilometragem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>KM</Label>
            <Input type="number" value={km} onChange={(e) => setKm(e.target.value)} className="w-32" />
          </div>
          <Button onClick={handleAdd} disabled={createLog.isPending}>
            Registrar
          </Button>
        </div>
        <div className="space-y-1">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum registro de KM ainda.</p>
          )}
          {logs.map((l) => (
            <div key={l.id} className="flex justify-between border-b py-1 text-sm last:border-0">
              <span>{formatDateBR(l.data)}</span>
              <span className="font-medium">{l.km.toLocaleString("pt-BR")} km</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OilTab({ vehicleId }: { vehicleId: string }) {
  const { data: items = [] } = useOilChanges(vehicleId);
  const createOil = useCreateOilChange();
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    km: "",
    tipoOleo: "",
    oficina: "",
    valor: "",
    kmProximaTroca: "",
  });

  async function handleAdd() {
    if (!form.km) return;
    try {
      await createOil.mutateAsync({
        vehicleId,
        data: form.data,
        km: parseInt(form.km, 10),
        tipoOleo: form.tipoOleo,
        oficina: form.oficina,
        valor: form.valor ? parseFloat(form.valor) : undefined,
        kmProximaTroca: form.kmProximaTroca ? parseInt(form.kmProximaTroca, 10) : undefined,
      });
      setForm({ data: new Date().toISOString().slice(0, 10), km: "", tipoOleo: "", oficina: "", valor: "", kmProximaTroca: "" });
      toast.success("Troca de óleo registrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trocas de óleo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <Label>Data</Label>
            <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>KM</Label>
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
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Próxima troca (KM)</Label>
            <Input type="number" value={form.kmProximaTroca} onChange={(e) => setForm({ ...form, kmProximaTroca: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={createOil.isPending}>
          Registrar troca
        </Button>

        <div className="space-y-1 pt-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma troca registrada ainda.</p>
          )}
          {items.map((o) => (
            <div key={o.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm last:border-0">
              <span>{formatDateBR(o.data)} — {o.km.toLocaleString("pt-BR")} km</span>
              <span>{o.tipoOleo || "—"} • {o.oficina || "—"}</span>
              <span>{o.valor ? formatCurrencyBRL(Number(o.valor)) : "—"}</span>
              <span>Próxima: {o.kmProximaTroca ? `${o.kmProximaTroca.toLocaleString("pt-BR")} km` : "—"}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceTab({ vehicleId }: { vehicleId: string }) {
  const { data: items = [] } = useMaintenances(vehicleId);
  const createMaintenance = useCreateMaintenance();
  const [form, setForm] = useState({
    tipo: "",
    data: new Date().toISOString().slice(0, 10),
    oficina: "",
    valor: "",
    km: "",
    descricao: "",
  });

  async function handleAdd() {
    if (!form.tipo) return;
    try {
      await createMaintenance.mutateAsync({
        vehicleId,
        tipo: form.tipo,
        data: form.data,
        oficina: form.oficina,
        valor: form.valor ? parseFloat(form.valor) : undefined,
        km: form.km ? parseInt(form.km, 10) : undefined,
        descricao: form.descricao,
      });
      setForm({ tipo: "", data: new Date().toISOString().slice(0, 10), oficina: "", valor: "", km: "", descricao: "" });
      toast.success("Manutenção registrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manutenções</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
        <Button onClick={handleAdd} disabled={createMaintenance.isPending}>
          Registrar manutenção
        </Button>

        <div className="space-y-1 pt-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada ainda.</p>
          )}
          {items.map((m) => (
            <div key={m.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm last:border-0">
              <span>{formatDateBR(m.data)} — {m.tipo}</span>
              <span>{m.oficina || "—"}</span>
              <span>{m.valor ? formatCurrencyBRL(Number(m.valor)) : "—"}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentsTab({ vehicleId }: { vehicleId: string }) {
  const { data: docs = [] } = useVehicleDocuments(vehicleId);
  const createDoc = useCreateVehicleDocument(vehicleId);
  const deleteDoc = useDeleteVehicleDocument(vehicleId);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [tipo, setTipo] = useState<(typeof tipoDocumentoOptions)[number]>("CRLV");
  const [dataVencimento, setDataVencimento] = useState("");
  const [uploading, setUploading] = useState(false);
  const [arquivoUrl, setArquivoUrl] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setArquivoUrl(url);
    } catch {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd() {
    try {
      await createDoc.mutateAsync({ vehicleId, tipo, arquivoUrl, dataVencimento });
      setArquivoUrl("");
      setDataVencimento("");
      toast.success("Documento adicionado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar documento");
    }
  }

  const now = new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos do veículo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipoDocumentoOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Vencimento</Label>
            <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Arquivo</Label>
            <Input type="file" onChange={handleFileChange} disabled={uploading} />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={createDoc.isPending}>
          Adicionar documento
        </Button>

        <div className="space-y-1 pt-2">
          {docs.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum documento cadastrado.</p>
          )}
          {docs.map((d) => {
            const vencido = d.dataVencimento && new Date(d.dataVencimento) < now;
            const vencendo =
              d.dataVencimento &&
              !vencido &&
              new Date(d.dataVencimento) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0">
                <span className="font-medium">{d.tipo}</span>
                <span>
                  {d.dataVencimento ? `Vence em ${formatDateBR(d.dataVencimento)}` : "Sem vencimento"}
                </span>
                {vencido && <Badge variant="destructive">Vencido</Badge>}
                {vencendo && <Badge variant="outline">Vencendo</Badge>}
                <div className="flex items-center gap-2">
                  {d.arquivoUrl && (
                    <a
                      href={d.arquivoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Ver arquivo
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setPendingDelete(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão deste documento?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteDoc.mutate(pendingDelete)}
      />
    </Card>
  );
}
